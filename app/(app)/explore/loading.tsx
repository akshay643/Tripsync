import { Skeleton } from "@/components/ui/skeleton";
import { TopBar } from "@/components/layout/TopBar";

export default function ExploreLoading() {
  return (
    <>
      <TopBar title="Explore" />
      <div className="bg-gray-50 min-h-screen pb-8">
        <Skeleton className="h-28 rounded-none" />
        <div className="px-4 mt-3 space-y-3">
          <Skeleton className="h-12 rounded-2xl" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
              <Skeleton className="h-44 rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
