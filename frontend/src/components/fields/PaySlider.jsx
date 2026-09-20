import { PAY_STATUS_LABELS } from "../../data/fieldBounds";

export default function PaySlider({ label, value, onChange, min, max }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-xs font-medium text-slate-400">
        <span>{label}</span>
        <span className="font-display font-semibold text-slate-200">
          {PAY_STATUS_LABELS[value] ?? value}
        </span>
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
