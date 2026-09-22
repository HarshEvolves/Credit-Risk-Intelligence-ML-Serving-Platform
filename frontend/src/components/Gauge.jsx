import { motion } from "framer-motion";
import { riskColor } from "../lib/risk";
import { useAnimatedNumber } from "../lib/useAnimatedNumber";

const SIZE = 188;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// The one orchestrated motion moment on the page: the arc fills and the numeral counts up
// together, in sync, exactly once on result reveal. Nothing else on the page animates in.
export default function Gauge({ probability }) {
  const animatedValue = useAnimatedNumber(probability, 1100);
  const color = riskColor(probability);
  const offset = CIRCUMFERENCE * (1 - probability);

  return (
    <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
      {/* Tinted disc behind the ring — the risk color gets real presence here, since this
          IS the one moment on the page where color is meant to carry weight. */}
      <div className="absolute inset-3 rounded-full" style={{ backgroundColor: `${color}1a` }} />
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#E3DFD5" strokeWidth={STROKE} />
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tnum font-mono text-5xl font-semibold leading-none" style={{ color }}>
          {(animatedValue * 100).toFixed(1)}
        </span>
        <span className="mt-2 font-mono text-[11px] text-ink-soft">percent default</span>
      </div>
    </div>
  );
}
