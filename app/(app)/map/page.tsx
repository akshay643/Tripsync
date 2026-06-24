export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { Map, MapPin } from "lucide-react";

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

  return (
    <>
      <TopBar title="Map" />
      <div className="px-4 py-4">
        <p className="text-sm text-gray-500 mb-4">Select a trip to view the live map</p>
        {activeTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Map className="h-12 w-12 text-gray-200 mb-4" />
            <p className="font-semibold text-gray-700">No trips yet</p>
            <p className="text-sm text-gray-400 mt-1">Create a trip to use the live map</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTrips.map((trip: any) => (
              <Link key={trip.id} href={`/trips/${trip.id}/map`}>
                <Card className="active:scale-[0.98] transition-transform">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <Map className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{trip.title}</p>
                      {trip.destination && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {trip.destination}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
