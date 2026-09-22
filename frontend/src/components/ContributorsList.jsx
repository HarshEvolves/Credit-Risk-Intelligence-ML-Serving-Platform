// Deliberately not a chart-in-a-card: a plain list with directional glyphs and an inline
// magnitude bar, so it reads structurally distinct from the narrative pull-quote below it.

// Tailwind's JIT scanner only sees literal class strings, not runtime interpolation —
// so the two directions' color classes have to be spelled out, not built as `text-${tone}`.
const TONE = {
  up: { text: "text-risk-high", bar: "bg-risk-high", hover: "hover:bg-risk-high/5" },
  down: { text: "text-risk-low", bar: "bg-risk-low", hover: "hover:bg-risk-low/5" },
};

export default function ContributorsList({ contributors }) {
  const sorted = [...contributors].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  const maxAbs = Math.max(...sorted.map((c) => Math.abs(c.contribution)));

  return (
    <div>
      <p className="font-mono text-[11px] text-ink-soft">why</p>
      <ul className="mt-2 divide-y divide-line">
        {sorted.map((c) => {
          const increases = c.contribution >= 0;
          const tone = TONE[increases ? "up" : "down"];
          return (
            <li key={c.feature} className={`-mx-2 flex items-center gap-3 rounded px-2 py-2.5 transition ${tone.hover}`}>
              <span className={`font-mono text-base ${tone.text}`} aria-label={c.direction}>
                {increases ? "↑" : "↓"}
              </span>
              <span className="flex-1 truncate font-mono text-[13px] text-ink">{c.feature}</span>
              <span className="relative h-1.5 w-20 overflow-hidden rounded-full bg-line">
                <span
                  className={`absolute inset-y-0 left-0 rounded-full ${tone.bar}`}
                  style={{ width: `${(Math.abs(c.contribution) / maxAbs) * 100}%` }}
                />
              </span>
              <span className={`tnum font-mono text-[13px] ${tone.text}`}>
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
