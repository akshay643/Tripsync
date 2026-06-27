export const dynamic = "force-dynamic";

import { getServerUser } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { PackingListClient } from "@/components/packing/PackingListClient";
import type { PackingItem, Profile } from "@/types";

type MemberProfileRow = {
  profiles: Partial<Profile> | Partial<Profile>[] | null;
};

export default async function PackingPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { supabase, user } = await getServerUser();
  const { tripId } = await params;

  const [{ data: trip }, { data: member }, { data: items }, { data: memberRows }] = await Promise.all([
    supabase.from("trips").select("title, destination, start_date, end_date").eq("id", tripId).single(),
    supabase.from("trip_members").select("role").eq("trip_id", tripId).eq("user_id", user!.id).single(),
    supabase
      .from("packing_items")
      .select("*, added_by_profile:profiles!added_by(id,name,avatar), assigned_to_profile:profiles!assigned_to(id,name,avatar)")
      .eq("trip_id", tripId)
      .order("category")
      .order("order_index"),
    supabase
      .from("trip_members")
      .select("profiles(id,name,avatar)")
      .eq("trip_id", tripId),
  ]);

  if (!trip || !member) notFound();

  const members = ((memberRows ?? []) as MemberProfileRow[])
    .map((row) => Array.isArray(row.profiles) ? row.profiles[0] : row.profiles)
    .filter((profile): profile is Profile => Boolean(profile?.id));

  return (
    <>
      <TopBar title="Packing List" backHref={`/trips/${tripId}`} />
      <PackingListClient
        tripId={tripId}
        currentUserId={user!.id}
        members={members}
        initialItems={(items ?? []) as PackingItem[]}
        tripTitle={trip.title}
        destination={trip.destination}
        startDate={trip.start_date}
        endDate={trip.end_date}
      />
    </>
  );
}
