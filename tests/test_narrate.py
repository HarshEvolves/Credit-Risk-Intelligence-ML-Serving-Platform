"""Tests for src/narrate.py and its wiring into POST /predict.

The Groq HTTP call is mocked throughout — none of this needs a real GROQ_API_KEY or
network access. See the README's "Phase 10: Risk narratives" section for how to run one
live end-to-end call against the real Groq API if you have a key.
"""

from unittest.mock import MagicMock, patch

import requests
from fastapi.testclient import TestClient

from api.main import app
from src.narrate import _build_user_prompt, generate_risk_narrative

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

TOP_CONTRIBUTORS = [
    {"feature": "PAY_0", "value": 1.793, "contribution": 0.0729, "direction": "increases risk"},
    {"feature": "weighted_avg_pay_status", "value": 2.242, "contribution": 0.0698, "direction": "increases risk"},
]


# --- prompt construction -----------------------------------------------------------------


def test_build_user_prompt_grounds_in_shap_contributors_only():
    prompt = _build_user_prompt(0.983, "HIGH", TOP_CONTRIBUTORS)

    assert "0.983" in prompt
    assert "HIGH" in prompt
    assert "PAY_0" in prompt
    assert "increases risk" in prompt
    assert "weighted_avg_pay_status" in prompt
    assert "0.0729" in prompt or "0.073" in prompt


# --- generate_risk_narrative: graceful failure paths --------------------------------------


def test_missing_api_key_returns_none_without_calling_groq(monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    with patch("src.narrate.requests.post") as mock_post:
        result = generate_risk_narrative(0.983, "HIGH", TOP_CONTRIBUTORS)

    assert result is None
    mock_post.assert_not_called()


def test_timeout_returns_none(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "fake-key")
    with patch("src.narrate.requests.post", side_effect=requests.exceptions.Timeout):
        result = generate_risk_narrative(0.983, "HIGH", TOP_CONTRIBUTORS)

    assert result is None


def test_http_error_returns_none(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "fake-key")
    mock_response = MagicMock()
    mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError("429 rate limited")
    with patch("src.narrate.requests.post", return_value=mock_response):
        result = generate_risk_narrative(0.983, "HIGH", TOP_CONTRIBUTORS)

    assert result is None


def test_successful_call_returns_content_and_sends_expected_prompt(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "fake-key")
    mock_response = MagicMock()
    mock_response.raise_for_status.return_value = None
    mock_response.json.return_value = {
        "choices": [{"message": {"content": "  This customer looks risky due to recent delinquency.  "}}]
    }
    with patch("src.narrate.requests.post", return_value=mock_response) as mock_post:
        result = generate_risk_narrative(0.983, "HIGH", TOP_CONTRIBUTORS)

    assert result == "This customer looks risky due to recent delinquency."

    _, kwargs = mock_post.call_args
    assert kwargs["headers"]["Authorization"] == "Bearer fake-key"
    messages = kwargs["json"]["messages"]
    assert messages[0]["role"] == "system"
    assert "2-4" in messages[0]["content"]
    assert "approved or denied" in messages[0]["content"]
    assert messages[1]["role"] == "user"
    assert "PAY_0" in messages[1]["content"]
    assert kwargs["timeout"] > 0


# --- POST /predict wiring ------------------------------------------------------------------


def test_predict_without_narrate_never_calls_groq():
    with patch("api.main.generate_risk_narrative") as mock_generate:
        response = client.post("/predict", json=VALID_PAYLOAD)

    assert response.status_code == 200
    assert response.json()["risk_narrative"] is None
    mock_generate.assert_not_called()


def test_predict_with_narrate_true_includes_generated_narrative():
    with patch("api.main.generate_risk_narrative", return_value="Elevated risk driven by recent delinquency.") as mock_generate:
        response = client.post("/predict?narrate=true", json=VALID_PAYLOAD)

    assert response.status_code == 200
    body = response.json()
    assert body["risk_narrative"] == "Elevated risk driven by recent delinquency."
    mock_generate.assert_called_once()


def test_predict_with_narrate_true_survives_groq_failure():
    """Core /predict response must be unaffected even when Groq generation fails outright."""
    with patch("api.main.generate_risk_narrative", return_value=None):
        response = client.post("/predict?narrate=true", json=VALID_PAYLOAD)

    assert response.status_code == 200
    body = response.json()
    assert body["risk_narrative"] is None
    assert 0.0 <= body["default_probability"] <= 1.0
    assert len(body["top_contributors"]) == 5
