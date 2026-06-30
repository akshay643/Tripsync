import { getServerUser } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params;
  const { supabase, user } = await getServerUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const date = typeof body.date === "string" && body.date ? body.date : new Date().toISOString().split("T")[0];
  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : null;

  const { data: membership } = await supabase
    .from("trip_members")
    .select("id")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "You are not a member of this trip" }, { status: 403 });
  }

  const { data: rpcDay, error: rpcErr } = await supabase.rpc("create_itinerary_day", {
    p_trip_id: tripId,
    p_date: date,
    p_title: title,
  });

  if (!rpcErr && rpcDay) {
    return NextResponse.json({ day: rpcDay });
  }

  const { data: existingDays } = await supabase
    .from("itinerary_days")
    .select("day_number")
    .eq("trip_id", tripId)
    .order("day_number", { ascending: false })
    .limit(1);

  const nextDayNumber = (existingDays?.[0]?.day_number ?? 0) + 1;

  const { data: inserted, error: insertErr } = await supabase
    .from("itinerary_days")
    .insert({
      trip_id: tripId,
      date,
      day_number: nextDayNumber,
      title,
    })
    .select("*")
    .single();

  if (insertErr) {
    return NextResponse.json({
      error: insertErr.message || rpcErr?.message || "Could not create itinerary day",
    }, { status: 400 });
  }

  return NextResponse.json({ day: inserted });
}
