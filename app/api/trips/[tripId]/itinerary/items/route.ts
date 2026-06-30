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
  const dayId = typeof body.dayId === "string" ? body.dayId : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const time = typeof body.time === "string" && body.time.trim() ? body.time.trim() : null;
  const location = typeof body.location === "string" && body.location.trim() ? body.location.trim() : null;

  if (!dayId || !title) {
    return NextResponse.json({ error: "Day and title are required" }, { status: 400 });
  }

  const { data: membership } = await supabase
    .from("trip_members")
    .select("id")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "You are not a member of this trip" }, { status: 403 });
  }

  const { data: day } = await supabase
    .from("itinerary_days")
    .select("id")
    .eq("id", dayId)
    .eq("trip_id", tripId)
    .maybeSingle();

  if (!day) {
    return NextResponse.json({ error: "This itinerary day was not found" }, { status: 404 });
  }

  const { data: rpcItem, error: rpcErr } = await supabase.rpc("add_itinerary_item", {
    p_trip_id: tripId,
    p_day_id: dayId,
    p_title: title,
    p_time: time,
    p_location: location,
  });

  if (!rpcErr && rpcItem) {
    return NextResponse.json({ item: rpcItem });
  }

  const { data: existingItems } = await supabase
    .from("itinerary_items")
    .select("order_index")
    .eq("trip_id", tripId)
    .eq("day_id", dayId)
    .order("order_index", { ascending: false })
    .limit(1);

  const nextOrder = (existingItems?.[0]?.order_index ?? -1) + 1;

  const { data: inserted, error: insertErr } = await supabase
    .from("itinerary_items")
    .insert({
      trip_id: tripId,
      day_id: dayId,
      title,
      time,
      location,
      order_index: nextOrder,
    })
    .select("*")
    .single();

  if (insertErr) {
    return NextResponse.json({
      error: insertErr.message || rpcErr?.message || "Could not save itinerary activity",
    }, { status: 400 });
  }

  return NextResponse.json({ item: inserted });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params;
  const { supabase, user } = await getServerUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("itemId");

  if (!itemId) {
    return NextResponse.json({ error: "Item is required" }, { status: 400 });
  }

  const { data: membership } = await supabase
    .from("trip_members")
    .select("id")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "You are not a member of this trip" }, { status: 403 });
  }

  const { error } = await supabase
    .from("itinerary_items")
    .delete()
    .eq("id", itemId)
    .eq("trip_id", tripId);

  if (error) {
    return NextResponse.json({ error: error.message || "Could not delete itinerary activity" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
