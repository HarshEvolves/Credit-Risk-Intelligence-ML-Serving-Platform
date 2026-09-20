import pandas as pd

from load_data import load_raw_data

TARGET = "default.payment.next.month"


def main():
    df = load_raw_data()

    print("shape:", df.shape)

    print("\ndtypes:")
    print(df.dtypes)

    print("\nmissing values per column:")
    print(df.isnull().sum())

    print("\nduplicate rows:", df.duplicated().count() - df.drop_duplicates().shape[0])

    print(f"\n{TARGET} class distribution:")
    print(df[TARGET].value_counts())
    print(df[TARGET].value_counts(normalize=True))

    print("\ndescribe (numeric):")
    pd.set_option("display.max_columns", None)
    print(df.describe())


if __name__ == "__main__":
    main()
