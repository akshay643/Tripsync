export const dynamic = "force-dynamic";
import { getServerUser } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { InviteSheet } from "@/components/trips/InviteSheet";
import { MembersListClient } from "@/components/trips/MembersListClient";
import type { Profile } from "@/types";

type MemberRow = {
  id: string;
  trip_id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  profiles: Profile | null;
};

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
  const members = trip.trip_members as MemberRow[];
  const isMember = members.some((m) => m.user_id === user?.id);
  if (!isMember) notFound();
  const currentMembership = members.find((m) => m.user_id === user?.id);
  const isAdmin = currentMembership?.role === "admin";
  const adminCount = members.filter((m) => m.role === "admin").length;

  return (
    <>
      <TopBar
        title="Members"
        backHref={`/trips/${tripId}`}
        right={<InviteSheet tripId={tripId} tripTitle={trip.title} />}
      />
      <MembersListClient
        tripId={tripId}
        members={members}
        currentUserId={user?.id ?? ""}
        currentUserIsAdmin={isAdmin}
        adminCount={adminCount}
      />
    </>
  );
}
