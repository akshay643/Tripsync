"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MapPin, Clock, Trash2, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { ItineraryDay } from "@/types";

interface ItineraryViewProps {
  tripId: string;
  days: ItineraryDay[];
  currentUserId: string;
}

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
        day_id: dayId,
        trip_id: tripId,
        title: newItem.title.trim(),
        time: newItem.time || null,
        location: newItem.location || null,
        order_index: day.items?.length ?? 0,
      })
      .select()
      .single();

    if (insertErr || !data) {
      setError(insertErr?.message ?? "Failed to save — check you're a trip member");
      setSaving(false);
      return;
    }

    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId ? { ...d, items: [...(d.items ?? []), data] } : d
      )
    );
    setNewItem({ title: "", time: "", location: "" });
    setAddingItem(null);
    setSaving(false);
  }

  async function removeItem(dayId: string, itemId: string) {
    const { error: delErr } = await supabase.from("itinerary_items").delete().eq("id", itemId);
    if (!delErr) {
      setDays((prev) =>
        prev.map((d) =>
          d.id === dayId ? { ...d, items: d.items?.filter((i) => i.id !== itemId) } : d
        )
      );
    }
  }

  if (days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="text-5xl mb-4">🗓️</div>
        <p className="font-semibold text-gray-900 text-lg">No itinerary yet</p>
        <p className="text-sm text-gray-500 mt-2">
          Itinerary days are auto-created from your trip dates.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 pb-8">
      {days.map((day, dayIdx) => (
        <div key={day.id}>
          {/* Day header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shrink-0">
              <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">Day</span>
              <span className="text-lg font-bold leading-none">{day.day_number}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{day.title || formatDate(day.date)}</p>
              {day.title && <p className="text-xs text-gray-400">{formatDate(day.date)}</p>}
            </div>
          </div>

          {/* Timeline items */}
          <div className="ml-6 border-l-2 border-dashed border-gray-100 pl-5 space-y-3">
            {(day.items ?? []).map((item, idx) => (
              <div
                key={item.id}
                className="relative flex items-start gap-3 bg-white rounded-2xl border border-gray-100 p-3 shadow-sm"
              >
                <div className="absolute -left-[25px] top-3.5 h-3 w-3 rounded-full bg-indigo-400 border-2 border-white" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    {item.time && (
                      <span className="flex items-center gap-1 text-xs text-indigo-500 font-medium">
                        <Clock className="h-3 w-3" />
                        {item.time}
                      </span>
                    )}
                    {item.location && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin className="h-3 w-3" />
                        {item.location}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeItem(day.id, item.id)}
                  className="text-gray-200 hover:text-red-400 transition-colors mt-0.5"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            {/* Add activity */}
            {addingItem === day.id ? (
              <div className="relative bg-indigo-50 border border-indigo-200 rounded-2xl p-3 space-y-2">
                <div className="absolute -left-[25px] top-3.5 h-3 w-3 rounded-full bg-indigo-200 border-2 border-white" />
                <Input
                  placeholder="Activity title *"
                  value={newItem.title}
                  onChange={(e) => setNewItem((p) => ({ ...p, title: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addItem(day.id)}
                  className="bg-white"
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="9:00 AM"
                    value={newItem.time}
                    onChange={(e) => setNewItem((p) => ({ ...p, time: e.target.value }))}
                    className="bg-white text-sm"
                  />
                  <Input
                    placeholder="Location"
                    value={newItem.location}
                    onChange={(e) => setNewItem((p) => ({ ...p, location: e.target.value }))}
                    className="bg-white text-sm"
                  />
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => addItem(day.id)} disabled={saving || !newItem.title.trim()}>
                    {saving ? "Saving…" : "Add"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setAddingItem(null); setError(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setAddingItem(day.id); setError(""); }}
                className="relative flex items-center gap-2 text-sm text-indigo-500 font-medium py-1.5 hover:text-indigo-700 transition-colors"
              >
                <div className="absolute -left-[25px] top-2 h-3 w-3 rounded-full bg-gray-200 border-2 border-white" />
                <Plus className="h-4 w-4" />
                Add activity
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
