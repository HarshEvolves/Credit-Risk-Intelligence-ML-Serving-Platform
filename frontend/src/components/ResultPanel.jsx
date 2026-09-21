import ContributorsList from "./ContributorsList";
import Gauge from "./Gauge";
import NarrativeCard from "./NarrativeCard";
import ResultSkeleton from "./ResultSkeleton";
import RiskBadge from "./RiskBadge";

// Plain conditional rendering, deliberately — no AnimatePresence cross-fade between
// idle/loading/ready/error. The gauge's own arc+numeral animation (Gauge.jsx) is the one
// orchestrated motion moment on the page; the state container itself just swaps instantly.
export default function ResultPanel({ status, result, narrativeStatus, errorMessage }) {
  return (
    <div className="border-t border-line pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
      {status === "idle" && (
        <p className="font-mono text-[13px] text-ink-soft">
          Fill in the form, or load a recorded case, then run the assessment.
        </p>
      )}

      {status === "loading" && <ResultSkeleton />}

      {status === "error" && (
        <p className="border-l-2 border-risk-high pl-4 font-mono text-[13px] text-risk-high">{errorMessage}</p>
      )}

      {status === "ready" && result && (
        <div>
          <div className="flex items-center gap-6">
            <Gauge probability={result.default_probability} />
            <RiskBadge category={result.risk_category} />
          </div>

          <div className="mt-8 border-t border-line pt-6">
            <ContributorsList contributors={result.top_contributors} />
          </div>

          <div className="mt-8 border-t border-line pt-6">
            <NarrativeCard status={narrativeStatus} narrative={result.risk_narrative} />
          </div>

          <p className="mt-8 font-mono text-[11px] text-ink-soft">model {result.model_version}</p>
        </div>
      )}
    </div>
  );
}
