import { Skeleton } from "@/components/ui/skeleton";
import { TopBar } from "@/components/layout/TopBar";

export default function Loading() {
  return (
    <>
      <TopBar title="Profile" />
      <div className="min-h-screen bg-[#08080f]">
        <div className="px-5 pt-16 pb-12 flex flex-col items-center">
          <Skeleton className="h-28 w-28 rounded-full mb-5" />
          <Skeleton className="h-6 w-36 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="px-4 space-y-3">
          <div className="bg-[#0f0f1e] rounded-2xl border border-white/7 divide-y divide-white/4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-4">
                <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
