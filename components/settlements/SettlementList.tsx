"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, ArrowRight, PartyPopper } from "lucide-react";
import { formatCurrency, getInitials } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/components/ui/motion";
import type { CalculatedSettlement, Profile } from "@/types";

interface Props {
  tripId: string;
  settlements: CalculatedSettlement[];
  profiles: Record<string, Profile>;
  currentUserId: string;
  existingSettled: Set<string>;
}

function key(s: CalculatedSettlement) { return `${s.from_user}:${s.to_user}`; }

export function SettlementList({ tripId, settlements, profiles, currentUserId, existingSettled }: Props) {
  const supabase = createClient();
  const [settled, setSettled] = useState<Set<string>>(existingSettled);
  const [loading, setLoading] = useState<string | null>(null);

  async function markSettled(s: CalculatedSettlement) {
    const k = key(s);
    setLoading(k);
    await supabase.from("settlements").upsert({
      trip_id: tripId,
      from_user: s.from_user,
      to_user: s.to_user,
      amount: s.amount,
      settled: true,
      settled_at: new Date().toISOString(),
    });
    setSettled((prev) => new Set([...prev, k]));
    setLoading(null);
  }

  if (settlements.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="h-20 w-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center mb-4">
          <PartyPopper className="h-10 w-10 text-emerald-500" />
        </div>
        <p className="text-lg font-bold text-white">All settled up!</p>
        <p className="text-sm text-slate-500 mt-1">No outstanding balances 🎉</p>
      </motion.div>
    );
  }

  const pending = settlements.filter((s) => !settled.has(key(s)));
  const done = settlements.filter((s) => settled.has(key(s)));

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-1">To settle</p>
          {pending.map((s) => {
            const k = key(s);
            const from = profiles[s.from_user];
            const to = profiles[s.to_user];
            const isMe = s.from_user === currentUserId;
            return (
              <motion.div key={k} variants={staggerItem}
                className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={from?.avatar ?? undefined} />
                  <AvatarFallback>{getInitials(from?.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                    <span>{isMe ? "You" : from?.name?.split(" ")[0] ?? "Someone"}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span>{s.to_user === currentUserId ? "You" : to?.name?.split(" ")[0] ?? "Someone"}</span>
                  </div>
                  <p className="text-lg font-bold text-white mt-0.5">{formatCurrency(s.amount)}</p>
                </div>
                {isMe && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => markSettled(s)}
                    disabled={loading === k}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl disabled:opacity-50 transition-colors shrink-0"
                  >
                    {loading === k ? "…" : "Settle"}
                  </motion.button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {done.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-1 mt-4">Settled</p>
          {done.map((s) => {
            const from = profiles[s.from_user];
            const to = profiles[s.to_user];
            const isMe = s.from_user === currentUserId;
            return (
              <div key={key(s)} className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                <Avatar className="h-10 w-10 shrink-0 opacity-60">
                  <AvatarImage src={from?.avatar ?? undefined} />
                  <AvatarFallback>{getInitials(from?.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 opacity-60">
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                    <span>{isMe ? "You" : from?.name?.split(" ")[0]}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                    <span>{s.to_user === currentUserId ? "You" : to?.name?.split(" ")[0]}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-600 line-through">{formatCurrency(s.amount)}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
