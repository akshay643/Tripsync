export const dynamic = "force-dynamic";
import { getServerUser } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { ItineraryView } from "@/components/itinerary/ItineraryView";
import type { ItineraryDay, ItineraryItem } from "@/types";

type TripMemberRow = { user_id: string };
type TripForItinerary = {
  title: string;
  start_date: string | null;
  end_date: string | null;
  trip_members: TripMemberRow[];
};

export default async function ItineraryPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const { supabase, user } = await getServerUser();

  const { data: trip } = await supabase
    .from("trips")
    .select("title, start_date, end_date, trip_members(user_id)")
    .eq("id", tripId)
    .single();

  if (!trip) notFound();
  const typedTrip = trip as TripForItinerary;
  const isMember = typedTrip.trip_members.some((m) => m.user_id === user?.id);
  if (!isMember) notFound();

  // Fetch days and items as two separate queries — nested joins are unreliable with complex RLS
  let { data: rawDays } = await supabase
    .from("itinerary_days")
    .select("*")
    .eq("trip_id", tripId)
    .order("day_number");

  // Auto-create days from trip dates if none exist
  if ((!rawDays || rawDays.length === 0) && typedTrip.start_date && typedTrip.end_date) {
    const start = new Date(typedTrip.start_date);
    const end = new Date(typedTrip.end_date);
    const count = Math.ceil((end.getTime() - start.getTime()) / 864e5) + 1;

    const newDays = Array.from({ length: count }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { trip_id: tripId, date: d.toISOString().split("T")[0], day_number: i + 1, title: null };
    });

    const { data: created } = await supabase.from("itinerary_days").insert(newDays).select("*");
    rawDays = created;
  }

  // Fetch items separately to avoid nested-join RLS issues
  const typedRawDays = (rawDays ?? []) as ItineraryDay[];
  const dayIds = typedRawDays.map((d) => d.id);
  const { data: items } = dayIds.length > 0
    ? await supabase.from("itinerary_items").select("*").in("day_id", dayIds).order("order_index")
    : { data: [] };

  // Merge items into days
  const typedItems = (items ?? []) as ItineraryItem[];
  const days = typedRawDays.map((day) => ({
    ...day,
    items: typedItems.filter((item) => item.day_id === day.id),
  }));

  return (
    <>
      <TopBar title="Itinerary" backHref={`/trips/${tripId}`} />
      <ItineraryView tripId={tripId} days={days} currentUserId={user?.id ?? ""} />
    </>
  );
}
