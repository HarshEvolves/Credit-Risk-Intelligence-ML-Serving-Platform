export default function NumberField({ label, value, onChange, min, max, step = 1 }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[11px] text-ink-soft">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className="tnum w-full border-b border-line bg-transparent py-1 font-mono text-[13px] text-ink outline-none transition focus:border-ink"
      />
    </label>
  );
}
