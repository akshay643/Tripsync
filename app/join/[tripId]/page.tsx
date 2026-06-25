export const dynamic = "force-dynamic";
import { getServerUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function JoinTripPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const { supabase, user } = await getServerUser();

  if (!user) {
    redirect(`/login?next=/join/${tripId}`);
  }

  // DO NOT query trips here — the trips_select RLS policy requires the user
  // to already be a member, so it returns null for invitees and falsely
  // redirects them to /trips. Skip it entirely.
  //
  // Instead just INSERT directly:
  // - trip_members INSERT policy allows it when user_id = auth.uid() ✓
  // - FK on trip_id rejects phantom trip IDs (error code 23503)
  // - UNIQUE(trip_id, user_id) silently handles already-members (code 23505)
  const { error } = await supabase.from("trip_members").insert({
    trip_id: tripId,
    user_id: user.id,
    role: "member",
  });

  if (error && error.code === "23503") {
    // FK violation — trip ID doesn't exist
    redirect("/trips");
  }

  // 23505 = already a member → still redirect to trip (no-op join)
  // Any other error → try going to trip anyway; trip page will 404 if needed
  redirect(`/trips/${tripId}`);
}
