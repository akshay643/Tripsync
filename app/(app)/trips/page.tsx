export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { TripCard } from "@/components/trips/TripCard";
import { Button } from "@/components/ui/button";
import { TripsListClient } from "@/components/trips/TripsListClient";
import { Plus, Plane } from "lucide-react";
import type { TripWithMembers } from "@/types";

export default async function TripsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-linear-to-br from-indigo-600 via-indigo-700 to-purple-700 px-5 pt-12 pb-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-indigo-300 text-sm font-medium">Welcome back ✈️</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">My Trips</h1>
          </div>
          <Link href="/trips/new">
            <Button size="sm" className="bg-white/15 hover:bg-white/25 text-white border-0 gap-1.5 backdrop-blur">
              <Plus className="h-4 w-4" />
              New Trip
            </Button>
          </Link>
        </div>
        {tripList.length > 0 && (
          <div className="flex items-center gap-4 mt-5">
            <div className="bg-white/10 rounded-2xl px-4 py-2.5 backdrop-blur">
              <p className="text-indigo-200 text-xs">Trips</p>
              <p className="text-white font-bold text-lg">{tripList.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 -mt-3 pb-6">
        {tripList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 rounded-3xl bg-indigo-50 flex items-center justify-center mb-5">
              <Plane className="h-10 w-10 text-indigo-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">No trips yet</h2>
            <p className="text-sm text-gray-500 mt-2 mb-7 max-w-xs">
              Create your first trip and invite your crew
            </p>
            <Link href="/trips/new">
              <Button className="gap-2 px-6 shadow-lg shadow-indigo-200">
                <Plus className="h-4 w-4" />
                Create a Trip
              </Button>
            </Link>
          </div>
        ) : (
          <TripsListClient trips={tripList} />
        )}
      </div>
    </div>
  );
}
