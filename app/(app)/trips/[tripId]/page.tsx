export const dynamic = "force-dynamic";
import { getServerUser } from "@/lib/supabase/server";
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
  const { supabase, user } = await getServerUser();

  const [{ data: trip }, { data: expenses }, { data: myExpenses }, { data: mySplits }] = await Promise.all([
    supabase.from("trips").select("*, trip_members(*, profiles(*))").eq("id", tripId).single(),
    supabase.from("expenses").select("amount").eq("trip_id", tripId),
    supabase.from("expenses").select("amount").eq("trip_id", tripId).eq("paid_by", user?.id ?? ""),
    supabase
      .from("expense_splits")
      .select("amount, expenses!inner(trip_id)")
      .eq("user_id", user?.id ?? "")
      .eq("expenses.trip_id", tripId),
  ]);

  if (!trip) notFound();
  const isMember = trip.trip_members.some((m: any) => m.user_id === user?.id);
  if (!isMember) notFound();

  const totalSpend = (expenses ?? []).reduce((s: number, e: any) => s + e.amount, 0);
  const totalPaid  = (myExpenses ?? []).reduce((s: number, e: any) => s + e.amount, 0);
  const totalOwed  = (mySplits ?? []).reduce((s: number, e: any) => s + e.amount, 0);
  const balance    = totalPaid - totalOwed;

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
        balance={balance}
      />
    </>
  );
}
