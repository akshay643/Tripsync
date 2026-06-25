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

  // Parallel fetch — user + trip at the same time
  const [{ data: { user } }, { data: trip }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("trips").select("title, start_date, end_date, trip_members(user_id)").eq("id", tripId).single(),
  ]);

  if (!trip) notFound();
  const isMember = trip.trip_members.some((m: any) => m.user_id === user?.id);
  if (!isMember) notFound();

  // Fetch days and items as two separate queries — nested joins are unreliable with complex RLS
  let { data: rawDays } = await supabase
    .from("itinerary_days")
    .select("*")
    .eq("trip_id", tripId)
    .order("day_number");

  // Auto-create days from trip dates if none exist
  if ((!rawDays || rawDays.length === 0) && trip.start_date && trip.end_date) {
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
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
  const dayIds = (rawDays ?? []).map((d: any) => d.id);
  const { data: items } = dayIds.length > 0
    ? await supabase.from("itinerary_items").select("*").in("day_id", dayIds).order("order_index")
    : { data: [] };

  // Merge items into days
  const days = (rawDays ?? []).map((day: any) => ({
    ...day,
    items: (items ?? []).filter((item: any) => item.day_id === day.id),
  }));

  return (
    <>
      <TopBar title="Itinerary" backHref={`/trips/${tripId}`} />
      <ItineraryView tripId={tripId} days={days} currentUserId={user?.id ?? ""} />
    </>
  );
}
