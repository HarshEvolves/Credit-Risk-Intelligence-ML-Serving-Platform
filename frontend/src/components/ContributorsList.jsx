// Deliberately not a chart-in-a-card: a plain list with directional glyphs and an inline
// magnitude bar, so it reads structurally distinct from the narrative pull-quote below it.
export default function ContributorsList({ contributors }) {
  const sorted = [...contributors].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  const maxAbs = Math.max(...sorted.map((c) => Math.abs(c.contribution)));

  return (
    <div>
      <p className="font-mono text-[11px] text-ink-soft">why</p>
      <ul className="mt-2 divide-y divide-line">
        {sorted.map((c) => {
          const increases = c.contribution >= 0;
          return (
            <li key={c.feature} className="flex items-center gap-3 py-2">
              <span
                className={`font-mono text-sm ${increases ? "text-risk-high" : "text-risk-low"}`}
                aria-label={c.direction}
              >
                {increases ? "↑" : "↓"}
              </span>
              <span className="flex-1 truncate font-mono text-[13px] text-ink">{c.feature}</span>
              <span className="relative h-1 w-16 overflow-hidden rounded-full bg-line">
                <span
                  className={`absolute inset-y-0 left-0 ${increases ? "bg-risk-high" : "bg-risk-low"}`}
                  style={{ width: `${(Math.abs(c.contribution) / maxAbs) * 100}%` }}
                />
              </span>
              <span className="tnum font-mono text-[13px] text-ink-soft">
                {increases ? "+" : ""}
                {c.contribution.toFixed(3)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
