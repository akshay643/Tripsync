export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { Map, MapPin, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/components/ui/motion";

export default async function MapPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from("trip_members")
    .select("trip_id, trips(id, title, destination)")
    .eq("user_id", user?.id ?? "");

  const activeTrips = (memberships ?? [])
    .map((m: any) => m.trips)
    .filter(Boolean);

  // Auto-redirect if only one trip — no point showing a list
  if (activeTrips.length === 1) {
    redirect(`/trips/${activeTrips[0].id}/map`);
  }

  return (
    <>
      <TopBar title="Live Map" />
      <div className="px-4 py-4">
        {activeTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 rounded-3xl bg-indigo-50 flex items-center justify-center mb-4">
              <Map className="h-10 w-10 text-indigo-300" />
            </div>
            <p className="font-bold text-gray-800">No trips yet</p>
            <p className="text-sm text-gray-400 mt-1">Create a trip to share your location</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 font-medium mb-4 flex items-center gap-1.5">
              <Navigation className="h-4 w-4 text-indigo-400" />
              Pick a trip to open the map
            </p>
            <div className="space-y-2">
              {activeTrips.map((trip: any) => (
                <Link key={trip.id} href={`/trips/${trip.id}/map`}>
                  <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm active:scale-[0.98] transition-transform">
                    <div className="h-11 w-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <Map className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{trip.title}</p>
                      {trip.destination && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />{trip.destination}
                        </p>
                      )}
                    </div>
                    <Navigation className="h-4 w-4 text-gray-300 shrink-0" />
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
