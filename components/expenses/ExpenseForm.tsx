"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { buildEqualSplits } from "@/lib/settlement";
import { CATEGORY_LABELS, CATEGORY_ICONS, formatCurrency, getInitials } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/components/ui/motion";
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
  const [error, setError] = useState("");
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
    setError("");

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

    if (expErr || !expense) {
      setError(expErr?.message ?? "Failed to add expense");
      setLoading(false);
      return;
    }

    let splits: { expense_id: string; user_id: string; amount: number }[] = [];

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
    <motion.form
      onSubmit={handleSubmit}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="px-4 py-5 space-y-4 pb-10"
    >
      {/* Category picker */}
      <motion.div variants={staggerItem} className="space-y-2">
        <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</Label>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat}
              type="button"
              onClick={() => set("category", cat)}
              whileTap={{ scale: 0.92 }}
              className={`shrink-0 flex flex-col items-center gap-1 rounded-2xl px-3 py-2.5 border text-xs font-medium transition-all ${
                form.category === cat
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                  : "bg-white/5 text-slate-300 border-white/8"
              }`}
            >
              <span className="text-lg">{CATEGORY_ICONS[cat]}</span>
              <span>{CATEGORY_LABELS[cat]}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={staggerItem} className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Title *</Label>
        <Input
          placeholder="Dinner at Curlies"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          required
          className="h-12 rounded-xl"
        />
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount (₹) *</Label>
          <Input
            type="number"
            placeholder="2000"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            required
            className="h-12 rounded-xl text-lg font-bold text-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</Label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            className="h-12 rounded-xl"
          />
        </div>
      </motion.div>

      <motion.div variants={staggerItem} className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Paid by</Label>
        <Select value={form.paid_by} onValueChange={(v) => set("paid_by", v)}>
          <SelectTrigger className="h-12 rounded-xl">
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
      </motion.div>

      {/* Split type tabs */}
      <motion.div variants={staggerItem} className="space-y-3">
        <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Split type</Label>
        <div className="relative flex gap-1 bg-white/5 rounded-xl p-1">
          {(["equal", "custom"] as SplitType[]).map((type) => (
            <motion.button
              key={type}
              type="button"
              onClick={() => setSplitType(type)}
              className={`relative flex-1 py-2 rounded-lg text-sm font-semibold transition-colors z-10 ${
                splitType === type ? "text-white" : "text-slate-500"
              }`}
            >
              {splitType === type && (
                <motion.div
                  layoutId="split-pill"
                  className="absolute inset-0 bg-indigo-600/20 rounded-lg"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative">{type === "equal" ? "Equal Split" : "Custom"}</span>
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {splitType === "equal" && totalAmount > 0 && (
            <motion.div
              key="equal-hint"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-3 text-sm text-indigo-300 font-medium"
            >
              {formatCurrency(equalShare)} each × {members.length} people
            </motion.div>
          )}

          {splitType === "custom" && (
            <motion.div
              key="custom-list"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={m.avatar || undefined} />
                    <AvatarFallback className="text-xs">{getInitials(m.name)}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-sm text-slate-200 font-medium">
                    {m.id === currentUserId ? "You" : m.name || m.email}
                  </span>
                  <Input
                    type="number"
                    placeholder="0"
                    className="w-24 text-right h-10 rounded-xl"
                    value={customAmounts[m.id] || ""}
                    onChange={(e) =>
                      setCustomAmounts((prev) => ({ ...prev, [m.id]: e.target.value }))
                    }
                  />
                </div>
              ))}
              {customTotal > 0 && totalAmount > 0 && Math.abs(customTotal - totalAmount) > 0.01 && (
                <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                  Total ({formatCurrency(customTotal)}) doesn&apos;t match ({formatCurrency(totalAmount)})
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div variants={staggerItem} className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Notes</Label>
        <Textarea
          placeholder="Optional notes…"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          className="rounded-xl resize-none"
          rows={2}
        />
      </motion.div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2"
        >
          {error}
        </motion.p>
      )}

      <motion.div variants={staggerItem}>
        <motion.button
          type="submit"
          disabled={loading || !form.title || !form.amount}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full h-12 rounded-xl bg-linear-to-r bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Adding…" : "Add Expense"}
        </motion.button>
      </motion.div>
    </motion.form>
  );
}
