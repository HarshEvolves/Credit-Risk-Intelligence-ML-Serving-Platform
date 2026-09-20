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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Credit Risk Intelligence
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-slate-50 sm:text-4xl">
          Will this customer default?
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          A locally-served Random Forest, explained per-prediction with SHAP, narrated in
          plain English by an LLM. Enter a customer's history or load a real example below.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
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

      <footer className="mt-10 text-center text-[11px] text-slate-600">
        Demo tool — UCI benchmark dataset, not real customer data. No lending decisions made here.
      </footer>
    </div>
  );
}
