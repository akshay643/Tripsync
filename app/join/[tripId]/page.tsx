export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function JoinTripPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/join/${tripId}`);
  }

  const { data: trip } = await supabase
    .from("trips")
    .select("id, title")
    .eq("id", tripId)
    .single();

  if (!trip) {
    redirect("/trips");
  }

  const { data: existing } = await supabase
    .from("trip_members")
    .select("id")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    await supabase.from("trip_members").insert({
      trip_id: tripId,
      user_id: user.id,
      role: "member",
    });
  }

  redirect(`/trips/${tripId}`);
}
