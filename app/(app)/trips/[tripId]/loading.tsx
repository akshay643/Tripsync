import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-linear-to-br from-indigo-600 via-indigo-700 to-purple-700 px-5 pt-5 pb-10">
        <Skeleton className="h-6 w-48 bg-white/20 mb-2" />
        <Skeleton className="h-4 w-32 bg-white/10 mb-5" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 bg-white/10 rounded-2xl" />
          <Skeleton className="h-20 bg-white/10 rounded-2xl" />
        </div>
      </div>
      <div className="px-4 -mt-5 pb-6 grid grid-cols-2 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
