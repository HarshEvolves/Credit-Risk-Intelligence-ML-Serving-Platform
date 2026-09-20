"""SHAP-based explanation for a single prediction.

`explain_prediction` is the function Phase 7's FastAPI `/predict` endpoint will call:
give it the fitted model and one already-preprocessed row, get back a plain-dict,
JSON-serializable explanation — no raw SHAP objects leak out.
"""

import numpy as np
import shap

_explainer_cache = {}


def _get_explainer(model):
    key = id(model)
    if key not in _explainer_cache:
        _explainer_cache[key] = shap.TreeExplainer(model)
    return _explainer_cache[key]


def _clean_name(name: str) -> str:
    # ColumnTransformer prefixes names like "numeric__PAY_0" -> "PAY_0"
    return name.split("__", 1)[-1]


def explain_prediction(model, preprocessed_row, feature_names, top_n: int = 5) -> dict:
    row = np.asarray(preprocessed_row)
    if row.ndim == 1:
        row = row.reshape(1, -1)

    explainer = _get_explainer(model)
    shap_values = explainer.shap_values(row)[0, :, 1]  # positive ("default") class, single row
    proba = float(model.predict_proba(row)[0, 1])

    contributors = sorted(
        zip(feature_names, row[0], shap_values),
        key=lambda item: abs(item[2]),
        reverse=True,
    )[:top_n]

    return {
        "prediction_proba": proba,
        "top_contributors": [
            {
                "feature": _clean_name(name),
                "value": float(value),
                "contribution": float(shap_value),
                "direction": "increases risk" if shap_value > 0 else "decreases risk",
            }
            for name, value, shap_value in contributors
        ],
    }


if __name__ == "__main__":
    import joblib

    try:
        from .load_data import load_raw_data
        from .preprocessing import load_preprocessor, split_raw_data
    except ImportError:
        from load_data import load_raw_data
        from preprocessing import load_preprocessor, split_raw_data

    preprocessor = load_preprocessor()
    model = joblib.load("model/model.pkl")
    names = [n.split("__", 1)[-1] for n in preprocessor.named_steps["column_transform"].get_feature_names_out()]

    df = load_raw_data()
    X_train_raw, X_test_raw, _, _ = split_raw_data(df)
    row = preprocessor.transform(X_test_raw.iloc[[0]])

    result = explain_prediction(model, row, names, top_n=5)
    assert 0.0 <= result["prediction_proba"] <= 1.0
    assert len(result["top_contributors"]) == 5
    assert all(c["direction"] in ("increases risk", "decreases risk") for c in result["top_contributors"])
    print("explain_prediction smoke test OK:", result)
