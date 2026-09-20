from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class CustomerRequest(BaseModel):
    """Raw feature input, one row of the same schema the preprocessor was trained on."""

    LIMIT_BAL: float = Field(..., gt=0, description="Credit limit (NT dollar)")
    SEX: int = Field(..., ge=1, le=2, description="1=male, 2=female")
    EDUCATION: int = Field(..., ge=0, le=6, description="1=grad school, 2=university, 3=high school, 4=others (0/5/6 undocumented)")
    MARRIAGE: int = Field(..., ge=0, le=3, description="1=married, 2=single, 3=others (0 undocumented)")
    AGE: int = Field(..., gt=0, le=120)

    PAY_0: int = Field(..., ge=-2, le=8, description="Repayment status, most recent month")
    PAY_2: int = Field(..., ge=-2, le=8)
    PAY_3: int = Field(..., ge=-2, le=8)
    PAY_4: int = Field(..., ge=-2, le=8)
    PAY_5: int = Field(..., ge=-2, le=8)
    PAY_6: int = Field(..., ge=-2, le=8)

    BILL_AMT1: float = Field(..., ge=-1_000_000)
    BILL_AMT2: float = Field(..., ge=-1_000_000)
    BILL_AMT3: float = Field(..., ge=-1_000_000)
    BILL_AMT4: float = Field(..., ge=-1_000_000)
    BILL_AMT5: float = Field(..., ge=-1_000_000)
    BILL_AMT6: float = Field(..., ge=-1_000_000)

    PAY_AMT1: float = Field(..., ge=0)
    PAY_AMT2: float = Field(..., ge=0)
    PAY_AMT3: float = Field(..., ge=0)
    PAY_AMT4: float = Field(..., ge=0)
    PAY_AMT5: float = Field(..., ge=0)
    PAY_AMT6: float = Field(..., ge=0)

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
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
            ]
        }
    }


class Contributor(BaseModel):
    feature: str
    value: float
    contribution: float
    direction: str


class PredictionResponse(BaseModel):
    default_probability: float
    default_flag: bool = Field(..., description="True if default_probability >= production threshold")
    risk_category: str = Field(..., description="LOW <30%, MEDIUM 30-60%, HIGH >=60%")
    model_version: str
    top_contributors: list[Contributor]
    risk_narrative: str | None = Field(
        None, description="Plain-English narrative from top_contributors, only present when ?narrate=true succeeds"
    )


class PredictionLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    timestamp: datetime
    model_version: str
    default_probability: float
    risk_category: str
    default_flag: bool
    latency_ms: float
    narrative_latency_ms: float | None = None
    input_payload: dict[str, Any]


class LatencyStats(BaseModel):
    mean_ms: float | None
    p50_ms: float | None
    p95_ms: float | None


class PredictionDistribution(BaseModel):
    mean_probability: float | None
    pct_high: float | None
    pct_medium: float | None
    pct_low: float | None


class DriftFlag(BaseModel):
    feature: str
    training_mean: float
    production_mean: float
    threshold: float
    diff: float


class StatsResponse(BaseModel):
    total_requests: int
    requests_last_24h: int
    error_count: int
    error_rate: float
    latency: LatencyStats
    prediction_distribution: PredictionDistribution
    drift_flags: list[DriftFlag]
