"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Plus, MapPin, Clock, Trash2, Lock, Sparkles, Save, RefreshCw, CalendarPlus, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { ItineraryDay, ItineraryItem } from "@/types";

interface ItineraryViewProps {
  tripId: string;
  days: ItineraryDay[];
  currentUserId: string;
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
  past:   { dot: "bg-slate-700", header: "bg-white/5 text-slate-500", glow: "shadow-slate-900/20" },
  today:  { dot: "bg-indigo-400", header: "bg-indigo-600 text-white", glow: "shadow-indigo-500/20" },
  future: { dot: "bg-slate-600", header: "bg-white/8 text-slate-200", glow: "shadow-indigo-500/10" },
};

const QUICK_ACTIVITIES = [
  { title: "Breakfast stop", time: "9:00 AM", location: "" },
  { title: "Sightseeing", time: "11:00 AM", location: "" },
  { title: "Lunch reservation", time: "1:30 PM", location: "" },
  { title: "Sunset spot", time: "6:00 PM", location: "" },
  { title: "Hotel check-in", time: "2:00 PM", location: "Hotel" },
];

export function ItineraryView({ tripId, days: initialDays, currentUserId }: ItineraryViewProps) {
  const supabase = createClient();
  const [days, setDays] = useState(initialDays);
  const [addingItem, setAddingItem] = useState<string | null>(null);
  const [savingDay, setSavingDay] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", time: "", location: "" });
  const [firstDay, setFirstDay] = useState({
    date: new Date().toISOString().split("T")[0],
    title: "",
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savedPulse, setSavedPulse] = useState<string | null>(null);
  const [creatingDay, setCreatingDay] = useState(false);

  async function refreshItemsForDay(dayId: string) {
    const { data, error: fetchErr } = await supabase
      .from("itinerary_items")
      .select("*")
      .eq("trip_id", tripId)
      .eq("day_id", dayId)
      .order("order_index");
    if (fetchErr) throw fetchErr;
    setDays((prev) => prev.map((day) => day.id === dayId ? { ...day, items: (data ?? []) as ItineraryItem[] } : day));
  }

  async function refreshAllItems() {
    setRefreshing(true);
    setError("");
    try {
      const dayIds = days.map((day) => day.id);
      const { data, error: fetchErr } = dayIds.length > 0
        ? await supabase.from("itinerary_items").select("*").in("day_id", dayIds).order("order_index")
        : { data: [], error: null };
      if (fetchErr) throw fetchErr;
      setDays((prev) => prev.map((day) => ({
        ...day,
        items: ((data ?? []) as ItineraryItem[]).filter((item) => item.day_id === day.id),
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not refresh itinerary");
    } finally {
      setRefreshing(false);
    }
  }

  async function refreshDaysAndItems() {
    setRefreshing(true);
    setError("");
    try {
      const { data: freshDays, error: daysErr } = await supabase
        .from("itinerary_days")
        .select("*")
        .eq("trip_id", tripId)
        .order("day_number");
      if (daysErr) throw daysErr;

      const typedDays = (freshDays ?? []) as ItineraryDay[];
      const dayIds = typedDays.map((day) => day.id);
      const { data: items, error: itemsErr } = dayIds.length > 0
        ? await supabase.from("itinerary_items").select("*").in("day_id", dayIds).order("order_index")
        : { data: [], error: null };
      if (itemsErr) throw itemsErr;

      const typedItems = (items ?? []) as ItineraryItem[];
      setDays(typedDays.map((day) => ({
        ...day,
        items: typedItems.filter((item) => item.day_id === day.id),
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not refresh itinerary");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const channel = supabase
      .channel(`itinerary:${tripId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "itinerary_items",
        filter: `trip_id=eq.${tripId}`,
      }, () => {
        void refreshAllItems();
      })
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "itinerary_days",
        filter: `trip_id=eq.${tripId}`,
      }, () => {
        void refreshDaysAndItems();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tripId]);

  async function createFirstDay() {
    if (!firstDay.date) return;
    setCreatingDay(true);
    setError("");
    setNotice("");

    const { data: rpcData, error: rpcErr } = await supabase.rpc("create_itinerary_day", {
      p_trip_id: tripId,
      p_date: firstDay.date,
      p_title: firstDay.title || null,
    });

    if (rpcErr) {
      const { error: insertErr } = await supabase.from("itinerary_days").insert({
        trip_id: tripId,
        date: firstDay.date,
        day_number: days.length + 1,
        title: firstDay.title || null,
      });
      if (insertErr) {
        setError(insertErr.message || rpcErr.message || "Could not create itinerary day.");
        setCreatingDay(false);
        return;
      }
    } else if (rpcData) {
      setDays((prev) => [...prev, { ...(rpcData as ItineraryDay), items: [] }]);
    }

    await refreshDaysAndItems();
    setNotice("Itinerary day created.");
    setCreatingDay(false);
  }

  async function addItem(dayId: string) {
    if (!newItem.title.trim()) {
      setError("Add a title before saving.");
      return;
    }
    setSavingDay(dayId);
    setError("");
    setNotice("");
    const day = days.find((d) => d.id === dayId);
    if (!day) { setSavingDay(null); return; }

    const { data: rpcData, error: rpcErr } = await supabase.rpc("add_itinerary_item", {
      p_trip_id: tripId,
      p_day_id: dayId,
      p_title: newItem.title.trim(),
      p_time: newItem.time || null,
      p_location: newItem.location || null,
    });

    let insertErr = rpcErr;
    if (rpcErr) {
      const fallback = await supabase
        .from("itinerary_items")
        .insert({
          day_id: dayId, trip_id: tripId,
          title: newItem.title.trim(),
          time: newItem.time || null,
          location: newItem.location || null,
          order_index: day.items?.length ?? 0,
        });
      insertErr = fallback.error;
    } else if (rpcData) {
      setDays((prev) => prev.map((d) => d.id === dayId ? {
        ...d,
        items: [...(d.items ?? []), rpcData as ItineraryItem],
      } : d));
    }

    if (insertErr) {
      setError(insertErr.message || "Failed to save. Please check the itinerary database policy.");
      setSavingDay(null);
      return;
    }

    try {
      await refreshItemsForDay(dayId);
      setNewItem({ title: "", time: "", location: "" });
      setAddingItem(null);
      setNotice("Saved to the trip itinerary.");
      setSavedPulse(dayId);
      setTimeout(() => setSavedPulse(null), 1400);
    } catch (err) {
      setError(err instanceof Error ? `Saved, but refresh failed: ${err.message}` : "Saved, but refresh failed");
    } finally {
      setSavingDay(null);
    }
  }

  async function removeItem(dayId: string, itemId: string) {
    const { error: delErr } = await supabase.from("itinerary_items").delete().eq("id", itemId);
    if (!delErr) {
      setDays((prev) => prev.map((d) => d.id === dayId ? { ...d, items: d.items?.filter((i) => i.id !== itemId) } : d));
    } else {
      setError(delErr.message || "Could not delete this activity.");
    }
  }

  function pickQuickActivity(activity: typeof QUICK_ACTIVITIES[number]) {
    setNewItem(activity);
  }

  if (days.length === 0) {
    return (
      <div className="min-h-screen bg-[#08080f] flex flex-col justify-center py-16 px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/10 bg-[#101526] p-5 shadow-2xl shadow-black/30"
        >
          <div className="h-14 w-14 rounded-2xl bg-violet-500/15 flex items-center justify-center mb-4">
            <CalendarPlus className="h-7 w-7 text-violet-300" />
          </div>
          <p className="font-black text-white text-lg">Start your itinerary</p>
          <p className="text-sm text-slate-500 mt-2">Create a day, then add activities that sync live with the group.</p>
          <div className="mt-5 space-y-3">
            <input
              type="date"
              value={firstDay.date}
              onChange={(e) => setFirstDay((prev) => ({ ...prev, date: e.target.value }))}
              className="w-full h-11 rounded-xl bg-white/5 border border-white/8 text-white px-3 text-sm [color-scheme:dark]"
            />
            <input
              placeholder="Day title (optional)"
              value={firstDay.title}
              onChange={(e) => setFirstDay((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full h-11 rounded-xl bg-white/5 border border-white/8 text-white placeholder:text-slate-600 px-3 text-sm"
            />
            {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
            <button
              onClick={createFirstDay}
              disabled={creatingDay || !firstDay.date}
              className="w-full h-11 rounded-xl bg-indigo-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {creatingDay ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Day
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080f] space-y-6 p-4 pb-10">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#101526] p-4 shadow-xl shadow-black/20"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-violet-500 via-indigo-400 to-cyan-400" />
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-violet-300" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-white">Trip timeline</p>
            <p className="text-xs text-slate-500">
              {currentUserId ? "Live sync is on for your group." : "Add plans, memories, food stops, and meetup ideas."}
            </p>
          </div>
          <button
            onClick={refreshAllItems}
            className="h-9 w-9 rounded-xl bg-white/7 flex items-center justify-center text-slate-300"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
        {notice && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            {notice}
          </motion.p>
        )}
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </motion.p>
        )}
      </motion.div>

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
              <motion.div
                animate={savedPulse === day.id ? { scale: [1, 1.08, 1], rotate: [0, -2, 2, 0] } : { scale: 1 }}
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl ${style.header} shrink-0 transition-colors shadow-lg ${style.glow}`}
              >
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">Day</span>
                <span className="text-lg font-black leading-none">{day.day_number}</span>
              </motion.div>
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
                  {savedPulse === day.id && (
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Save className="h-2.5 w-2.5" /> Saved
                    </span>
                  )}
                </div>
                {day.title && <p className="text-xs text-slate-600 mt-0.5">{formatDate(day.date)}</p>}
              </div>
            </div>

            {/* Timeline */}
            <div className={`ml-6 border-l-2 border-dashed ${past ? "border-white/5" : "border-white/10"} pl-5 space-y-3`}>
              {(day.items ?? []).map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03, type: "spring", stiffness: 350, damping: 28 }}
                  className={`relative flex items-start gap-3 rounded-2xl border p-3 ${
                    past
                      ? "bg-white/2 border-white/4"
                      : "bg-[#0f0f1e] border-white/7"
                  }`}
                >
                  <motion.div
                    className={`absolute -left-6.25 top-3.5 h-3 w-3 rounded-full border-2 border-[#08080f] ${style.dot}`}
                    animate={status === "today" ? { boxShadow: ["0 0 0 0 rgba(99,102,241,0.45)", "0 0 0 8px rgba(99,102,241,0)", "0 0 0 0 rgba(99,102,241,0)"] } : {}}
                    transition={{ repeat: status === "today" ? Infinity : 0, duration: 2 }}
                  />
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
                </motion.div>
              ))}

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
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {QUICK_ACTIVITIES.map((activity) => (
                          <button
                            type="button"
                            key={activity.title}
                            onClick={() => pickQuickActivity(activity)}
                            className="shrink-0 rounded-full bg-white/6 px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-200"
                          >
                            {activity.title}
                          </button>
                        ))}
                      </div>
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
                      <div className="flex gap-2">
                        <button type="button" onClick={() => addItem(day.id)} disabled={savingDay === day.id || !newItem.title.trim()}
                          className="flex-1 h-9 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-40 transition-colors">
                          {savingDay === day.id ? "Saving..." : "Add"}
                        </button>
                        <button type="button" onClick={() => { setAddingItem(null); setError(""); }}
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
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setAddingItem(day.id); setError(""); }}
                      className="relative flex items-center gap-2 text-sm text-indigo-400 font-medium py-1.5 hover:text-indigo-300 transition-colors"
                    >
                      <div className="absolute -left-6.25 top-2 h-3 w-3 rounded-full bg-white/8 border-2 border-[#08080f]" />
                      <Plus className="h-4 w-4" />
                      {past ? "Add memory" : "Add activity"}
                    </motion.button>
                  )}
                </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
