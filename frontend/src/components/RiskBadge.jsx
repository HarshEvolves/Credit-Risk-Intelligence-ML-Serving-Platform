import { RISK_CATEGORY_TEXT } from "../lib/risk";

const LABELS = { LOW: "Low", MEDIUM: "Medium", HIGH: "High" };

export default function RiskBadge({ category }) {
  const textClass = RISK_CATEGORY_TEXT[category] ?? RISK_CATEGORY_TEXT.MEDIUM;

  return (
    <div>
      <p className={`font-serif text-2xl italic ${textClass}`}>{LABELS[category] ?? category} risk</p>
      <p className="mt-1 font-mono text-[11px] text-ink-soft">default probability</p>
    </div>
  );
}
