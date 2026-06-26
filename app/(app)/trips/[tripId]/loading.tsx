import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="bg-[#08080f] min-h-screen">
      <Skeleton className="h-64 rounded-none bg-[#0f0f1e]" />
      <div className="px-4 space-y-3 pt-4">
        <div className="bg-[#0f0f1e] rounded-2xl border border-white/5 grid grid-cols-3 divide-x divide-white/5">
          {[1,2,3].map(i => (
            <div key={i} className="py-3.5 flex flex-col items-center gap-2">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-14 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    </div>
  );
}
