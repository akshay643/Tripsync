"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { buildEqualSplits } from "@/lib/settlement";
import { CATEGORY_LABELS, CATEGORY_ICONS, formatCurrency, getInitials } from "@/lib/utils";
import type { Profile, SplitType } from "@/types";

interface ExpenseFormProps {
  tripId: string;
  members: Profile[];
  currentUserId: string;
}

const CATEGORIES = ["food", "hotel", "taxi", "activities", "shopping", "misc"] as const;

export function ExpenseForm({ tripId, members, currentUserId }: ExpenseFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "food",
    paid_by: currentUserId,
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const totalAmount = parseFloat(form.amount) || 0;
  const equalShare = members.length > 0 ? totalAmount / members.length : 0;

  const customTotal = Object.values(customAmounts).reduce(
    (sum, v) => sum + (parseFloat(v) || 0),
    0
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.amount) return;
    setLoading(true);

    const { data: expense, error: expErr } = await supabase
      .from("expenses")
      .insert({
        trip_id: tripId,
        title: form.title,
        amount: totalAmount,
        category: form.category,
        paid_by: form.paid_by,
        date: form.date,
        notes: form.notes || null,
        split_type: splitType,
      })
      .select()
      .single();

    if (expErr || !expense) { setLoading(false); return; }

    let splits: { expense_id: string; user_id: string; amount: number; percentage?: number }[] = [];

    if (splitType === "equal") {
      splits = buildEqualSplits(totalAmount, members.map((m) => m.id)).map((s) => ({
        ...s,
        expense_id: expense.id,
      }));
    } else if (splitType === "custom") {
      splits = members
        .filter((m) => parseFloat(customAmounts[m.id] || "0") > 0)
        .map((m) => ({
          expense_id: expense.id,
          user_id: m.id,
          amount: parseFloat(customAmounts[m.id] || "0"),
        }));
    } else {
      splits = buildEqualSplits(totalAmount, members.map((m) => m.id)).map((s) => ({
        ...s,
        expense_id: expense.id,
      }));
    }

    await supabase.from("expense_splits").insert(splits);
    router.push(`/trips/${tripId}/expenses`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="space-y-1.5">
        <Label>Title *</Label>
        <Input placeholder="Dinner at Curlies" value={form.title} onChange={(e) => set("title", e.target.value)} required />
      </div>

      <div className="space-y-1.5">
        <Label>Amount (₹) *</Label>
        <Input type="number" placeholder="2000" value={form.amount} onChange={(e) => set("amount", e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Date</Label>
          <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Paid by</Label>
        <Select value={form.paid_by} onValueChange={(v) => set("paid_by", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.id === currentUserId ? "You" : m.name || m.email || "Unknown"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Split type</Label>
        <div className="flex gap-2">
          {(["equal", "custom"] as SplitType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSplitType(type)}
              className={`flex-1 rounded-xl py-2 text-sm font-medium border transition-colors ${
                splitType === type
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-200"
              }`}
            >
              {type === "equal" ? "Equal" : "Custom"}
            </button>
          ))}
        </div>
      </div>

      {splitType === "equal" && totalAmount > 0 && (
        <div className="rounded-xl bg-indigo-50 p-3 text-sm text-indigo-700">
          {formatCurrency(equalShare)} each × {members.length} people
        </div>
      )}

      {splitType === "custom" && (
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={m.avatar || undefined} />
                <AvatarFallback>{getInitials(m.name)}</AvatarFallback>
              </Avatar>
              <span className="flex-1 text-sm text-gray-700">
                {m.id === currentUserId ? "You" : m.name || m.email}
              </span>
              <Input
                type="number"
                placeholder="0"
                className="w-24 text-right"
                value={customAmounts[m.id] || ""}
                onChange={(e) =>
                  setCustomAmounts((prev) => ({ ...prev, [m.id]: e.target.value }))
                }
              />
            </div>
          ))}
          {customTotal > 0 && totalAmount > 0 && Math.abs(customTotal - totalAmount) > 0.01 && (
            <p className="text-xs text-red-500">
              Total ({formatCurrency(customTotal)}) doesn&apos;t match amount ({formatCurrency(totalAmount)})
            </p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea placeholder="Optional notes..." value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>

      <Button type="submit" className="w-full" disabled={loading || !form.title || !form.amount}>
        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Add Expense
      </Button>
    </form>
  );
}
