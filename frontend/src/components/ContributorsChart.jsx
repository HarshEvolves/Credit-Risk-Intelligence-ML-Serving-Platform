import { motion } from "framer-motion";
import { Bar, BarChart, Cell, ResponsiveContainer, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";

const INCREASES = "#ef4444";
const DECREASES = "#2dd4bf";

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-slate-100">{row.feature}</p>
      <p className="text-slate-400">value: {row.value.toFixed(3)}</p>
      <p style={{ color: row.contribution >= 0 ? INCREASES : DECREASES }}>
        {row.contribution >= 0 ? "+" : ""}
        {row.contribution.toFixed(4)} SHAP ({row.direction})
      </p>
    </div>
  );
}

export default function ContributorsChart({ contributors }) {
  const data = [...contributors]
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .reverse()
    .map((c) => ({ ...c, name: c.feature }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.75, duration: 0.5 }}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-300">
          Top SHAP contributors
        </h3>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: INCREASES }} /> increases risk
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: DECREASES }} /> decreases risk
          </span>
        </div>
      </div>
      <div style={{ width: "100%", height: Math.max(180, data.length * 42) }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 4 }}>
            <XAxis type="number" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#94a3b8"
              fontSize={12}
              width={150}
              tickLine={false}
              axisLine={false}
            />
            <ReferenceLine x={0} stroke="#334155" />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(148,163,184,0.08)" }} />
            <Bar dataKey="contribution" radius={[4, 4, 4, 4]} isAnimationActive animationDuration={900}>
              {data.map((entry) => (
                <Cell key={entry.feature} fill={entry.contribution >= 0 ? INCREASES : DECREASES} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
