import { motion } from "framer-motion";
import { RISK_CATEGORY_STYLES } from "../lib/risk";

export default function RiskBadge({ category, defaultFlag }) {
  const style = RISK_CATEGORY_STYLES[category] ?? RISK_CATEGORY_STYLES.MEDIUM;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 ${style.bg} ${style.border}`}
    >
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      <span className={`font-display text-sm font-bold uppercase tracking-wide ${style.text}`}>
        {category} risk
      </span>
      <span className="text-xs text-slate-500">
        · model flag: {defaultFlag ? "default likely" : "default unlikely"}
      </span>
    </motion.div>
  );
}
