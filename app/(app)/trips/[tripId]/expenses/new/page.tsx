export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";

export default async function NewExpensePage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: trip } = await supabase
    .from("trips")
    .select("title, trip_members(user_id, profiles(*))")
    .eq("id", tripId)
    .single();

  if (!trip) notFound();
  const isMember = trip.trip_members.some((m: any) => m.user_id === user?.id);
  if (!isMember) notFound();

  const members = trip.trip_members
    .map((m: any) => m.profiles)
    .filter(Boolean);

  return (
    <>
      <TopBar title="Add Expense" backHref={`/trips/${tripId}/expenses`} />
      <ExpenseForm tripId={tripId} members={members} currentUserId={user?.id ?? ""} />
    </>
  );
}
