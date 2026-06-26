export const dynamic = "force-dynamic";
import { getServerUser } from "@/lib/supabase/server";
import Link from "next/link";
import { TripsListClient } from "@/components/trips/TripsListClient";
import { Plus, Plane, Sparkles } from "lucide-react";
import type { TripWithMembers } from "@/types";

export default async function TripsPage() {
  const { supabase, user } = await getServerUser();

  const { data: memberRows } = await supabase
    .from("trip_members")
    .select("trip_id")
    .eq("user_id", user?.id ?? "");

  const tripIds = (memberRows ?? []).map((r: any) => r.trip_id);

  let tripList: TripWithMembers[] = [];
  if (tripIds.length > 0) {
    const { data } = await supabase
      .from("trips")
      .select("*, trip_members(*, profiles(*))")
      .in("id", tripIds)
      .order("created_at", { ascending: false });
    tripList = (data ?? []) as TripWithMembers[];
  }

  return (
    <div className="min-h-screen bg-[#08080f]">
      {/* Header */}
      <div className="relative overflow-hidden px-5 pt-14 pb-10">
        {/* Glow orbs */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -top-10 -left-10 h-48 w-48 rounded-full bg-violet-600/15 blur-3xl" />

        <div className="relative flex items-end justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium flex items-center gap-1.5 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              Where to next?
            </p>
            <h1 className="text-3xl font-black text-white tracking-tight">My Trips</h1>
            {tripList.length > 0 && (
              <p className="text-slate-500 text-sm mt-1">{tripList.length} adventure{tripList.length !== 1 ? "s" : ""}</p>
            )}
          </div>
          <Link
            href="/trips/new"
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2.5 rounded-2xl shadow-lg shadow-indigo-500/30 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-6">
        {tripList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-20 w-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5">
              <Plane className="h-9 w-9 text-indigo-400" />
            </div>
            <h2 className="text-lg font-bold text-white">No trips yet</h2>
            <p className="text-sm text-slate-500 mt-2 mb-8 max-w-xs">
              Create your first trip and invite your crew to plan together
            </p>
            <Link
              href="/trips/new"
              className="flex items-center gap-2 bg-indigo-600 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-indigo-500/30"
            >
              <Plus className="h-4 w-4" />
              Create a Trip
            </Link>
          </div>
        ) : (
          <TripsListClient trips={tripList} />
        )}
      </div>
    </div>
  );
}
