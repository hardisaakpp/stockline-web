import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
