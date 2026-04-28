import { SkeletonPageHeader } from "@/app/components/Skeleton";
export default function Loading() {
  return (
    <div className="max-w-xl space-y-6">
      <SkeletonPageHeader />
      <div className="rounded-xl border border-white/10 bg-white/5 h-48 animate-pulse" />
      <div className="rounded-xl border border-white/10 bg-white/5 h-52 animate-pulse" />
    </div>
  );
}
