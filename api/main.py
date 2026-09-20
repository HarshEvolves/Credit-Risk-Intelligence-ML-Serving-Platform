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
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.explain import explain_prediction
from src.narrate import generate_risk_narrative
from src.preprocessing import PREPROCESSOR_PATH, load_preprocessor

from .db import get_recent_predictions, init_db, log_error, log_prediction
from .schemas import CustomerRequest, PredictionLogOut, PredictionResponse, StatsResponse
from .stats import compute_stats

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).resolve().parent.parent / "model"
MODEL_INFO_PATH = MODEL_DIR / "model_info.json"

RISK_LOW_MAX = 0.30
RISK_MEDIUM_MAX = 0.60

app = FastAPI(title="Credit Risk Intelligence API")

# Open CORS: this is an unauthenticated demo API with no cookies/credentials involved
# (see frontend/), so there's no session to leak cross-origin — permissive by design,
# not an oversight.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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


def _try_log_error(endpoint: str, status_code: int, detail: str) -> None:
    try:
        log_error(endpoint=endpoint, status_code=status_code, detail=detail)
    except Exception:
        logger.exception("failed to log error to the database")


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    _try_log_error(endpoint=request.url.path, status_code=422, detail=str(exc))
    return await request_validation_exception_handler(request, exc)


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception):
    _try_log_error(endpoint=request.url.path, status_code=500, detail=str(exc))
    logger.exception("unhandled error in %s", request.url.path)
    return JSONResponse(status_code=500, content={"detail": "internal server error"})


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/model-info")
def get_model_info():
    return json.loads(MODEL_INFO_PATH.read_text())


@app.post("/predict", response_model=PredictionResponse)
def predict(
    customer: CustomerRequest,
    narrate: bool = Query(False, description="If true, also generate a plain-English risk narrative via Groq"),
):
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

    # Model-inference latency only — narrative generation (below) is timed separately
    # and never included here, so /stats latency stays uncontaminated by LLM call time.
    latency_ms = (time.perf_counter() - start) * 1000

    narrative_latency_ms = None
    if narrate:
        narrative_start = time.perf_counter()
        response.risk_narrative = generate_risk_narrative(
            response.default_probability, response.risk_category, explanation["top_contributors"]
        )
        narrative_latency_ms = (time.perf_counter() - narrative_start) * 1000

    try:
        log_prediction(
            model_version=response.model_version,
            default_probability=response.default_probability,
            risk_category=response.risk_category,
            default_flag=response.default_flag,
            latency_ms=latency_ms,
            narrative_latency_ms=narrative_latency_ms,
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


@app.get("/stats", response_model=StatsResponse)
def stats():
    try:
        return compute_stats()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"database unavailable: {exc}") from exc
