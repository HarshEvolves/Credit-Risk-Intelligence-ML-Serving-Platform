# Credit Risk Intelligence & ML Serving Platform

**Phase 1: repo setup + data ingestion. Phase 2: EDA. Phase 3: preprocessing + feature engineering.
Phase 4: model training + evaluation. Phase 5: cost-based threshold + fairness audit.
Phase 6: SHAP explainability. Phase 7: FastAPI service. Phase 8: Postgres logging + Docker.**

Dataset: [UCI Default of Credit Card Clients](https://archive.ics.uci.edu/dataset/350/default+of+credit+card+clients) — 30,000 rows, 24 features, target `default.payment.next.month`.

## Setup

\`\`\`bash
pip install -r requirements.txt
\`\`\`

## Usage

\`\`\`python
from src.load_data import load_raw_data

df = load_raw_data()  # 30000 x 25 DataFrame
\`\`\`

Run the inspection script to sanity-check the raw data:

\`\`\`bash
python src/inspect_data.py
\`\`\`

Build the train/test split, fit the preprocessing pipeline (feature engineering +
encoding/scaling), and save it to \`model/preprocessor.pkl\`:

\`\`\`bash
python -m src.preprocessing
\`\`\`

Run as a module (\`-m src.preprocessing\`, not the bare script path) so the pickled
pipeline resolves \`src.features\` the same way calling code will import it later.

\`\`\`python
from src.preprocessing import load_preprocessor

preprocessor = load_preprocessor()
X = preprocessor.transform(raw_single_row_df)  # raw feature columns in, encoded/scaled array out
\`\`\`

## API

Run from the project root, same reasoning as above — \`src\` (and the sibling \`api\` package)
need to be importable as top-level packages, which \`-m\` guarantees regardless of cwd quirks:

\`\`\`bash
python -m uvicorn api.main:app --reload
\`\`\`

\`\`\`bash
curl http://127.0.0.1:8000/health
\`\`\`

\`\`\`bash
curl http://127.0.0.1:8000/model-info
\`\`\`

\`\`\`bash
curl -X POST http://127.0.0.1:8000/predict \\
  -H "Content-Type: application/json" \\
  -d '{
    "LIMIT_BAL": 20000, "SEX": 2, "EDUCATION": 2, "MARRIAGE": 1, "AGE": 24,
    "PAY_0": 2, "PAY_2": 2, "PAY_3": -1, "PAY_4": -1, "PAY_5": -2, "PAY_6": -2,
    "BILL_AMT1": 3913, "BILL_AMT2": 3102, "BILL_AMT3": 689, "BILL_AMT4": 0, "BILL_AMT5": 0, "BILL_AMT6": 0,
    "PAY_AMT1": 0, "PAY_AMT2": 689, "PAY_AMT3": 0, "PAY_AMT4": 0, "PAY_AMT5": 0, "PAY_AMT6": 0
  }'
\`\`\`

\`/predict\` returns \`default_probability\`, a \`default_flag\` (thresholded at the Phase 5
production threshold from \`model/model_info.json\`), a \`risk_category\` band (LOW/MEDIUM/HIGH),
and the top 5 SHAP \`top_contributors\` driving that specific prediction. Every call is also
logged to Postgres (see below) — a DB write failure never breaks the response, it's just logged.

Run the test suite:

\`\`\`bash
python -m pytest tests/
\`\`\`

## Docker (API + Postgres)

\`\`\`bash
cp .env.example .env
docker compose up --build
\`\`\`

That builds the API image, starts Postgres (named volume \`pgdata\`, healthchecked so the
API waits for it to actually accept connections rather than just start), waits for it to
report healthy, then starts the API — which creates the \`predictions\` table itself on
startup. The API is published on \`http://127.0.0.1:8001\` by default (\`API_PORT\` in \`.env\`);
Postgres is not published to the host — the API reaches it over the internal Docker network
by service name (\`postgres\`), not \`localhost\`.

\`\`\`bash
curl http://127.0.0.1:8001/health
curl -X POST http://127.0.0.1:8001/predict \\
  -H "Content-Type: application/json" \\
  -d '{
    "LIMIT_BAL": 20000, "SEX": 2, "EDUCATION": 2, "MARRIAGE": 1, "AGE": 24,
    "PAY_0": 2, "PAY_2": 2, "PAY_3": -1, "PAY_4": -1, "PAY_5": -2, "PAY_6": -2,
    "BILL_AMT1": 3913, "BILL_AMT2": 3102, "BILL_AMT3": 689, "BILL_AMT4": 0, "BILL_AMT5": 0, "BILL_AMT6": 0,
    "PAY_AMT1": 0, "PAY_AMT2": 689, "PAY_AMT3": 0, "PAY_AMT4": 0, "PAY_AMT5": 0, "PAY_AMT6": 0
  }'
curl http://127.0.0.1:8001/predictions/recent   # confirms the row above actually got logged
\`\`\`

Note: \`requirements-api.txt\` (used by the Dockerfile, not \`requirements.txt\`) intentionally
excludes \`xgboost\`, \`jupyter\`, \`matplotlib\`, and \`seaborn\` — none of them are imported by
\`api/\` or \`src/\` at runtime, and \`xgboost\` in particular pulls in an unconditional ~250MB
Linux CUDA dependency (\`nvidia-nccl-cu13\`) that's dead weight for a CPU-only Random Forest.
Dropping it (not a multi-stage build — nothing here needs a compiler) cut the image from
1.78GB to 1.08GB. Versions in \`requirements-api.txt\` are pinned to what actually fit and
pickled \`model/*.pkl\`, since scikit-learn changed its pickle format between 1.6 and 1.9.
