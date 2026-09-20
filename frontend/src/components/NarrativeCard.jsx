import { AnimatePresence, motion } from "framer-motion";

export default function NarrativeCard({ status, narrative }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.95, duration: 0.5 }}
      className="rounded-xl border border-accent/25 bg-gradient-to-br from-accent/10 to-transparent p-4"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="text-lg">✨</span>
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-accent">
          AI risk narrative
        </h3>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-slate-500">via Groq</span>
      </div>

      <AnimatePresence mode="wait">
        {status === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-3 animate-shimmer rounded bg-[linear-gradient(90deg,#1c2333_0%,#2a3348_50%,#1c2333_100%)] bg-[length:400px_100%]"
                style={{ width: `${90 - i * 15}%` }}
              />
            ))}
          </motion.div>
        )}

        {status === "ready" && (
          <motion.p
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm leading-relaxed text-slate-200"
          >
            {narrative}
          </motion.p>
        )}

        {status === "unavailable" && (
          <motion.p
            key="unavailable"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm italic text-slate-500"
          >
            Narrative unavailable right now (Groq may be unreachable, rate-limited, or
            GROQ_API_KEY isn't set) — the prediction above is unaffected.
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
