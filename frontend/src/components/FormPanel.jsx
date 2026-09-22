import { EXAMPLES } from "../data/exampleRows";
import { EDUCATION_OPTIONS, FIELD_BOUNDS, MARRIAGE_OPTIONS, SEX_OPTIONS } from "../data/fieldBounds";
import { RISK_CATEGORY_CHIP } from "../lib/risk";
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
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <p className="mb-2 font-mono text-[11px] text-ink-soft">recorded case — colored by the model's own call</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example.key}
              type="button"
              onClick={() => onLoadExample(example)}
              title={example.description}
              className={`rounded-full border px-3 py-1 font-mono text-[12px] transition hover:brightness-95 ${RISK_CATEGORY_CHIP[example.risk]}`}
            >
              {example.label}
            </button>
          ))}
        </div>
      </div>

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
        className="mt-6 self-start rounded-sm bg-brand px-6 py-3 font-mono text-[13px] text-paper transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Scoring" : "Run assessment"}
      </button>
    </form>
  );
}
