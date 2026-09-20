# Credit Risk Intelligence & ML Serving Platform

**Phase 1: repo setup + data ingestion.**

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
