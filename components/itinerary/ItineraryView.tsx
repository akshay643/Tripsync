"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MapPin, Clock, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { ItineraryDay, ItineraryItem } from "@/types";

interface ItineraryViewProps {
  tripId: string;
  days: ItineraryDay[];
  currentUserId: string;
}

export function ItineraryView({ tripId, days: initialDays, currentUserId }: ItineraryViewProps) {
  const supabase = createClient();
  const [days, setDays] = useState(initialDays);
  const [addingItem, setAddingItem] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ title: "", time: "", location: "" });

  async function addItem(dayId: string) {
    if (!newItem.title) return;
    const day = days.find((d) => d.id === dayId);
    if (!day) return;

    const { data } = await supabase
      .from("itinerary_items")
      .insert({
        day_id: dayId,
        trip_id: tripId,
        title: newItem.title,
        time: newItem.time || null,
        location: newItem.location || null,
        order_index: (day.items?.length ?? 0),
      })
      .select()
      .single();

    if (data) {
      setDays((prev) =>
        prev.map((d) =>
          d.id === dayId ? { ...d, items: [...(d.items || []), data] } : d
        )
      );
    }
    setNewItem({ title: "", time: "", location: "" });
    setAddingItem(null);
  }

  async function removeItem(dayId: string, itemId: string) {
    await supabase.from("itinerary_items").delete().eq("id", itemId);
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId ? { ...d, items: d.items?.filter((i) => i.id !== itemId) } : d
      )
    );
  }

  if (days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="text-5xl mb-4">🗓️</div>
        <p className="font-semibold text-gray-900 text-lg">No itinerary yet</p>
        <p className="text-sm text-gray-500 mt-2">
          Itinerary days are created automatically based on your trip dates.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {days.map((day) => (
        <div key={day.id}>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex flex-col items-center w-10">
              <span className="text-xs text-indigo-600 font-semibold uppercase">Day</span>
              <span className="text-xl font-bold text-indigo-600">{day.day_number}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{day.title || formatDate(day.date)}</p>
              {day.title && <p className="text-xs text-gray-400">{formatDate(day.date)}</p>}
            </div>
          </div>

          <div className="ml-12 space-y-2">
            {(day.items || []).map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {item.time && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
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
                  className="text-gray-300 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            {addingItem === day.id ? (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 space-y-2">
                <Input
                  placeholder="Activity title *"
                  value={newItem.title}
                  onChange={(e) => setNewItem((p) => ({ ...p, title: e.target.value }))}
                  className="bg-white"
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Time (e.g. 9:00 AM)"
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
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => addItem(day.id)}>
                    Add
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setAddingItem(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingItem(day.id)}
                className="flex items-center gap-2 text-sm text-indigo-600 font-medium py-2 hover:text-indigo-800 transition-colors"
              >
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
