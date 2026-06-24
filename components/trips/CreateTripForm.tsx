"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, Calendar, Wallet, Sparkles } from "lucide-react";
import { staggerContainer, staggerItem } from "@/components/ui/motion";

export function CreateTripForm() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    destination: "",
    start_date: "",
    end_date: "",
    budget: "",
  });

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

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

    await supabase.from("trip_members").insert({
      trip_id: trip.id,
      user_id: user.id,
      role: "admin",
    });

    router.push(`/trips/${trip.id}`);
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="px-4 py-5 space-y-4"
    >
      <motion.div variants={staggerItem} className="space-y-1.5">
        <Label htmlFor="title" className="text-sm font-semibold text-gray-700">Trip name *</Label>
        <div className="relative">
          <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
          <Input
            id="title"
            placeholder="Goa Boys Trip"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            required
            className="pl-10 h-12 rounded-xl border-gray-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </motion.div>

      <motion.div variants={staggerItem} className="space-y-1.5">
        <Label htmlFor="destination" className="text-sm font-semibold text-gray-700">Destination</Label>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="destination"
            placeholder="Goa, India"
            value={form.destination}
            onChange={(e) => set("destination", e.target.value)}
            className="pl-10 h-12 rounded-xl border-gray-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="start_date" className="text-sm font-semibold text-gray-700">Start date</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="start_date"
              type="date"
              value={form.start_date}
              onChange={(e) => set("start_date", e.target.value)}
              className="pl-9 h-12 rounded-xl border-gray-200 bg-white"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end_date" className="text-sm font-semibold text-gray-700">End date</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="end_date"
              type="date"
              value={form.end_date}
              onChange={(e) => set("end_date", e.target.value)}
              className="pl-9 h-12 rounded-xl border-gray-200 bg-white"
            />
          </div>
        </div>
      </motion.div>

      <motion.div variants={staggerItem} className="space-y-1.5">
        <Label htmlFor="budget" className="text-sm font-semibold text-gray-700">Budget (₹)</Label>
        <div className="relative">
          <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="budget"
            type="number"
            placeholder="50000"
            value={form.budget}
            onChange={(e) => set("budget", e.target.value)}
            className="pl-10 h-12 rounded-xl border-gray-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
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
          disabled={loading || !form.title}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full h-12 rounded-xl bg-linear-to-r from-indigo-600 to-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Creating…" : "Create Trip ✨"}
        </motion.button>
      </motion.div>
    </motion.form>
  );
}
