// Tailwind's JIT scanner only picks up literal class strings, not runtime template
// interpolation — so the column-count variants have to be spelled out here, not built
// as `sm:grid-cols-${columns}`.
const GRID_COLUMNS = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
};

export default function FieldGroup({ title, subtitle, children, columns = 2 }) {
  return (
    <section className="rounded-xl border border-surface-border bg-surface-card/60 p-4">
      <div className="mb-3">
        <h3 className="font-display text-sm font-semibold text-slate-200">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className={`grid grid-cols-1 gap-3 ${GRID_COLUMNS[columns] ?? GRID_COLUMNS[2]}`}>{children}</div>
    </section>
  );
}
