export const dynamic = "force-dynamic";
import { getServerUser } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { InviteSheet } from "@/components/trips/InviteSheet";
import { MembersListClient } from "@/components/trips/MembersListClient";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const { supabase, user } = await getServerUser();

  const { data: trip } = await supabase
    .from("trips")
    .select("title, trip_members(*, profiles(*))")
    .eq("id", tripId)
    .single();

  if (!trip) notFound();
  const isMember = trip.trip_members.some((m: any) => m.user_id === user?.id);
  if (!isMember) notFound();

  return (
    <>
      <TopBar
        title="Members"
        backHref={`/trips/${tripId}`}
        right={<InviteSheet tripId={tripId} tripTitle={trip.title} />}
      />
      <MembersListClient members={trip.trip_members} currentUserId={user?.id ?? ""} />
    </>
  );
}
