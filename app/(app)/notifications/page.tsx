export const dynamic = "force-dynamic";
import { getServerUser } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { formatCurrency } from "@/lib/utils";
import { Receipt, UserPlus, Plane, ArrowRightLeft, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/components/ui/motion";

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 864e5);
}

export default async function NotificationsPage() {
  const { supabase, user } = await getServerUser();
  if (!user) return null;

  // Get all user's trip IDs
  const { data: memberships } = await supabase
    .from("trip_members")
    .select("trip_id, trips(id, title, start_date, destination)")
    .eq("user_id", user.id);

  const tripIds = (memberships ?? []).map((m: any) => m.trip_id);
  const trips = (memberships ?? []).map((m: any) => m.trips).filter(Boolean);

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch recent expenses + new members in parallel
  const [{ data: recentExpenses }, { data: recentMembers }] = await Promise.all([
    tripIds.length
      ? supabase.from("expenses").select("id, title, amount, created_at, trip_id, paid_by, profiles:paid_by(name), trips(title)")
          .in("trip_id", tripIds).gte("created_at", cutoff).order("created_at", { ascending: false }).limit(20)
      : { data: [] },
    tripIds.length
      ? supabase.from("trip_members").select("user_id, joined_at, trip_id, profiles(name, avatar), trips(title)")
          .in("trip_id", tripIds).gte("joined_at", cutoff).neq("user_id", user.id)
          .order("joined_at", { ascending: false }).limit(10)
      : { data: [] },
  ]);

  // Build notification items
  const items: Array<{
    id: string;
    icon: any;
    color: string;
    bg: string;
    title: string;
    sub: string;
    time: string;
    type: string;
  }> = [];

  // Upcoming trips (next 30 days)
  trips.forEach((t: any) => {
    if (!t?.start_date) return;
    const d = daysUntil(t.start_date);
    if (d > 0 && d <= 30) {
      items.push({
        id: `trip-${t.id}`,
        icon: Plane,
        color: "text-indigo-600",
        bg: "bg-indigo-50",
        title: d === 1 ? `${t.title} starts tomorrow!` : `${t.title} in ${d} days`,
        sub: t.destination ? `Destination: ${t.destination}` : "Get ready to go!",
        time: t.start_date,
        type: "trip",
      });
    }
  });

  // Recent expenses
  (recentExpenses ?? []).forEach((e: any) => {
    const isOwnExpense = e.paid_by === user.id;
    items.push({
      id: `exp-${e.id}`,
      icon: Receipt,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      title: isOwnExpense
        ? `You added "${e.title}" in ${e.trips?.title}`
        : `${e.profiles?.name || "Someone"} added "${e.title}"`,
      sub: `${formatCurrency(e.amount)} in ${e.trips?.title || "a trip"}`,
      time: e.created_at,
      type: "expense",
    });
  });

  // Recent members
  (recentMembers ?? []).forEach((m: any) => {
    items.push({
      id: `mem-${m.user_id}-${m.trip_id}`,
      icon: UserPlus,
      color: "text-pink-600",
      bg: "bg-pink-50",
      title: `${m.profiles?.name || "Someone"} joined ${m.trips?.title}`,
      sub: "New travel buddy",
      time: m.joined_at,
      type: "member",
    });
  });

  // Sort by time descending
  items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <>
      <TopBar title="Notifications" />
      <div className="bg-gray-50 min-h-screen px-4 pt-4 pb-8">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-24 text-center">
            <div className="h-20 w-20 rounded-3xl bg-indigo-50 flex items-center justify-center mb-4">
              <Bell className="h-10 w-10 text-indigo-300" />
            </div>
            <p className="text-base font-bold text-gray-700">All caught up!</p>
            <p className="text-sm text-gray-400 mt-1">No new activity in the last 7 days</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={item.id}
                  className="flex items-start gap-3 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <div className={`h-10 w-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 leading-snug">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium shrink-0 mt-0.5">
                    {item.type === "trip" ? `in ${daysUntil(item.time)}d` : timeAgo(item.time)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
