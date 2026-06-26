export const dynamic = "force-dynamic";

import { getServerUser } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { PackingListClient } from "@/components/packing/PackingListClient";

export default async function PackingPage({ params }: { params: { tripId: string } }) {
  const { supabase, user } = await getServerUser();
  const { tripId } = params;

  const [{ data: member }, { data: items }, { data: memberRows }] = await Promise.all([
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

  if (!member) notFound();

  const members = (memberRows ?? [])
    .map((r: any) => r.profiles)
    .filter(Boolean);

  return (
    <>
      <TopBar title="Packing List" backHref={`/trips/${tripId}`} />
      <PackingListClient
        tripId={tripId}
        currentUserId={user!.id}
        members={members}
        initialItems={(items ?? []) as any}
      />
    </>
  );
}
