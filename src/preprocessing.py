"""Train/test split + preprocessing pipeline for the credit default model.

The pipeline takes a raw-feature DataFrame (the same columns a single API
request would carry) and runs feature engineering + encoding/scaling in one
fitted object, so it can be reused as-is at inference time.
"""

from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, OneHotEncoder, RobustScaler, StandardScaler

try:
    from .features import BILL_COLS, ENGINEERED_COLS, PAY_AMT_COLS, PAY_COLS, engineer_features
except ImportError:
    from features import BILL_COLS, ENGINEERED_COLS, PAY_AMT_COLS, PAY_COLS, engineer_features

TARGET = "default.payment.next.month"
CATEGORICAL_COLS = ["SEX", "EDUCATION", "MARRIAGE"]
SKEWED_COLS = BILL_COLS + PAY_AMT_COLS  # right-skewed w/ outliers per Phase 2 EDA
NUMERIC_COLS = ["LIMIT_BAL", "AGE"] + PAY_COLS + ENGINEERED_COLS

MODEL_DIR = Path(__file__).resolve().parent.parent / "model"
PREPROCESSOR_PATH = MODEL_DIR / "preprocessor.pkl"


def split_raw_data(df: pd.DataFrame, test_size: float = 0.2, random_state: int = 42):
    X = df.drop(columns=["ID", TARGET])
    y = df[TARGET]
    return train_test_split(X, y, test_size=test_size, stratify=y, random_state=random_state)


def build_pipeline() -> Pipeline:
    column_transform = ColumnTransformer(
        transformers=[
            ("skewed", RobustScaler(), SKEWED_COLS),
            ("categorical", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_COLS),
            ("numeric", StandardScaler(), NUMERIC_COLS),
        ]
    )
    return Pipeline(
        steps=[
            ("feature_engineering", FunctionTransformer(engineer_features)),
            ("column_transform", column_transform),
        ]
    )


def save_preprocessor(pipeline: Pipeline, path: Path = PREPROCESSOR_PATH) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, path)


def load_preprocessor(path: Path = PREPROCESSOR_PATH) -> Pipeline:
    return joblib.load(path)


if __name__ == "__main__":
    # Run as `python -m src.preprocessing` (not `python src/preprocessing.py`) so the
    # pickled pipeline references `src.features`, matching how later code (e.g. the
    # FastAPI service) will import it — otherwise joblib.load fails to resolve the module.
    try:
        from .load_data import load_raw_data
    except ImportError:
        from load_data import load_raw_data

    df = load_raw_data()
    X_train, X_test, y_train, y_test = split_raw_data(df)

    pipeline = build_pipeline()
    X_train_processed = pipeline.fit_transform(X_train)
    X_test_processed = pipeline.transform(X_test)

    save_preprocessor(pipeline)

    print(f"X_train: {X_train_processed.shape}, X_test: {X_test_processed.shape}")
    print(f"y_train: {y_train.shape}, y_test: {y_test.shape}")
    print(f"saved preprocessor -> {PREPROCESSOR_PATH}")

    # simulate a single incoming API request
    single_row = X_test.iloc[[0]]
    single_processed = load_preprocessor().transform(single_row)
    assert single_processed.shape[0] == 1
    print(f"single-row transform OK, shape: {single_processed.shape}")
