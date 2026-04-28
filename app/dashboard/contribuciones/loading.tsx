import { SkeletonTable, SkeletonPageHeader } from "@/app/components/Skeleton";
export default function Loading() {
  return (
    <div className="space-y-4">
      <SkeletonPageHeader />
      <SkeletonTable rows={8} cols={4} />
    </div>
  );
}
