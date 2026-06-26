"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";
import { motion } from "framer-motion";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={handleLogout}
      className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold transition-colors hover:bg-red-500/15"
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </motion.button>
  );
}
