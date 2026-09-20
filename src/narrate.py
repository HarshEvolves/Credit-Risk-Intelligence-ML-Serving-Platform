"""LLM-generated plain-English narrative from SHAP top_contributors, via Groq's hosted API.

Narrative generation is opt-in (see the ?narrate=true query param on POST /predict) and
best-effort: a missing API key, a slow/rate-limited/erroring call, or a malformed response
all result in None rather than an exception, so /predict's core SHAP-based response is
never blocked by this.
"""

import logging
import os

import requests

logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
GROQ_TIMEOUT_S = float(os.getenv("GROQ_TIMEOUT_S", "5"))

SYSTEM_PROMPT = (
    "You explain a credit default risk model's output to a bank analyst. You will be given "
    "the model's predicted default probability, a risk category, and its top SHAP feature "
    "contributors (feature, value, contribution, direction). Write 2-4 plain-English sentences "
    "summarizing what drove this specific prediction, using only the features and directions "
    "given to you - never invent a fact, number, or feature not present in the input. "
    "Do not state or imply whether the customer should be approved or denied credit; you are "
    "explaining the model's risk signal, not making a lending decision."
)


def _build_user_prompt(prediction_proba: float, risk_category: str, top_contributors: list[dict]) -> str:
    lines = [
        f"Predicted default probability: {prediction_proba:.3f}",
        f"Risk category: {risk_category}",
        "Top SHAP contributors:",
    ]
    for c in top_contributors:
        lines.append(
            f"- {c['feature']}: value={c['value']:.3f}, contribution={c['contribution']:.4f}, "
            f"direction={c['direction']}"
        )
    return "\n".join(lines)


def generate_risk_narrative(prediction_proba: float, risk_category: str, top_contributors: list[dict]) -> str | None:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None

    try:
        response = requests.post(
            GROQ_API_URL,
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": GROQ_MODEL,
                "reasoning_effort": "low",
                "temperature": 0.3,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": _build_user_prompt(prediction_proba, risk_category, top_contributors)},
                ],
            },
            timeout=GROQ_TIMEOUT_S,
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"].strip()
    except Exception as exc:
        logger.warning("Groq narrative generation failed: %s", exc)
        return None
