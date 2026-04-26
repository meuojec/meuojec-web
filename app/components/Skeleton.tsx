"use client";

export function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "animate-pulse rounded-xl bg-white/5",
        className,
      ].join(" ")}
    />
  );
}

export function SkeletonText({ lines = 1, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={["space-y-2", className].join(" ")}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse h-4 rounded bg-white/5"
          style={{ width: i === lines - 1 && lines > 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
      <SkeletonBox className="h-3 w-24" />
      <SkeletonBox className="h-7 w-36" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-3 flex gap-6">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBox key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="border-b border-white/5 px-4 py-3 flex gap-6">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-4 flex-1 animate-pulse rounded-xl bg-white/5"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonPageHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <SkeletonBox className="h-8 w-8" />
        <div className="space-y-2">
          <SkeletonBox className="h-6 w-40" />
          <SkeletonBox className="h-3 w-56" />
        </div>
      </div>
      <SkeletonBox className="h-9 w-32" />
    </div>
  );
}
