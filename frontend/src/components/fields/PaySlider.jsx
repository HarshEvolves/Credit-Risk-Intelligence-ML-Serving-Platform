import { PAY_STATUS_LABELS } from "../../data/fieldBounds";

export default function PaySlider({ label, value, onChange, min, max }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-baseline justify-between font-mono text-[11px] text-ink-soft">
        <span>{label}</span>
        <span className="text-ink">{PAY_STATUS_LABELS[value] ?? value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </label>
  );
}
