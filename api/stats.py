"""GET /stats: real numbers computed from logged PredictionLog/ErrorLog rows.

Drift check: flag a feature if |production_mean - training_mean| > 2 * training_std.
Two standard deviations is a standard "this is not just sampling noise" heuristic
(a mean shift that big is unlikely by chance alone) without needing a full statistical
test — simple on purpose, per the brief for this phase.
"""

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np

from .db import ErrorLog, PredictionLog, SessionLocal

TRAINING_STATS_PATH = Path(__file__).resolve().parent.parent / "model" / "training_stats.json"
DRIFT_STD_MULTIPLIER = 2.0

with open(TRAINING_STATS_PATH) as f:
    TRAINING_STATS = json.load(f)


def _percentile(values: list[float], pct: float) -> float | None:
    return float(np.percentile(values, pct)) if values else None


def _drift_flags(predictions: list[PredictionLog]) -> list[dict]:
    flags = []
    for feature, stats in TRAINING_STATS.items():
        values = [p.input_payload[feature] for p in predictions if feature in p.input_payload]
        if not values:
            continue
        production_mean = float(np.mean(values))
        threshold = DRIFT_STD_MULTIPLIER * stats["std"]
        diff = abs(production_mean - stats["mean"])
        if diff > threshold:
            flags.append(
                {
                    "feature": feature,
                    "training_mean": stats["mean"],
                    "production_mean": production_mean,
                    "threshold": threshold,
                    "diff": diff,
                }
            )
    return flags


def compute_stats() -> dict:
    with SessionLocal() as session:
        predictions = session.query(PredictionLog).all()
        error_count = session.query(ErrorLog).count()

    total = len(predictions)
    now = datetime.now(timezone.utc)
    last_24h = sum(1 for p in predictions if p.timestamp >= now - timedelta(hours=24))

    latencies = [p.latency_ms for p in predictions]
    probas = [p.default_probability for p in predictions]
    categories = [p.risk_category for p in predictions]

    total_attempts = total + error_count

    return {
        "total_requests": total,
        "requests_last_24h": last_24h,
        "error_count": error_count,
        "error_rate": error_count / total_attempts if total_attempts else 0.0,
        "latency": {
            "mean_ms": float(np.mean(latencies)) if latencies else None,
            "p50_ms": _percentile(latencies, 50),
            "p95_ms": _percentile(latencies, 95),
        },
        "prediction_distribution": {
            "mean_probability": float(np.mean(probas)) if probas else None,
            "pct_high": 100 * categories.count("HIGH") / total if total else None,
            "pct_medium": 100 * categories.count("MEDIUM") / total if total else None,
            "pct_low": 100 * categories.count("LOW") / total if total else None,
        },
        "drift_flags": _drift_flags(predictions) if total else [],
    }
