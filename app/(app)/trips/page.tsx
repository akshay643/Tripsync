export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { TripCard } from "@/components/trips/TripCard";
import { Button } from "@/components/ui/button";
import { Plus, Plane } from "lucide-react";
import Link from "next/link";
import type { TripWithMembers } from "@/types";

export default async function TripsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Step 1: get trip IDs the user belongs to
  const { data: memberRows } = await supabase
    .from("trip_members")
    .select("trip_id")
    .eq("user_id", user?.id ?? "");

  const tripIds = (memberRows ?? []).map((r: any) => r.trip_id);

  // Step 2: fetch those trips with members + profiles
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
    <div>
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Trips</h1>
          <p className="text-sm text-gray-400">{tripList.length} trip{tripList.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/trips/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Trip
          </Button>
        </Link>
      </div>

      {tripList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="h-20 w-20 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5">
            <Plane className="h-10 w-10 text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">No trips yet</h2>
          <p className="text-sm text-gray-500 mt-2 mb-6">
            Create your first trip and invite your friends
          </p>
          <Link href="/trips/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create a Trip
            </Button>
          </Link>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {tripList.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
