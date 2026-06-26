import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#08080f]">
      <div className="px-5 pt-14 pb-10">
        <Skeleton className="h-4 w-28 mb-2" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="px-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl overflow-hidden border border-white/5 bg-[#0f0f1e]">
            <Skeleton className="h-36 rounded-none" />
            <div className="p-4 flex items-center justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
