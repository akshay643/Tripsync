export const dynamic = "force-dynamic";
import { getServerUser } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { SettlementList } from "@/components/settlements/SettlementList";
import { calculateSettlements } from "@/lib/settlement";
import type { Expense, ExpenseSplit, Profile } from "@/types";

type MemberRow = {
  user_id: string;
  profiles: Profile | null;
};

type RawMemberRow = {
  user_id: string;
  profiles: Profile | Profile[] | null;
};

type ExpenseWithSplits = Expense & {
  expense_splits: ExpenseSplit[];
};

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
  const tripMembers = (trip.trip_members as RawMemberRow[]).map((member) => ({
    user_id: member.user_id,
    profiles: Array.isArray(member.profiles) ? member.profiles[0] ?? null : member.profiles,
  })) satisfies MemberRow[];
  const isMember = tripMembers.some((m) => m.user_id === user?.id);
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

  const typedExpenses = (expenses ?? []) as ExpenseWithSplits[];
  const participantIds = new Set<string>();
  tripMembers.forEach((m) => participantIds.add(m.user_id));
  typedExpenses.forEach((expense) => {
    participantIds.add(expense.paid_by);
    expense.expense_splits?.forEach((split) => participantIds.add(split.user_id));
  });

  const memberIds = Array.from(participantIds);
  const settlements = calculateSettlements(typedExpenses, memberIds);

  const profiles: Record<string, Profile> = {};
  tripMembers.forEach((m) => {
    if (m.profiles) profiles[m.user_id] = m.profiles;
  });

  const missingProfileIds = memberIds.filter((id) => !profiles[id]);
  if (missingProfileIds.length > 0) {
    const { data: historicalProfiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", missingProfileIds);
    ((historicalProfiles ?? []) as Profile[]).forEach((profile) => {
      profiles[profile.id] = profile;
    });
  }

  const settledKeys = new Set(
    (existingSettlements ?? []).map((s) => `${s.from_user}:${s.to_user}`)
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
