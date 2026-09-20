import { AnimatePresence, motion } from "framer-motion";
import ContributorsChart from "./ContributorsChart";
import Gauge from "./Gauge";
import NarrativeCard from "./NarrativeCard";
import ResultSkeleton from "./ResultSkeleton";
import RiskBadge from "./RiskBadge";

export default function ResultPanel({ status, result, narrativeStatus, errorMessage }) {
  return (
    <div className="sticky top-6 rounded-2xl border border-surface-border bg-surface-panel/80 p-6 shadow-glow backdrop-blur">
      <h2 className="mb-5 font-display text-lg font-semibold text-slate-100">Risk assessment</h2>

      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 py-16 text-center text-slate-500"
          >
            <span className="text-4xl">📊</span>
            <p className="max-w-[220px] text-sm">
              Fill in the form (or load an example) and submit to see a live prediction.
            </p>
          </motion.div>
        )}

        {status === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ResultSkeleton />
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border border-risk-high/40 bg-risk-high/10 p-4 text-sm text-risk-high"
          >
            <p className="font-semibold">Request failed</p>
            <p className="mt-1 text-risk-high/80">{errorMessage}</p>
          </motion.div>
        )}

        {status === "ready" && result && (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-5"
          >
            <Gauge probability={result.default_probability} riskCategory={result.risk_category} />
            <RiskBadge category={result.risk_category} defaultFlag={result.default_flag} />

            <div className="w-full border-t border-surface-border pt-4">
              <ContributorsChart contributors={result.top_contributors} />
            </div>

            <div className="w-full">
              <NarrativeCard status={narrativeStatus} narrative={result.risk_narrative} />
            </div>

            <p className="w-full text-center text-[11px] text-slate-600">
              model: {result.model_version}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
