"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <Button variant="outline" className="w-full gap-2 text-red-500 border-red-100 hover:bg-red-50" onClick={handleLogout}>
      <LogOut className="h-4 w-4" />
      Sign Out
    </Button>
  );
}
