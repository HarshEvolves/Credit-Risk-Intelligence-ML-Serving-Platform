// Deliberately not a card: reads as an annotation on the SHAP list above it, not a second
// identical panel. A left rule + serif italic (blockquote register), no border box, no icon.
export default function NarrativeCard({ status, narrative }) {
  if (status === "loading") {
    return (
      <div className="border-l-2 border-line pl-4">
        <div className="h-3 w-11/12 animate-pulse rounded bg-line" />
        <div className="mt-2 h-3 w-9/12 animate-pulse rounded bg-line" />
        <div className="mt-2 h-3 w-10/12 animate-pulse rounded bg-line" />
      </div>
    );
  }

  if (status === "unavailable") {
    return (
      <p className="border-l-2 border-line pl-4 font-mono text-[13px] italic text-ink-soft">
        Narrative unavailable — the assessment above is unaffected.
      </p>
    );
  }

  if (status !== "ready" || !narrative) return null;

  return (
    <blockquote className="border-l-2 border-ink pl-4">
      <p className="font-serif text-[15px] italic leading-relaxed text-ink">{narrative}</p>
      <footer className="mt-2 font-mono text-[11px] text-ink-soft">
        — generated from the values above, via Groq
      </footer>
    </blockquote>
  );
}
