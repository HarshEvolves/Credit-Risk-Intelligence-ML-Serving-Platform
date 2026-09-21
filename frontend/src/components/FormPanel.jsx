import { EXAMPLES } from "../data/exampleRows";
import { EDUCATION_OPTIONS, FIELD_BOUNDS, MARRIAGE_OPTIONS, SEX_OPTIONS } from "../data/fieldBounds";
import FieldGroup from "./FieldGroup";
import NumberField from "./fields/NumberField";
import PaySlider from "./fields/PaySlider";
import SelectField from "./fields/SelectField";

const PAY_FIELDS = ["PAY_0", "PAY_2", "PAY_3", "PAY_4", "PAY_5", "PAY_6"];
const PAY_MONTH_LABELS = {
  PAY_0: "Most recent month",
  PAY_2: "2 months ago",
  PAY_3: "3 months ago",
  PAY_4: "4 months ago",
  PAY_5: "5 months ago",
  PAY_6: "6 months ago",
};
const BILL_PAY_MONTHS = [1, 2, 3, 4, 5, 6];

export default function FormPanel({ values, onFieldChange, onLoadExample, onSubmit, isSubmitting }) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-1">
      <p className="font-mono text-[13px] text-ink-soft">
        Recorded case:{" "}
        {EXAMPLES.map((example, i) => (
          <span key={example.key}>
            <button
              type="button"
              onClick={() => onLoadExample(example)}
              title={example.description}
              className="text-ink underline decoration-line decoration-1 underline-offset-2 transition hover:decoration-ink"
            >
              {example.label}
            </button>
            {i < EXAMPLES.length - 1 && <span className="text-ink-soft">, </span>}
          </span>
        ))}
      </p>

      <FieldGroup title="personal">
        <NumberField
          label="Age"
          value={values.AGE}
          onChange={(v) => onFieldChange("AGE", v)}
          min={FIELD_BOUNDS.AGE.min}
          max={FIELD_BOUNDS.AGE.max}
        />
        <SelectField label="Sex" value={values.SEX} onChange={(v) => onFieldChange("SEX", v)} options={SEX_OPTIONS} />
        <SelectField
          label="Education"
          value={values.EDUCATION}
          onChange={(v) => onFieldChange("EDUCATION", v)}
          options={EDUCATION_OPTIONS}
        />
        <SelectField
          label="Marital status"
          value={values.MARRIAGE}
          onChange={(v) => onFieldChange("MARRIAGE", v)}
          options={MARRIAGE_OPTIONS}
        />
      </FieldGroup>

      <FieldGroup title="credit" columns={1}>
        <NumberField
          label="Credit limit (NT$)"
          value={values.LIMIT_BAL}
          onChange={(v) => onFieldChange("LIMIT_BAL", v)}
          min={FIELD_BOUNDS.LIMIT_BAL.min}
          max={FIELD_BOUNDS.LIMIT_BAL.max}
          step={FIELD_BOUNDS.LIMIT_BAL.step}
        />
      </FieldGroup>

      <FieldGroup title="repayment, last 6 months">
        {PAY_FIELDS.map((field) => (
          <PaySlider
            key={field}
            label={PAY_MONTH_LABELS[field]}
            value={values[field]}
            onChange={(v) => onFieldChange(field, v)}
            min={FIELD_BOUNDS[field].min}
            max={FIELD_BOUNDS[field].max}
          />
        ))}
      </FieldGroup>

      <FieldGroup title="bills and payments, last 6 months" columns={1}>
        {BILL_PAY_MONTHS.map((month) => {
          const billField = `BILL_AMT${month}`;
          const payField = `PAY_AMT${month}`;
          return (
            <div key={month} className="grid grid-cols-2 gap-4">
              <NumberField
                label={`Month ${month} bill (NT$)`}
                value={values[billField]}
                onChange={(v) => onFieldChange(billField, v)}
                min={FIELD_BOUNDS[billField].min}
                max={FIELD_BOUNDS[billField].max}
                step={FIELD_BOUNDS[billField].step}
              />
              <NumberField
                label={`Month ${month} paid (NT$)`}
                value={values[payField]}
                onChange={(v) => onFieldChange(payField, v)}
                min={FIELD_BOUNDS[payField].min}
                max={FIELD_BOUNDS[payField].max}
                step={FIELD_BOUNDS[payField].step}
              />
            </div>
          );
        })}
      </FieldGroup>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 self-start border border-ink bg-ink px-5 py-2.5 font-mono text-[13px] text-paper transition hover:bg-brand hover:border-brand disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Scoring" : "Run assessment"}
      </button>
    </form>
  );
}
