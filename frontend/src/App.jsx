import { useState } from "react";
import FormPanel from "./components/FormPanel";
import ResultPanel from "./components/ResultPanel";
import { EXAMPLES } from "./data/exampleRows";
import { predict } from "./lib/api";

const DEFAULT_VALUES = EXAMPLES[0].values;

export default function App() {
  const [values, setValues] = useState(DEFAULT_VALUES);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [narrativeStatus, setNarrativeStatus] = useState("idle"); // idle | loading | ready | unavailable
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  function handleFieldChange(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleLoadExample(example) {
    setValues(example.values);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("loading");
    setNarrativeStatus("idle");
    setResult(null);
    setErrorMessage("");

    // Two separate calls, deliberately: a fast plain /predict renders the gauge/chart the
    // moment inference is done, then a second /predict?narrate=true call backfills just the
    // narrative once Groq responds (~700ms) — so the ~700ms LLM call never blocks the parts
    // of the UI that don't need it. Both are cheap, deterministic re-runs of the same model.
    let fastResult;
    try {
      fastResult = await predict(values, { narrate: false });
      setResult(fastResult);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err.message || "Something went wrong talking to the API.");
      return;
    }

    setNarrativeStatus("loading");
    try {
      const narrated = await predict(values, { narrate: true });
      setResult((prev) => (prev ? { ...prev, risk_narrative: narrated.risk_narrative } : narrated));
      setNarrativeStatus(narrated.risk_narrative ? "ready" : "unavailable");
    } catch {
      setNarrativeStatus("unavailable");
    }
  }

  return (
    <div className="min-h-screen">
      <header className="bg-brand">
        <div className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
          <p className="font-mono text-[11px] text-paper/60">credit risk model — v1</p>
          <h1 className="mt-3 font-serif text-3xl text-paper sm:text-[32px]">Will this customer default?</h1>
          <p className="mt-2 max-w-xl font-serif text-[15px] text-paper/70">
            A Random Forest, explained per-prediction with SHAP and narrated by an LLM. Enter a
            customer's repayment history, or load a recorded case below.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
          <FormPanel
            values={values}
            onFieldChange={handleFieldChange}
            onLoadExample={handleLoadExample}
            onSubmit={handleSubmit}
            isSubmitting={status === "loading"}
          />
          <ResultPanel
            status={status}
            result={result}
            narrativeStatus={narrativeStatus}
            errorMessage={errorMessage}
          />
        </div>

        <footer className="mt-16 border-t border-line pt-4 font-mono text-[11px] text-ink-soft">
          Demo — UCI benchmark dataset, not real customer data. No lending decisions made here.
        </footer>
      </div>
    </div>
  );
}
