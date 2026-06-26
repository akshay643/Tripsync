"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Plus, MapPin, Clock, Trash2, Lock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { ItineraryDay } from "@/types";

interface ItineraryViewProps {
  tripId: string;
  days: ItineraryDay[];
  currentUserId: string;
}

function isPastDate(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

function getDayStatus(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  if (d < today) return "past";
  if (d.getTime() === today.getTime()) return "today";
  return "future";
}

const dayStatusStyle = {
  past:   { pill: "bg-slate-700/50 text-slate-500",   dot: "bg-slate-700",   header: "bg-white/5 text-slate-500" },
  today:  { pill: "bg-indigo-500/20 text-indigo-300", dot: "bg-indigo-400",   header: "bg-indigo-600 text-white"  },
  future: { pill: "bg-white/5 text-slate-400",         dot: "bg-slate-600",   header: "bg-white/8 text-slate-200" },
};

export function ItineraryView({ tripId, days: initialDays, currentUserId }: ItineraryViewProps) {
  const supabase = createClient();
  const [days, setDays] = useState(initialDays);
  const [addingItem, setAddingItem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", time: "", location: "" });
  const [error, setError] = useState("");

  async function addItem(dayId: string) {
    if (!newItem.title.trim()) return;
    setSaving(true);
    setError("");
    const day = days.find((d) => d.id === dayId);
    if (!day) { setSaving(false); return; }

    const { data, error: insertErr } = await supabase
      .from("itinerary_items")
      .insert({
        day_id: dayId, trip_id: tripId,
        title: newItem.title.trim(),
        time: newItem.time || null,
        location: newItem.location || null,
        order_index: day.items?.length ?? 0,
      })
      .select()
      .single();

    if (insertErr || !data) {
      setError(insertErr?.message ?? "Failed to save");
      setSaving(false);
      return;
    }
    setDays((prev) => prev.map((d) => d.id === dayId ? { ...d, items: [...(d.items ?? []), data] } : d));
    setNewItem({ title: "", time: "", location: "" });
    setAddingItem(null);
    setSaving(false);
  }

  async function removeItem(dayId: string, itemId: string) {
    const { error: delErr } = await supabase.from("itinerary_items").delete().eq("id", itemId);
    if (!delErr) {
      setDays((prev) => prev.map((d) => d.id === dayId ? { ...d, items: d.items?.filter((i) => i.id !== itemId) } : d));
    }
  }

  if (days.length === 0) {
    return (
      <div className="min-h-screen bg-[#08080f] flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="text-5xl mb-4">🗓️</div>
        <p className="font-bold text-white text-lg">No itinerary yet</p>
        <p className="text-sm text-slate-500 mt-2">Itinerary days are created from your trip dates.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080f] space-y-6 p-4 pb-10">
      {days.map((day) => {
        const status = getDayStatus(day.date);
        const past = status === "past";
        const style = dayStatusStyle[status];

        return (
          <motion.div
            key={day.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Day header */}
            <div className="flex items-center gap-3 mb-3">
              <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl ${style.header} shrink-0 transition-colors`}>
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">Day</span>
                <span className="text-lg font-black leading-none">{day.day_number}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-bold ${past ? "text-slate-500" : "text-white"}`}>
                    {day.title || formatDate(day.date)}
                  </p>
                  {status === "today" && (
                    <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full">TODAY</span>
                  )}
                  {past && (
                    <span className="text-[10px] font-medium text-slate-600 bg-white/4 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="h-2.5 w-2.5" /> Past
                    </span>
                  )}
                </div>
                {day.title && <p className="text-xs text-slate-600 mt-0.5">{formatDate(day.date)}</p>}
              </div>
            </div>

            {/* Timeline */}
            <div className={`ml-6 border-l-2 border-dashed ${past ? "border-white/5" : "border-white/10"} pl-5 space-y-3`}>
              {(day.items ?? []).map((item) => (
                <div
                  key={item.id}
                  className={`relative flex items-start gap-3 rounded-2xl border p-3 ${
                    past
                      ? "bg-white/2 border-white/4"
                      : "bg-[#0f0f1e] border-white/7"
                  }`}
                >
                  <div className={`absolute -left-6.25 top-3.5 h-3 w-3 rounded-full border-2 border-[#08080f] ${style.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${past ? "text-slate-500" : "text-white"}`}>{item.title}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      {item.time && (
                        <span className="flex items-center gap-1 text-xs text-indigo-400 font-medium">
                          <Clock className="h-3 w-3" />{item.time}
                        </span>
                      )}
                      {item.location && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3 w-3" />{item.location}
                        </span>
                      )}
                    </div>
                  </div>
                  {!past && (
                    <button onClick={() => removeItem(day.id, item.id)}
                      className="text-white/10 hover:text-red-400 transition-colors mt-0.5 shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}

              {/* Add activity — disabled for past dates */}
              {past ? (
                <div className="relative flex items-center gap-2 text-xs text-slate-700 py-1.5 cursor-not-allowed">
                  <div className="absolute -left-6.25 top-2 h-3 w-3 rounded-full bg-white/4 border-2 border-[#08080f]" />
                  <Lock className="h-3 w-3" />
                  Past day — editing disabled
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {addingItem === day.id ? (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="relative bg-indigo-500/8 border border-indigo-500/20 rounded-2xl p-3 space-y-2"
                    >
                      <div className="absolute -left-6.25 top-3.5 h-3 w-3 rounded-full bg-indigo-400 border-2 border-[#08080f]" />
                      <input
                        placeholder="Activity title *"
                        value={newItem.title}
                        onChange={(e) => setNewItem((p) => ({ ...p, title: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && addItem(day.id)}
                        autoFocus
                        className="w-full h-10 rounded-xl bg-white/5 border border-white/8 text-white placeholder:text-slate-600 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          placeholder="9:00 AM"
                          value={newItem.time}
                          onChange={(e) => setNewItem((p) => ({ ...p, time: e.target.value }))}
                          className="h-9 rounded-xl bg-white/5 border border-white/8 text-white placeholder:text-slate-600 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                        />
                        <input
                          placeholder="Location"
                          value={newItem.location}
                          onChange={(e) => setNewItem((p) => ({ ...p, location: e.target.value }))}
                          className="h-9 rounded-xl bg-white/5 border border-white/8 text-white placeholder:text-slate-600 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                        />
                      </div>
                      {error && <p className="text-xs text-red-400">{error}</p>}
                      <div className="flex gap-2">
                        <button onClick={() => addItem(day.id)} disabled={saving || !newItem.title.trim()}
                          className="flex-1 h-9 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-40 transition-colors">
                          {saving ? "Saving…" : "Add"}
                        </button>
                        <button onClick={() => { setAddingItem(null); setError(""); }}
                          className="px-4 h-9 rounded-xl bg-white/5 text-slate-400 text-sm">
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="btn"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => { setAddingItem(day.id); setError(""); }}
                      className="relative flex items-center gap-2 text-sm text-indigo-400 font-medium py-1.5 hover:text-indigo-300 transition-colors"
                    >
                      <div className="absolute -left-6.25 top-2 h-3 w-3 rounded-full bg-white/8 border-2 border-[#08080f]" />
                      <Plus className="h-4 w-4" />
                      Add activity
                    </motion.button>
                  )}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
