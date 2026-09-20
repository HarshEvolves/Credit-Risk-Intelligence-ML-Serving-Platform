export default function NumberField({ label, value, onChange, min, max, step = 1 }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-400">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className="w-full rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
      />
    </label>
  );
}
