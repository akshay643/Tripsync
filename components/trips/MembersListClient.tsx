"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/components/ui/motion";
import { Crown, Users } from "lucide-react";

interface Props {
  members: any[];
  currentUserId: string;
}

export function MembersListClient({ members, currentUserId }: Props) {
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

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-2">
        {members.map((m: any) => {
          const profile = m.profiles;
          const isMe = m.user_id === currentUserId;
          const isAdmin = m.role === "admin";
          return (
            <motion.div key={m.id} variants={staggerItem}
              className="flex items-center gap-3 rounded-2xl border border-white/5 bg-[#0f0f1e] p-4">
              <div className="relative shrink-0">
                <Avatar className="h-11 w-11">
                  <AvatarImage src={profile?.avatar} />
                  <AvatarFallback className={isMe ? "bg-indigo-600 text-white" : "bg-white/8 text-slate-300"}>
                    {getInitials(profile?.name)}
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
              <Badge variant={isAdmin ? "warning" : "secondary"}>
                {m.role}
              </Badge>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
