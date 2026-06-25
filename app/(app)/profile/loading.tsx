import { Skeleton } from "@/components/ui/skeleton";
import { TopBar } from "@/components/layout/TopBar";

export default function Loading() {
  return (
    <>
      <TopBar title="Profile" />
      <div className="bg-linear-to-br from-indigo-600 via-indigo-700 to-purple-700 px-5 pt-6 pb-14 flex flex-col items-center">
        <Skeleton className="h-24 w-24 rounded-full bg-white/20 mb-4" />
        <Skeleton className="h-6 w-36 bg-white/20 mb-2" />
        <Skeleton className="h-4 w-48 bg-white/10" />
      </div>
      <div className="px-4 -mt-8 space-y-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
