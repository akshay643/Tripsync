"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, Calendar, Wallet, Sparkles } from "lucide-react";
import { staggerContainer, staggerItem } from "@/components/ui/motion";

function Field({ label, icon: Icon, children }: { label: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</Label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none z-10" />
        {children}
      </div>
    </div>
  );
}

const inputCls = "w-full h-12 rounded-xl bg-white/5 border border-white/8 text-white placeholder:text-slate-600 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/40";
const dateInputCls = "w-full h-12 rounded-xl bg-white/5 border border-white/8 text-white pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/40 [color-scheme:dark]";

export function CreateTripForm() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", destination: "", start_date: "", end_date: "", budget: "" });
  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) return;
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not authenticated"); setLoading(false); return; }

    const { data: trip, error: tripErr } = await supabase
      .from("trips")
      .insert({
        title: form.title,
        destination: form.destination || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        budget: form.budget ? parseFloat(form.budget) : null,
        created_by: user.id,
      })
      .select()
      .single();

    if (tripErr || !trip) { setError(tripErr?.message || "Failed to create trip"); setLoading(false); return; }
    await supabase.from("trip_members").insert({ trip_id: trip.id, user_id: user.id, role: "admin" });
    router.push(`/trips/${trip.id}`);
  }

  return (
    <div className="min-h-screen bg-[#08080f]">
      <motion.form
        onSubmit={handleSubmit}
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="px-4 py-6 space-y-5"
      >
        <motion.div variants={staggerItem}>
          <Field label="Trip name *" icon={Sparkles}>
            <input
              placeholder="Goa Boys Trip 🏖️"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
              autoFocus
              className={inputCls}
            />
          </Field>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Field label="Destination" icon={MapPin}>
            <input
              placeholder="Goa, India"
              value={form.destination}
              onChange={(e) => set("destination", e.target.value)}
              className={inputCls}
            />
          </Field>
        </motion.div>

        <motion.div variants={staggerItem} className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Start date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none z-10" />
              <input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} className={dateInputCls} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">End date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 pointer-events-none z-10" />
              <input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} className={dateInputCls} />
            </div>
          </div>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Field label="Budget (₹)" icon={Wallet}>
            <input
              type="number"
              placeholder="50,000"
              value={form.budget}
              onChange={(e) => set("budget", e.target.value)}
              className={inputCls}
            />
          </Field>
        </motion.div>

        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
            {error}
          </motion.p>
        )}

        <motion.div variants={staggerItem} className="pt-2">
          <motion.button
            type="submit"
            disabled={loading || !form.title}
            whileTap={{ scale: 0.98 }}
            className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Creating…" : "Create Trip ✈️"}
          </motion.button>
        </motion.div>
      </motion.form>
    </div>
  );
}
