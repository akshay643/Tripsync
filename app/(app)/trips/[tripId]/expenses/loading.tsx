import { Skeleton } from "@/components/ui/skeleton";
import { TopBar } from "@/components/layout/TopBar";

export default function Loading() {
  return (
    <>
      <TopBar title="Expenses" backHref="#" />
      <div className="px-4 py-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm divide-y divide-gray-50">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="space-y-1.5 text-right">
                <Skeleton className="h-4 w-14 ml-auto" />
                <Skeleton className="h-3 w-10 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
