export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { InviteSheet } from "@/components/trips/InviteSheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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

      <div className="px-4 py-4 space-y-2">
        {trip.trip_members.map((m: any) => {
          const profile = m.profiles;
          const isMe = m.user_id === user?.id;
          return (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4"
            >
              <Avatar className="h-11 w-11">
                <AvatarImage src={profile?.avatar} />
                <AvatarFallback>{getInitials(profile?.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">
                  {isMe ? "You" : profile?.name || "Member"}
                </p>
                <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
              </div>
              <Badge variant={m.role === "admin" ? "default" : "secondary"}>
                {m.role}
              </Badge>
            </div>
          );
        })}
      </div>
    </>
  );
}
