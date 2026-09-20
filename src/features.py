"""Feature engineering for the UCI Default of Credit Card Clients dataset.

Decisions (see Phase 2 EDA for the findings these respond to):

- EDUCATION: valid codes are 1=grad school, 2=university, 3=high school, 4=others.
  0, 5, 6 are undocumented -> folded into 4 ("others").
- MARRIAGE: valid codes are 1=married, 2=single, 3=others.
  0 is undocumented -> folded into 3 ("others").
- Credit utilization (BILL_AMT / LIMIT_BAL) is clipped to [0, 3]: negative bills
  (a credit balance in the client's favor) count as 0 utilization, and the top
  end is capped so a handful of extreme outliers don't dominate the scaled feature.
- Payment-to-bill ratio floors the bill at 1 before dividing (avoids div-by-zero
  on a zero/negative bill) and clips the ratio to [0, 5] for the same reason.
"""

import numpy as np
import pandas as pd

PAY_COLS = ["PAY_0", "PAY_2", "PAY_3", "PAY_4", "PAY_5", "PAY_6"]
BILL_COLS = [f"BILL_AMT{i}" for i in range(1, 7)]
PAY_AMT_COLS = [f"PAY_AMT{i}" for i in range(1, 7)]

EDUCATION_VALID = {1, 2, 3, 4}
MARRIAGE_VALID = {1, 2, 3}

ENGINEERED_COLS = [
    "avg_pay_status",
    "max_delay",
    "count_delinquent_months",
    "weighted_avg_pay_status",
    "avg_payment_ratio",
    "total_payments",
    "avg_bill_amt",
    "avg_utilization",
    "max_utilization",
]


def clean_categoricals(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["EDUCATION"] = df["EDUCATION"].where(df["EDUCATION"].isin(EDUCATION_VALID), 4)
    df["MARRIAGE"] = df["MARRIAGE"].where(df["MARRIAGE"].isin(MARRIAGE_VALID), 3)
    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = clean_categoricals(df)

    pay = df[PAY_COLS]
    df["avg_pay_status"] = pay.mean(axis=1)
    df["max_delay"] = pay.max(axis=1)
    df["count_delinquent_months"] = (pay > 0).sum(axis=1)
    # PAY_0 (most recent month) counted twice so recency carries more weight.
    df["weighted_avg_pay_status"] = (2 * df["PAY_0"] + pay.drop(columns="PAY_0").sum(axis=1)) / 7

    bill = df[BILL_COLS]
    pay_amt = df[PAY_AMT_COLS]
    ratio = (pay_amt.values / bill.clip(lower=1).values).clip(0, 5)
    df["avg_payment_ratio"] = ratio.mean(axis=1)
    df["total_payments"] = pay_amt.sum(axis=1)
    df["avg_bill_amt"] = bill.mean(axis=1)

    limit = df["LIMIT_BAL"].replace(0, np.nan)
    utilization = bill.clip(lower=0).div(limit, axis=0).clip(upper=3).fillna(0)
    df["avg_utilization"] = utilization.mean(axis=1)
    df["max_utilization"] = utilization.max(axis=1)

    return df
