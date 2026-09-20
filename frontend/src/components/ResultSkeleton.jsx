function Bone({ className = "" }) {
  return (
    <div
      className={`animate-shimmer rounded bg-[linear-gradient(90deg,#141a29_0%,#1e2637_50%,#141a29_100%)] bg-[length:400px_100%] ${className}`}
    />
  );
}

export default function ResultSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <Bone className="h-[220px] w-[220px] rounded-full" />
      <Bone className="h-7 w-40 rounded-full" />
      <div className="w-full space-y-3">
        <Bone className="h-4 w-1/3" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Bone key={i} className="h-9 w-full" />
        ))}
      </div>
      <p className="text-xs text-slate-500">Running inference…</p>
    </div>
  );
}
