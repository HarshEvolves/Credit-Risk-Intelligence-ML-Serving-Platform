// Real min/max computed from the raw training data (see model/training_stats.json for
// mean/std, and Phase 1's UCI_Credit_Card.csv for these exact bounds) — not guessed.
export const FIELD_BOUNDS = {
  LIMIT_BAL: { min: 10000, max: 1000000, step: 1 },
  AGE: { min: 18, max: 100, step: 1 },
  PAY_0: { min: -2, max: 8, step: 1 },
  PAY_2: { min: -2, max: 8, step: 1 },
  PAY_3: { min: -2, max: 8, step: 1 },
  PAY_4: { min: -2, max: 8, step: 1 },
  PAY_5: { min: -2, max: 8, step: 1 },
  PAY_6: { min: -2, max: 8, step: 1 },
  BILL_AMT1: { min: -400000, max: 2000000, step: 1 },
  BILL_AMT2: { min: -400000, max: 2000000, step: 1 },
  BILL_AMT3: { min: -400000, max: 2000000, step: 1 },
  BILL_AMT4: { min: -400000, max: 2000000, step: 1 },
  BILL_AMT5: { min: -400000, max: 2000000, step: 1 },
  BILL_AMT6: { min: -400000, max: 2000000, step: 1 },
  PAY_AMT1: { min: 0, max: 2000000, step: 1 },
  PAY_AMT2: { min: 0, max: 2000000, step: 1 },
  PAY_AMT3: { min: 0, max: 2000000, step: 1 },
  PAY_AMT4: { min: 0, max: 2000000, step: 1 },
  PAY_AMT5: { min: 0, max: 2000000, step: 1 },
  PAY_AMT6: { min: 0, max: 2000000, step: 1 },
};

export const PAY_STATUS_LABELS = {
  "-2": "No consumption",
  "-1": "Paid in full",
  0: "Revolving credit",
  1: "1 month late",
  2: "2 months late",
  3: "3 months late",
  4: "4 months late",
  5: "5 months late",
  6: "6 months late",
  7: "7 months late",
  8: "8+ months late",
};

export const EDUCATION_OPTIONS = [
  { value: 1, label: "Graduate school" },
  { value: 2, label: "University" },
  { value: 3, label: "High school" },
  { value: 4, label: "Other" },
];

export const MARRIAGE_OPTIONS = [
  { value: 1, label: "Married" },
  { value: 2, label: "Single" },
  { value: 3, label: "Other" },
];

export const SEX_OPTIONS = [
  { value: 1, label: "Male" },
  { value: 2, label: "Female" },
];
