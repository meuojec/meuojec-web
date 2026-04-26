import { SkeletonCard, SkeletonTable, SkeletonPageHeader } from "@/app/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <SkeletonPageHeader />
      <div className="grid gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <SkeletonTable rows={8} cols={7} />
    </div>
  );
}
