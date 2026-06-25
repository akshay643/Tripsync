export const dynamic = "force-dynamic";
import { getServerUser } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { SettlementList } from "@/components/settlements/SettlementList";
import { calculateSettlements } from "@/lib/settlement";

export default async function SettlementsPage({
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

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*, expense_splits(*)")
    .eq("trip_id", tripId);

  const { data: existingSettlements } = await supabase
    .from("settlements")
    .select("*")
    .eq("trip_id", tripId)
    .eq("settled", true);

  const memberIds = trip.trip_members.map((m: any) => m.user_id);
  const settlements = calculateSettlements(expenses ?? [], memberIds);

  const profiles: Record<string, any> = {};
  trip.trip_members.forEach((m: any) => {
    if (m.profiles) profiles[m.user_id] = m.profiles;
  });

  const settledKeys = new Set(
    (existingSettlements ?? []).map((s: any) => `${s.from_user}:${s.to_user}`)
  );

  return (
    <>
      <TopBar title="Settle Up" backHref={`/trips/${tripId}`} />
      <div className="px-4 py-4">
        <SettlementList
          tripId={tripId}
          settlements={settlements}
          profiles={profiles}
          currentUserId={user?.id ?? ""}
          existingSettled={settledKeys}
        />
      </div>
    </>
  );
}
