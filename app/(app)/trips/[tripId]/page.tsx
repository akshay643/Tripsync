export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { InviteSheet } from "@/components/trips/InviteSheet";
import { TripDashboardClient } from "@/components/trips/TripDashboardClient";

export default async function TripDashboardPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const supabase = await createClient();

  // All three fetches in parallel
  const [{ data: { user } }, { data: trip }, { data: expenses }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("trips").select("*, trip_members(*, profiles(*))").eq("id", tripId).single(),
    supabase.from("expenses").select("amount").eq("trip_id", tripId),
  ]);

  if (!trip) notFound();
  const isMember = trip.trip_members.some((m: any) => m.user_id === user?.id);
  if (!isMember) notFound();

  const totalSpend = (expenses ?? []).reduce((s: number, e: any) => s + e.amount, 0);

  return (
    <>
      <TopBar
        title={trip.title}
        backHref="/trips"
        right={<InviteSheet tripId={tripId} tripTitle={trip.title} />}
      />
      <TripDashboardClient
        trip={trip}
        tripId={tripId}
        totalSpend={totalSpend}
        expenseCount={expenses?.length ?? 0}
        currentUserId={user?.id ?? ""}
      />
    </>
  );
}
