# Credit Risk Intelligence & ML Serving Platform

**Phase 1: repo setup + data ingestion. Phase 2: EDA. Phase 3: preprocessing + feature engineering.**

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
