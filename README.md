# Credit Risk Intelligence & ML Serving Platform

Given a customer's financial and repayment history, how likely are they to default on
their next credit card payment — and what specifically caused the model to assign that
risk? This project answers both halves of that question: a trained classifier for the
first, and SHAP-based per-prediction explanations for the second, served through a
FastAPI application with Postgres-backed logging, monitoring, and drift detection.

## Dataset

[UCI Default of Credit Card Clients](https://archive.ics.uci.edu/dataset/350/default+of+credit+card+clients)
— 30,000 rows, 24 raw features, target `default.payment.next.month`, with a 22.12% default
rate (6,636 defaulters / 23,364 non-defaulters). It's a benchmark dataset of one Taiwanese
bank's cardholders from 2005, not real, current customer data — treat every number below as
a property of this dataset and this model, not a general claim about lending or borrowers.

## Key EDA finding: repayment history dominates

Of all 24 raw features, `PAY_0` (most recent month's repayment status) has by far the
strongest correlation with the target (+0.325), followed by `PAY_2` through `PAY_6`
(+0.26 down to +0.19) — repayment history six months back still carries real signal.
`LIMIT_BAL` is the next-strongest single feature, but negatively (-0.154): non-defaulters
have a median credit limit of 150,000 vs. 90,000 for defaulters. That's a real, usable
signal, but it comes with a caveat worth stating plainly — `LIMIT_BAL` isn't an independent
risk factor so much as it partly *encodes* the bank's own prior risk assessment of the
customer (banks already extend larger limits to people they judge lower-risk), so the model
is in part learning from a decision another risk model already made.

## Feature engineering that mattered

The most interesting technical result in this project only showed up at the SHAP stage
(Phase 6), not during feature selection. Six months of `PAY_`, `BILL_AMT`, and `PAY_AMT`
columns were aggregated into engineered features — average repayment status, max delay,
count of delinquent months, a recency-weighted repayment score, payment-to-bill ratios,
and credit utilization. The global SHAP importance ranking (mean |SHAP value| across the
6,000-row test set) came out:

| rank | feature | mean \|SHAP\| |
|---|---|---|
| 1 | `max_delay` | 0.038624 |
| 2 | `count_delinquent_months` | 0.038431 |
| 3 | `weighted_avg_pay_status` | 0.035363 |
| 4 | `PAY_0` | 0.035238 |
| 5 | `avg_pay_status` | 0.021625 |

**The three engineered repayment aggregates each individually outrank the raw `PAY_0`
column** — the single feature the EDA (Phase 2) had flagged as the strongest predictor in
the raw dataset. Summarizing repayment behavior across all six months (how many months were
delinquent, how bad was the worst one, weighting the most recent month more heavily) turned
out to carry more model-usable signal than any single month's snapshot on its own, including
the most recent one. This wasn't a foregone conclusion going in — it only became visible
once SHAP was run against the trained model, well after the features had already been
built.

## Model comparison

Logistic Regression, Random Forest, and XGBoost were trained with class imbalance handled
natively (`class_weight='balanced'` for LR/RF, `scale_pos_weight` for XGBoost), evaluated
with stratified 5-fold CV on the training set and again on a held-out test set:

| model | CV ROC-AUC | CV PR-AUC | test ROC-AUC | test PR-AUC | precision | recall | F1 |
|---|---|---|---|---|---|---|---|
| Logistic Regression | 0.7599 ± 0.0066 | 0.5083 ± 0.0164 | 0.7465 | 0.4972 | 0.4436 | 0.6014 | 0.5106 |
| **Random Forest** | **0.7852 ± 0.0052** | **0.5588 ± 0.0060** | **0.7773** | **0.5569** | 0.5146 | 0.5720 | 0.5418 |
| XGBoost | 0.7463 ± 0.0074 | 0.5057 ± 0.0067 | 0.7382 | 0.5026 | 0.4854 | 0.4883 | 0.4869 |

**Random Forest won**, selected on **test PR-AUC** (0.5569) rather than ROC-AUC — PR-AUC is
the more honest metric under 22% class imbalance, since ROC-AUC is inflated by how easy it
is to rank the large true-negative class correctly. Random Forest's CV and test PR-AUC agree
closely (0.5588 vs. 0.5569), so the win isn't a lucky split.

Honest note on XGBoost: it underperformed both other models here, including plain Logistic
Regression, on identical CV folds and preprocessing. That's a sign of **under-tuned
defaults** (`n_estimators=300` with no other hyperparameter search), not evidence that
gradient boosting is fundamentally weaker than Random Forest on this problem — a proper
XGBoost hyperparameter sweep was out of scope for this phase and would likely close or
reverse the gap.

## Cost-based threshold

The default 0.5 classification threshold was never the goal — a decision threshold should
reflect what an error actually costs the business. A cost matrix was defined (illustrative,
not real bank figures): **FN cost = $130,110** (average `LIMIT_BAL` of actual defaulters in
the dataset, a proxy for exposure), **FP cost = $19,516** (15% of FN cost, reflecting the
smaller opportunity cost of lost interest/relationship value from wrongly flagging a good
customer) — a **6.7x** cost ratio. Sweeping thresholds 0.10–0.90 and computing total expected
cost at each, the cost-minimizing threshold is **0.30**, not 0.50:

| threshold | precision | recall | F1 |
|---|---|---|---|
| 0.30 (chosen) | 0.3333 | 0.8191 | 0.4738 |
| 0.50 (default) | 0.5146 | 0.5720 | 0.5418 |

Note that F1 is actually *lower* at the chosen threshold — that's expected and correct, not
a bug: F1 weights precision and recall equally, but the business cost here doesn't. At 0.30,
recall jumps to 0.819 (catching far more real defaulters) at the cost of precision dropping
to 0.333 (more good customers wrongly flagged). Given that missing a defaulter costs 6.7x
what a false flag costs, that trade is the *cheaper* one in expectation, even though it looks
worse on a symmetric metric like F1 — 0.30 is the right threshold because it minimizes actual
expected dollar cost, not because it maximizes any classification metric.

## Fairness audit

At the production threshold (0.30), approval rate (predicted non-default), false negative
rate, and false positive rate were computed by `SEX` and `EDUCATION`. The `SEX` disparate
impact ratio is **0.857** (male approval 41.51% vs. female approval 48.42%) — inside the
80% four-fifths rule, but close enough to the line to flag rather than dismiss, especially
since the false-positive rate is meaningfully higher for males (**50.7%**) than females
(**43.8%**) — men are more often wrongly flagged as risky at this threshold. `EDUCATION`
shows a wider spread (37.3%–63.4% approval across groups), but the highest-approval group
("Others", the undocumented 0/5/6 codes folded together in Phase 3) is only **82 rows** in
the test set — too small a sample to draw a firm conclusion from, and called out as such
rather than treated as a finding.

**This describes one benchmark dataset and one model, not lending fairness generally.** A
real deployment would need to check whether `EDUCATION` or `MARRIAGE` acts as a proxy for
`SEX` (correlate them directly, not just each one's marginal relationship with the target),
re-check the disparity across other thresholds, and question whether the training labels
themselves already encode historically biased approval decisions.

## Explainability

Global SHAP importance (see [Feature engineering that mattered](#feature-engineering-that-mattered)
above) confirms repayment-history features dominate, refining the EDA's finding rather than
just repeating it. The most honest result, though, is a specific local comparison: a true
positive (row 2695, 98.3% predicted risk, correctly flagged) and a false positive (row 5028,
98.1% predicted risk, incorrectly flagged) were driven by **nearly identical top SHAP
features at similarly extreme values** — `PAY_0`, `count_delinquent_months`, and
`weighted_avg_pay_status`, all pushing risk up hard in both cases. One customer defaulted;
the other didn't. This isn't a missing-feature problem or something more engineering would
fix — severe past delinquency correlates strongly with future default but doesn't guarantee
it, and this pair is exactly the kind of case the model will get wrong no matter how it's
tuned. It's the clearest statement in this project of what the model's explanations can and
can't tell you: they explain *why the model* made a decision, not whether that decision was
correct.

## Serving + infra

FastAPI app (`api/`) with four endpoints: `POST /predict` (SHAP-explained prediction),
`GET /health`, `GET /model-info`, `GET /predictions/recent`, plus `GET /stats` for
monitoring (see below). Every prediction and every failed request (422/500) is logged to
Postgres via SQLAlchemy. The API and Postgres run as two Docker Compose services, Postgres
healthchecked so the API waits for it to actually accept connections rather than just start.

### Lessons learned

Two real engineering problems surfaced while containerizing this, worth calling out on
their own rather than burying in a commit message:

- **scikit-learn pickle incompatibility.** `model/*.pkl` were fit with scikit-learn 1.6.1.
  An unpinned `pip install scikit-learn` in the Docker image resolved to 1.9.1, which
  changed the internal pickle format for `ColumnTransformer` — the container crashed on
  startup with `AttributeError: Can't get attribute '_RemainderColsList'`. Fixed by pinning
  `requirements-api.txt` to the exact versions that produced the pickles, not just "recent."
- **XGBoost CUDA bloat.** `xgboost` unconditionally depends on `nvidia-nccl-cu13`
  (~250MB) on Linux — a GPU communication library, pulled in even though this project
  serves a CPU-only Random Forest and doesn't import `xgboost` anywhere in `api/` or `src/`
  at runtime (it was only ever used for the Phase 4 model comparison). Dropping it from the
  serving image cut the image from **1.78GB to 1.08GB**. No multi-stage build was needed to
  get there — the real fix was not shipping an unused dependency, not trimming a build
  toolchain that was never installed in the first place.

## Monitoring

`GET /stats` computes real numbers from the `predictions`/`errors` tables on every call —
no separate metrics store: total request count (all-time and last 24h), latency (mean/p50/
p95), prediction distribution (mean probability, % HIGH/MEDIUM/LOW), error rate, and
`drift_flags`. Drift is checked by comparing the mean of each raw numeric input feature
across all logged production requests against `model/training_stats.json` (computed once
from `X_train`), flagging a feature when `|production_mean − training_mean| > 2 ×
training_std` — a simple "this isn't just sampling noise" heuristic, not a formal
statistical test, chosen deliberately for simplicity over rigor at this stage.

This was **validated, not just implemented**: `tests/test_stats.py::test_drift_detector_fires_on_synthetic_shift`
floods `/predict` with `LIMIT_BAL` inflated to 1,000,000 (training mean ~167k, std ~130k)
and asserts the response actually contains `{"feature": "LIMIT_BAL", ...}` in `drift_flags`,
while confirming an untouched feature (`AGE`) stays unflagged — run against a real Postgres
both via pytest and by hand through the live `docker compose` stack, not asserted from
theory.

## How to run it

```bash
git clone https://github.com/HarshEvolves/Credit-Risk-Intelligence-ML-Serving-Platform.git
cd Credit-Risk-Intelligence-ML-Serving-Platform
cp .env.example .env
docker compose up --build
```

```bash
curl http://127.0.0.1:8001/health
curl http://127.0.0.1:8001/model-info
curl -X POST http://127.0.0.1:8001/predict \
  -H "Content-Type: application/json" \
  -d '{
    "LIMIT_BAL": 20000, "SEX": 2, "EDUCATION": 2, "MARRIAGE": 1, "AGE": 24,
    "PAY_0": 2, "PAY_2": 2, "PAY_3": -1, "PAY_4": -1, "PAY_5": -2, "PAY_6": -2,
    "BILL_AMT1": 3913, "BILL_AMT2": 3102, "BILL_AMT3": 689, "BILL_AMT4": 0, "BILL_AMT5": 0, "BILL_AMT6": 0,
    "PAY_AMT1": 0, "PAY_AMT2": 689, "PAY_AMT3": 0, "PAY_AMT4": 0, "PAY_AMT5": 0, "PAY_AMT6": 0
  }'
curl http://127.0.0.1:8001/predictions/recent
curl http://127.0.0.1:8001/stats
```

Postgres is not published to the host — the API reaches it over the internal Docker network
by service name (`postgres`), not `localhost`. Run the test suite locally with
`python -m pytest tests/`.

**Two known gotchas:**

- If you regenerate `model/preprocessor.pkl`, run it as `python -m src.preprocessing` —
  **not** `python src/preprocessing.py`. The bare-script form pickles the feature-engineering
  function under a plain `features` module name that later package-style imports
  (`from src.preprocessing import ...`, including the API) can't resolve, and `joblib.load`
  fails at startup.
- `tests/test_stats.py` needs a real, reachable Postgres — it asserts on real aggregated
  rows, not mocks. Point `DATABASE_URL` at one before running:
  ```bash
  docker run --rm -d -p 5433:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=credit_risk postgres:16-alpine
  DATABASE_URL="postgresql+psycopg2://postgres:postgres@localhost:5433/credit_risk" python -m pytest tests/
  ```

## Tech stack

- **DS:** pandas, numpy, scikit-learn, XGBoost, SHAP, matplotlib, seaborn, Jupyter
- **Backend:** FastAPI, Pydantic, Uvicorn, SQLAlchemy, PostgreSQL, psycopg2
- **MLE:** Docker, Docker Compose, joblib, pytest

## What's next

Phase 10 (planned, not yet built): LLM-generated natural-language risk narratives from the
SHAP output — turning `top_contributors` into a plain-English explanation paragraph per
prediction, rather than a raw feature/contribution list.
