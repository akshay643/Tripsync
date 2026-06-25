export const dynamic = "force-dynamic";
import { getServerUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { ProfileClient } from "@/components/profile/ProfileClient";

export default async function ProfilePage() {
  const { supabase, user } = await getServerUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <>
      <TopBar title="Profile" />
      <ProfileClient profile={profile} userEmail={user.email ?? ""} />
    </>
  );
}
