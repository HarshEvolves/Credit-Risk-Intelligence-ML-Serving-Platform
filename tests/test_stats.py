"""Tests for GET /stats — run against a real Postgres, not a mock, since the whole
point is real aggregation over logged rows. Point DATABASE_URL at a reachable
Postgres before running these (see README's "Running tests" section).
"""

from fastapi.testclient import TestClient
from sqlalchemy import text

from api.db import engine
from api.main import app

client = TestClient(app)

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


def _truncate_tables():
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE predictions, errors RESTART IDENTITY"))


def test_stats_on_empty_db_does_not_crash():
    _truncate_tables()

    response = client.get("/stats")
    assert response.status_code == 200

    body = response.json()
    assert body["total_requests"] == 0
    assert body["requests_last_24h"] == 0
    assert body["error_count"] == 0
    assert body["error_rate"] == 0.0
    assert body["latency"] == {"mean_ms": None, "p50_ms": None, "p95_ms": None}
    assert body["prediction_distribution"] == {
        "mean_probability": None,
        "pct_high": None,
        "pct_medium": None,
        "pct_low": None,
    }
    assert body["drift_flags"] == []


def test_stats_returns_sensible_numbers_after_real_predictions():
    _truncate_tables()

    for _ in range(5):
        response = client.post("/predict", json=VALID_PAYLOAD)
        assert response.status_code == 200

    bad_payload = dict(VALID_PAYLOAD, SEX=9)  # triggers a logged 422
    client.post("/predict", json=bad_payload)

    response = client.get("/stats")
    assert response.status_code == 200
    body = response.json()

    assert body["total_requests"] == 5
    assert body["requests_last_24h"] == 5
    assert body["error_count"] == 1
    assert 0 < body["error_rate"] < 1

    assert body["latency"]["mean_ms"] > 0
    assert body["latency"]["p50_ms"] > 0
    assert body["latency"]["p95_ms"] > 0

    dist = body["prediction_distribution"]
    assert 0.0 <= dist["mean_probability"] <= 1.0
    assert abs(dist["pct_high"] + dist["pct_medium"] + dist["pct_low"] - 100) < 1e-6


def test_drift_detector_fires_on_synthetic_shift():
    """Feed a batch of requests with LIMIT_BAL artificially inflated well past the
    training distribution and confirm /stats actually flags it — not just that the
    computation runs, but that it fires on a real, known shift and stays quiet on an
    untouched feature (AGE)."""
    _truncate_tables()

    shifted_payload = dict(VALID_PAYLOAD, LIMIT_BAL=1_000_000)  # train mean ~167k, std ~130k
    for _ in range(30):
        response = client.post("/predict", json=shifted_payload)
        assert response.status_code == 200

    response = client.get("/stats")
    assert response.status_code == 200
    drift_flags = response.json()["drift_flags"]

    flagged_features = {flag["feature"] for flag in drift_flags}
    assert "LIMIT_BAL" in flagged_features
    assert "AGE" not in flagged_features  # untouched, should stay quiet

    limit_bal_flag = next(f for f in drift_flags if f["feature"] == "LIMIT_BAL")
    assert limit_bal_flag["production_mean"] == 1_000_000
    assert limit_bal_flag["diff"] > limit_bal_flag["threshold"]
