export default function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[11px] text-ink-soft">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full border-b border-line bg-transparent py-1 font-mono text-[13px] text-ink outline-none transition focus:border-ink"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
