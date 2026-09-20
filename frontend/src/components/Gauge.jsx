import { motion } from "framer-motion";
import { riskColor } from "../lib/risk";
import { useAnimatedNumber } from "../lib/useAnimatedNumber";

const SIZE = 220;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function Gauge({ probability, riskCategory }) {
  const animatedValue = useAnimatedNumber(probability, 1300);
  const color = riskColor(probability);
  const offset = CIRCUMFERENCE * (1 - probability);

  return (
    <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#1c2333"
          strokeWidth={STROKE}
        />
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
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 14px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-bold tabular-nums" style={{ color }}>
          {(animatedValue * 100).toFixed(1)}%
        </span>
        <span className="mt-1 text-xs uppercase tracking-widest text-slate-400">
          default probability
        </span>
        {riskCategory && (
          <span className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {riskCategory} risk
          </span>
        )}
      </div>
    </div>
  );
}
