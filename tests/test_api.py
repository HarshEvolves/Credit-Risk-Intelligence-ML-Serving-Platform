import json
from pathlib import Path

from fastapi.testclient import TestClient

from api.main import app

client = TestClient(app)

MODEL_INFO_PATH = Path(__file__).resolve().parent.parent / "model" / "model_info.json"

VALID_PAYLOAD = {
    "LIMIT_BAL": 20000,
    "SEX": 2,
    "EDUCATION": 2,
    "MARRIAGE": 1,
    "AGE": 24,
    "PAY_0": 2,
    "PAY_2": 2,
    "PAY_3": -1,
    "PAY_4": -1,
    "PAY_5": -2,
    "PAY_6": -2,
    "BILL_AMT1": 3913,
    "BILL_AMT2": 3102,
    "BILL_AMT3": 689,
    "BILL_AMT4": 0,
    "BILL_AMT5": 0,
    "BILL_AMT6": 0,
    "PAY_AMT1": 0,
    "PAY_AMT2": 689,
    "PAY_AMT3": 0,
    "PAY_AMT4": 0,
    "PAY_AMT5": 0,
    "PAY_AMT6": 0,
}


def test_predict_valid_request_returns_sensible_response():
    response = client.post("/predict", json=VALID_PAYLOAD)
    assert response.status_code == 200

    body = response.json()
    assert 0.0 <= body["default_probability"] <= 1.0
    assert isinstance(body["default_flag"], bool)
    assert body["risk_category"] in ("LOW", "MEDIUM", "HIGH")
    assert isinstance(body["model_version"], str) and body["model_version"]
    assert len(body["top_contributors"]) == 5
    for contributor in body["top_contributors"]:
        assert set(contributor) == {"feature", "value", "contribution", "direction"}
        assert contributor["direction"] in ("increases risk", "decreases risk")


def test_predict_invalid_request_returns_422():
    bad_payload = dict(VALID_PAYLOAD, SEX=9)  # SEX must be 1 or 2
    response = client.post("/predict", json=bad_payload)
    assert response.status_code == 422


def test_model_info_matches_saved_file():
    response = client.get("/model-info")
    assert response.status_code == 200

    with open(MODEL_INFO_PATH) as f:
        expected = json.load(f)

    assert response.json() == expected
