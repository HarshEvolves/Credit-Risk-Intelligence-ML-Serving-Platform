"""FastAPI service for the credit default model.

Run from the project root as `python -m uvicorn api.main:app --reload` — the
saved preprocessor pickles a reference to `src.features.engineer_features`
(see src/preprocessing.py), so `src` must be importable as a top-level
package the same way it was when the pipeline was fit and saved.
"""

import json
import logging
import time
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException

from src.explain import explain_prediction
from src.preprocessing import PREPROCESSOR_PATH, load_preprocessor

from .db import get_recent_predictions, init_db, log_prediction
from .schemas import CustomerRequest, PredictionLogOut, PredictionResponse

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).resolve().parent.parent / "model"
MODEL_INFO_PATH = MODEL_DIR / "model_info.json"

RISK_LOW_MAX = 0.30
RISK_MEDIUM_MAX = 0.60

app = FastAPI(title="Credit Risk Intelligence API")

# Loaded once at import time, not per-request.
preprocessor = load_preprocessor(PREPROCESSOR_PATH)
model = joblib.load(MODEL_DIR / "model.pkl")
model_info = json.loads(MODEL_INFO_PATH.read_text())
production_threshold = model_info["production_threshold"]
feature_names = [
    name.split("__", 1)[-1] for name in preprocessor.named_steps["column_transform"].get_feature_names_out()
]

try:
    init_db()
except Exception:
    logger.exception("could not initialize the predictions table; DB may be unavailable")


def _risk_category(proba: float) -> str:
    if proba < RISK_LOW_MAX:
        return "LOW"
    if proba < RISK_MEDIUM_MAX:
        return "MEDIUM"
    return "HIGH"


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/model-info")
def get_model_info():
    return json.loads(MODEL_INFO_PATH.read_text())


@app.post("/predict", response_model=PredictionResponse)
def predict(customer: CustomerRequest):
    start = time.perf_counter()  # request is already parsed/validated by this point

    raw_row = pd.DataFrame([customer.model_dump()])
    # engineer_features is already the pipeline's first step (see src/preprocessing.py),
    # so a single transform() call does feature engineering + encoding/scaling.
    processed_row = preprocessor.transform(raw_row)

    proba = float(model.predict_proba(processed_row)[0, 1])
    explanation = explain_prediction(model, processed_row, feature_names, top_n=5)

    response = PredictionResponse(
        default_probability=proba,
        default_flag=proba >= production_threshold,
        risk_category=_risk_category(proba),
        model_version=model_info["version"],
        top_contributors=explanation["top_contributors"],
    )

    latency_ms = (time.perf_counter() - start) * 1000
    try:
        log_prediction(
            model_version=response.model_version,
            default_probability=response.default_probability,
            risk_category=response.risk_category,
            default_flag=response.default_flag,
            latency_ms=latency_ms,
            input_payload=customer.model_dump(),
        )
    except Exception:
        logger.exception("failed to log prediction to the database")

    return response


@app.get("/predictions/recent", response_model=list[PredictionLogOut])
def predictions_recent(limit: int = 20):
    try:
        rows = get_recent_predictions(limit)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"database unavailable: {exc}") from exc
    return rows
