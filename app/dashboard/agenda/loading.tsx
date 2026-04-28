import { SkeletonCard, SkeletonPageHeader } from "@/app/components/Skeleton";
export default function Loading() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeader />
      <div className="rounded-xl border border-white/10 bg-black/20 h-72 animate-pulse" />
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}
