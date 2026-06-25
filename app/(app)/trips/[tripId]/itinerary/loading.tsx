import { Skeleton } from "@/components/ui/skeleton";
import { TopBar } from "@/components/layout/TopBar";

export default function Loading() {
  return (
    <>
      <TopBar title="Itinerary" backHref="#" />
      <div className="px-4 py-4 space-y-4">
        {[1, 2].map((day) => (
          <div key={day}>
            <Skeleton className="h-5 w-24 mb-3" />
            <div className="space-y-2 ml-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="w-0.5 flex-1 mt-1" />
                  </div>
                  <div className="flex-1 pb-3 space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
