"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/components/ui/motion";
import { Crown, Loader2, LogOut, Trash2, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

interface MemberRow {
  id: string;
  trip_id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  profiles: Profile | null;
}

interface Props {
  tripId: string;
  members: MemberRow[];
  currentUserId: string;
  currentUserIsAdmin: boolean;
  adminCount: number;
}

export function MembersListClient({
  tripId,
  members: initialMembers,
  currentUserId,
  currentUserIsAdmin,
  adminCount,
}: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function removeMembership(member: MemberRow) {
    const isMe = member.user_id === currentUserId;
    const isLastAdmin = member.role === "admin" && adminCount <= 1;
    if (isLastAdmin) {
      setError("At least one admin must stay in the trip.");
      return;
    }

    setBusyMemberId(member.id);
    setError("");
    const { error: deleteErr } = await supabase
      .from("trip_members")
      .delete()
      .eq("id", member.id)
      .eq("trip_id", tripId);

    if (deleteErr) {
      setError(deleteErr.message || "Could not update trip members.");
      setBusyMemberId(null);
      return;
    }

    if (isMe) {
      router.replace("/trips");
      router.refresh();
      return;
    }

    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    setBusyMemberId(null);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#08080f] px-4 pt-4 pb-8">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-xl bg-pink-500/10 flex items-center justify-center">
          <Users className="h-4 w-4 text-pink-400" />
        </div>
        <p className="text-sm text-slate-500 font-medium">
          {members.length} member{members.length !== 1 ? "s" : ""}
        </p>
      </motion.div>

      <div className="mb-4 rounded-2xl border border-white/7 bg-[#0f0f1e] p-4">
        <p className="text-sm font-bold text-white">Group access</p>
        <p className="text-xs text-slate-500 mt-1">
          Leaving removes access and stops future splits, but old expenses and settlement balances stay in the trip history.
        </p>
        {error && (
          <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        )}
      </div>

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-2">
        {members.map((m) => {
          const profile = m.profiles;
          const isMe = m.user_id === currentUserId;
          const isAdmin = m.role === "admin";
          const canRemove = currentUserIsAdmin && !isMe && !(isAdmin && adminCount <= 1);
          const canLeave = isMe && !(isAdmin && adminCount <= 1);
          const busy = busyMemberId === m.id;
          return (
            <motion.div key={m.id} variants={staggerItem}
              className="flex items-center gap-3 rounded-2xl border border-white/5 bg-[#0f0f1e] p-4">
              <div className="relative shrink-0">
                <Avatar className="h-11 w-11">
                  <AvatarImage src={profile?.avatar ?? undefined} />
                  <AvatarFallback className={isMe ? "bg-indigo-600 text-white" : "bg-white/8 text-slate-300"}>
                    {getInitials(profile?.name ?? null)}
                  </AvatarFallback>
                </Avatar>
                {isAdmin && (
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center">
                    <Crown className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">
                  {isMe ? "You" : profile?.name || "Member"}
                  {isMe && <span className="ml-1.5 text-xs text-indigo-400 font-normal">(you)</span>}
                </p>
                <p className="text-xs text-slate-600 truncate mt-0.5">{profile?.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={isAdmin ? "warning" : "secondary"}>
                  {m.role}
                </Badge>
                {canRemove && (
                  <button
                    onClick={() => removeMembership(m)}
                    disabled={busy}
                    className="h-8 w-8 rounded-xl bg-red-500/10 text-red-300 flex items-center justify-center disabled:opacity-50"
                    aria-label={`Remove ${profile?.name || "member"}`}
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                )}
                {canLeave && (
                  <button
                    onClick={() => removeMembership(m)}
                    disabled={busy}
                    className="flex items-center gap-1.5 rounded-xl bg-white/6 px-3 py-2 text-xs font-bold text-slate-300 disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                    Leave
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
