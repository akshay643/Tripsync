export const dynamic = "force-dynamic";
import { getServerUser } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { TripMap } from "@/components/map/TripMap";

export default async function TripMapPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const { supabase, user } = await getServerUser();

  const { data: trip } = await supabase
    .from("trips")
    .select("title, trip_members(user_id, profiles(*))")
    .eq("id", tripId)
    .single();

  if (!trip) notFound();

  const isMember = trip.trip_members.some((m: any) => m.user_id === user?.id);
  if (!isMember) notFound();

  const memberProfiles: Record<string, any> = {};
  trip.trip_members.forEach((m: any) => {
    if (m.profiles) memberProfiles[m.user_id] = m.profiles;
  });

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Live Map" backHref={`/trips/${tripId}`} />
      <TripMap
        tripId={tripId}
        currentUserId={user?.id ?? ""}
        memberProfiles={memberProfiles}
      />
    </div>
  );
}
