"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, ArrowRight } from "lucide-react";
import { formatCurrency, getInitials } from "@/lib/utils";
import type { CalculatedSettlement, Profile } from "@/types";

interface SettlementListProps {
  tripId: string;
  settlements: CalculatedSettlement[];
  profiles: Record<string, Profile>;
  currentUserId: string;
  existingSettled: Set<string>;
}

function settlementKey(s: CalculatedSettlement) {
  return `${s.from_user}:${s.to_user}`;
}

export function SettlementList({
  tripId,
  settlements,
  profiles,
  currentUserId,
  existingSettled,
}: SettlementListProps) {
  const supabase = createClient();
  const [settled, setSettled] = useState<Set<string>>(existingSettled);
  const [loading, setLoading] = useState<string | null>(null);

  async function markSettled(settlement: CalculatedSettlement) {
    const key = settlementKey(settlement);
    setLoading(key);

    await supabase.from("settlements").upsert({
      trip_id: tripId,
      from_user: settlement.from_user,
      to_user: settlement.to_user,
      amount: settlement.amount,
      settled: true,
      settled_at: new Date().toISOString(),
    });

    setSettled((prev) => new Set([...prev, key]));
    setLoading(null);
  }

  if (settlements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <p className="font-semibold text-gray-900">All settled up!</p>
        <p className="text-sm text-gray-500 mt-1">No outstanding balances</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {settlements.map((settlement) => {
        const key = settlementKey(settlement);
        const isSettled = settled.has(key);
        const fromProfile = profiles[settlement.from_user];
        const toProfile = profiles[settlement.to_user];
        const isMe = settlement.from_user === currentUserId;

        return (
          <div
            key={key}
            className={`flex items-center gap-3 rounded-2xl border p-4 transition-colors ${
              isSettled ? "border-emerald-100 bg-emerald-50" : "border-gray-100 bg-white"
            }`}
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={fromProfile?.avatar || undefined} />
              <AvatarFallback>{getInitials(fromProfile?.name)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-sm">
                <span className="font-medium text-gray-900">
                  {isMe ? "You" : fromProfile?.name || "Someone"}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="font-medium text-gray-900 truncate">
                  {settlement.to_user === currentUserId ? "You" : toProfile?.name || "Someone"}
                </span>
              </div>
              <p className="text-base font-semibold text-gray-900 mt-0.5">
                {formatCurrency(settlement.amount)}
              </p>
            </div>

            {isSettled ? (
              <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                <Check className="h-4 w-4" />
                Done
              </div>
            ) : isMe ? (
              <Button
                size="sm"
                onClick={() => markSettled(settlement)}
                disabled={loading === key}
                className="shrink-0"
              >
                Settle
              </Button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
