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
    <section className="border-t border-line pt-5">
      <div className="mb-4">
        <h3 className="flex items-center gap-2 font-mono text-[11px] text-ink-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          {title}
        </h3>
        {subtitle && <p className="mt-0.5 font-mono text-[11px] text-ink-soft/70">{subtitle}</p>}
      </div>
      <div className={`grid grid-cols-1 gap-4 ${GRID_COLUMNS[columns] ?? GRID_COLUMNS[2]}`}>{children}</div>
    </section>
  );
}
