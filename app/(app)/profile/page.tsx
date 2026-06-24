export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Settings, HelpCircle } from "lucide-react";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <>
      <TopBar title="Profile" />
      <div className="px-4 py-6 space-y-6">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 mb-3">
            <AvatarImage src={profile?.avatar} />
            <AvatarFallback className="text-2xl">{getInitials(profile?.name)}</AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold text-gray-900">{profile?.name || "Your Name"}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{profile?.email || user.email}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
          <button className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-100">
            <Settings className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Account Settings</span>
          </button>
          <button className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-gray-50 transition-colors">
            <HelpCircle className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Help & Support</span>
          </button>
        </div>

        <LogoutButton />
      </div>
    </>
  );
}
