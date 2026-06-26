export const dynamic = "force-dynamic";
import { getServerUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { Map, MapPin, Navigation } from "lucide-react";

export default async function MapPage() {
  const { supabase, user } = await getServerUser();

  const { data: memberships } = await supabase
    .from("trip_members")
    .select("trip_id, trips(id, title, destination)")
    .eq("user_id", user?.id ?? "");

  const activeTrips = (memberships ?? []).map((m: any) => m.trips).filter(Boolean);

  if (activeTrips.length === 1) {
    redirect(`/trips/${activeTrips[0].id}/map`);
  }

  return (
    <>
      <TopBar title="Live Map" />
      <div className="min-h-screen bg-[#08080f] px-4 py-4">
        {activeTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-20 w-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
              <Map className="h-10 w-10 text-indigo-400/50" />
            </div>
            <p className="font-bold text-white">No trips yet</p>
            <p className="text-sm text-slate-500 mt-1">Create a trip to share your location</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 font-medium mb-4 flex items-center gap-1.5">
              <Navigation className="h-4 w-4 text-indigo-400" />
              Pick a trip to open the map
            </p>
            <div className="space-y-2">
              {activeTrips.map((trip: any) => (
                <Link key={trip.id} href={`/trips/${trip.id}/map`}>
                  <div className="flex items-center gap-3 bg-[#0f0f1e] rounded-2xl border border-white/7 p-4 active:scale-[0.98] transition-transform">
                    <div className="h-11 w-11 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <Map className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm">{trip.title}</p>
                      {trip.destination && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />{trip.destination}
                        </p>
                      )}
                    </div>
                    <Navigation className="h-4 w-4 text-slate-700 shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
