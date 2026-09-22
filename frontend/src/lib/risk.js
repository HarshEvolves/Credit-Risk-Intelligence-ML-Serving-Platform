// Continuous teal -> amber -> red gradient keyed on probability, so the gauge color reads
// as a spectrum rather than jumping between 3 flat colors at the LOW/MEDIUM/HIGH boundaries.
// Muted/deep values (not saturated traffic-light colors) to match the paper/ledger palette.
const STOPS = [
  { at: 0, color: [30, 122, 92] }, // risk-low
  { at: 0.3, color: [166, 116, 27] }, // risk-mid
  { at: 0.6, color: [172, 51, 39] }, // risk-high
  { at: 1, color: [143, 42, 32] }, // deeper at the extreme
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

// Plain text-color classes — the risk word in the hero is set in type, not a pill/badge.
export const RISK_CATEGORY_TEXT = {
  LOW: "text-risk-low",
  MEDIUM: "text-risk-mid",
  HIGH: "text-risk-high",
};

// Tinted-chip classes for the "recorded case" examples: color tied to the model's actual
// predicted category for that row, not decoration.
export const RISK_CATEGORY_CHIP = {
  LOW: "border-risk-low/30 bg-risk-low/10 text-risk-low",
  MEDIUM: "border-risk-mid/30 bg-risk-mid/10 text-risk-mid",
  HIGH: "border-risk-high/30 bg-risk-high/10 text-risk-high",
};
