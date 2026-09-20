// Continuous teal -> amber -> red gradient keyed on probability, so the gauge color reads
// as a spectrum rather than jumping between 3 flat colors at the LOW/MEDIUM/HIGH boundaries.
const STOPS = [
  { at: 0, color: [45, 212, 191] }, // risk-low
  { at: 0.3, color: [245, 158, 11] }, // risk-mid
  { at: 0.6, color: [239, 68, 68] }, // risk-high
  { at: 1, color: [220, 38, 38] }, // deeper red at the extreme
];

export function riskColor(probability) {
  const p = Math.min(1, Math.max(0, probability));
  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i];
    const b = STOPS[i + 1];
    if (p >= a.at && p <= b.at) {
      const t = (p - a.at) / (b.at - a.at || 1);
      const [r, g, bch] = a.color.map((c, idx) => Math.round(c + (b.color[idx] - c) * t));
      return `rgb(${r}, ${g}, ${bch})`;
    }
  }
  return `rgb(${STOPS.at(-1).color.join(", ")})`;
}

export const RISK_CATEGORY_STYLES = {
  LOW: { text: "text-risk-low", bg: "bg-risk-low/15", border: "border-risk-low/40", dot: "bg-risk-low" },
  MEDIUM: { text: "text-risk-mid", bg: "bg-risk-mid/15", border: "border-risk-mid/40", dot: "bg-risk-mid" },
  HIGH: { text: "text-risk-high", bg: "bg-risk-high/15", border: "border-risk-high/40", dot: "bg-risk-high" },
};
