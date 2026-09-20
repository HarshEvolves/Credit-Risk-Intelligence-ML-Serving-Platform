from pathlib import Path

import pandas as pd

RAW_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "raw" / "UCI_Credit_Card.csv"


def load_raw_data(path: Path = RAW_DATA_PATH) -> pd.DataFrame:
    return pd.read_csv(path)


if __name__ == "__main__":
    df = load_raw_data()
    assert df.shape == (30000, 25), f"unexpected shape: {df.shape}"
    print(f"loaded {df.shape[0]} rows x {df.shape[1]} cols")
