import { Skeleton } from "@/components/ui/skeleton";
import { TopBar } from "@/components/layout/TopBar";

export default function NotificationsLoading() {
  return (
    <>
      <TopBar title="Notifications" />
      <div className="bg-gray-50 min-h-screen px-4 pt-4 pb-8 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 bg-white rounded-2xl border border-gray-100 p-4">
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
