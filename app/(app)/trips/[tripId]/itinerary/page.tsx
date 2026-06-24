export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { ItineraryView } from "@/components/itinerary/ItineraryView";

export default async function ItineraryPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: trip } = await supabase
    .from("trips")
    .select("title, start_date, end_date, trip_members(user_id)")
    .eq("id", tripId)
    .single();

  if (!trip) notFound();
  const isMember = trip.trip_members.some((m: any) => m.user_id === user?.id);
  if (!isMember) notFound();

  let { data: days } = await supabase
    .from("itinerary_days")
    .select("*, itinerary_items(*)")
    .eq("trip_id", tripId)
    .order("day_number");

  // Auto-create days if trip has dates and none exist yet
  if ((!days || days.length === 0) && trip.start_date && trip.end_date) {
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const newDays = Array.from({ length: dayCount }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return {
        trip_id: tripId,
        date: d.toISOString().split("T")[0],
        day_number: i + 1,
        title: null,
      };
    });

    const { data: created } = await supabase
      .from("itinerary_days")
      .insert(newDays)
      .select("*, itinerary_items(*)");

    days = created;
  }

  return (
    <>
      <TopBar title="Itinerary" backHref={`/trips/${tripId}`} />
      <ItineraryView
        tripId={tripId}
        days={days ?? []}
        currentUserId={user?.id ?? ""}
      />
    </>
  );
}
