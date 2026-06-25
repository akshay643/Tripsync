import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero skeleton */}
      <div className="bg-linear-to-br from-indigo-600 via-indigo-700 to-purple-700 px-5 pt-12 pb-16">
        <Skeleton className="h-7 w-36 bg-white/20 mb-2" />
        <Skeleton className="h-4 w-52 bg-white/10" />
      </div>
      <div className="px-4 -mt-6 pb-8 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <Skeleton className="h-28 rounded-none" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
