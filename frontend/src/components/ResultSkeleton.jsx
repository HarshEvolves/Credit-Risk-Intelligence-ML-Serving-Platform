function Bone({ className = "" }) {
  return <div className={`animate-pulse rounded bg-line ${className}`} />;
}

export default function ResultSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-5">
        <Bone className="h-[168px] w-[168px] rounded-full" />
        <div className="space-y-2">
          <Bone className="h-6 w-24" />
          <Bone className="h-3 w-32" />
        </div>
      </div>
      <div className="space-y-3 border-t border-line pt-5">
        <Bone className="h-3 w-16" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Bone key={i} className="h-4 w-full" />
        ))}
      </div>
      <p className="font-mono text-[11px] text-ink-soft">running inference…</p>
    </div>
  );
}
