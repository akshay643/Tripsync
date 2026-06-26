"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Check, Plus, Trash2, Package, ChevronDown, ChevronUp, Users } from "lucide-react";
import type { PackingItem, PackingCategory, Profile } from "@/types";

const CATEGORY_ICONS: Record<PackingCategory, string> = {
  clothes:     "👕",
  toiletries:  "🧴",
  electronics: "🔌",
  documents:   "📄",
  medicines:   "💊",
  food:        "🍎",
  gear:        "🎒",
  general:     "📦",
};

const CATEGORY_LABELS: Record<PackingCategory, string> = {
  clothes:     "Clothes",
  toiletries:  "Toiletries",
  electronics: "Electronics",
  documents:   "Documents",
  medicines:   "Medicines",
  food:        "Food & Snacks",
  gear:        "Gear",
  general:     "General",
};

const ALL_CATEGORIES: PackingCategory[] = [
  "clothes", "toiletries", "electronics", "documents",
  "medicines", "food", "gear", "general",
];

interface Props {
  tripId: string;
  currentUserId: string;
  members: Profile[];
  initialItems: PackingItem[];
}

export function PackingListClient({ tripId, currentUserId, members, initialItems }: Props) {
  const supabase = createClient();
  const [items, setItems] = useState<PackingItem[]>(initialItems);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "packed" | "unpacked">("all");
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [newItem, setNewItem] = useState<{
    title: string; category: PackingCategory; quantity: number; assigned_to: string;
  }>({ title: "", category: "general", quantity: 1, assigned_to: "" });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`packing:${tripId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "packing_items",
        filter: `trip_id=eq.${tripId}`,
      }, async () => {
        const { data } = await supabase
          .from("packing_items")
          .select("*, added_by_profile:profiles!added_by(id,name,avatar), assigned_to_profile:profiles!assigned_to(id,name,avatar)")
          .eq("trip_id", tripId)
          .order("category")
          .order("order_index");
        if (data) setItems(data as any);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tripId]);

  async function addItem() {
    if (!newItem.title.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("packing_items").insert({
      trip_id: tripId,
      added_by: currentUserId,
      title: newItem.title.trim(),
      category: newItem.category,
      quantity: newItem.quantity,
      assigned_to: newItem.assigned_to || null,
      order_index: items.filter((i) => i.category === newItem.category).length,
    });
    if (!error) {
      setNewItem({ title: "", category: "general", quantity: 1, assigned_to: "" });
      setAdding(false);
    }
    setSaving(false);
  }

  async function togglePacked(item: PackingItem) {
    await supabase
      .from("packing_items")
      .update({
        packed: !item.packed,
        packed_by: !item.packed ? currentUserId : null,
        packed_at: !item.packed ? new Date().toISOString() : null,
      })
      .eq("id", item.id);
  }

  async function deleteItem(id: string) {
    await supabase.from("packing_items").delete().eq("id", id);
  }

  function toggleCategory(cat: string) {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  const filtered = items.filter((i) =>
    filter === "all" ? true : filter === "packed" ? i.packed : !i.packed
  );

  const byCategory = ALL_CATEGORIES.reduce<Record<string, PackingItem[]>>((acc, cat) => {
    const group = filtered.filter((i) => i.category === cat);
    if (group.length > 0) acc[cat] = group;
    return acc;
  }, {});

  const totalCount = items.length;
  const packedCount = items.filter((i) => i.packed).length;
  const pct = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#08080f] pb-24">
      {/* Progress header */}
      <div className="px-4 pt-4 pb-5">
        <div className="rounded-2xl bg-[#0f0f1e] border border-white/7 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-slate-500 font-medium">Packing progress</p>
              <p className="text-2xl font-black text-white mt-0.5">
                {packedCount}<span className="text-slate-600 text-lg font-semibold">/{totalCount}</span>
              </p>
            </div>
            <div
              className="relative h-14 w-14 flex items-center justify-center"
              style={{ transform: "rotate(-90deg)" }}
            >
              <svg className="h-14 w-14" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
                <circle
                  cx="28" cy="28" r="22" fill="none"
                  stroke={pct === 100 ? "#10b981" : "#6366f1"}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct / 100)}`}
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
              </svg>
              <span
                className="absolute text-xs font-bold text-white"
                style={{ transform: "rotate(90deg)" }}
              >{pct}%</span>
            </div>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          {pct === 100 && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-emerald-400 font-semibold text-center mt-2"
            >
              All packed! Ready to go 🎉
            </motion.p>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 px-4 mb-4">
        {(["all", "unpacked", "packed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
              filter === f
                ? "bg-indigo-600 text-white"
                : "bg-white/5 text-slate-500 hover:text-slate-300"
            }`}
          >
            {f === "all" ? `All (${totalCount})` : f === "packed" ? `Packed (${packedCount})` : `Left (${totalCount - packedCount})`}
          </button>
        ))}
      </div>

      {/* Item groups by category */}
      <div className="px-4 space-y-4">
        {Object.entries(byCategory).map(([cat, catItems]) => {
          const collapsed = collapsedCats.has(cat);
          const allPacked = catItems.every((i) => i.packed);
          return (
            <div key={cat} className="rounded-2xl bg-[#0f0f1e] border border-white/7 overflow-hidden">
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors"
              >
                <span className="text-xl">{CATEGORY_ICONS[cat as PackingCategory]}</span>
                <span className={`flex-1 text-left text-sm font-bold ${allPacked ? "text-slate-500" : "text-white"}`}>
                  {CATEGORY_LABELS[cat as PackingCategory]}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  allPacked ? "bg-emerald-500/15 text-emerald-400" : "bg-white/6 text-slate-500"
                }`}>
                  {catItems.filter((i) => i.packed).length}/{catItems.length}
                </span>
                {collapsed ? <ChevronDown className="h-4 w-4 text-slate-600" /> : <ChevronUp className="h-4 w-4 text-slate-600" />}
              </button>

              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-white/5 divide-y divide-white/4">
                      {catItems.map((item) => (
                        <div key={item.id} className={`flex items-center gap-3 px-4 py-3 transition-colors ${item.packed ? "opacity-50" : ""}`}>
                          <button
                            onClick={() => togglePacked(item)}
                            className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                              item.packed
                                ? "bg-emerald-500 border-emerald-500"
                                : "border-white/20 hover:border-indigo-500/60"
                            }`}
                          >
                            {item.packed && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                          </button>

                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${item.packed ? "line-through text-slate-600" : "text-white"}`}>
                              {item.title}
                              {item.quantity > 1 && (
                                <span className="ml-2 text-xs text-slate-600 font-normal">×{item.quantity}</span>
                              )}
                            </p>
                            {item.assigned_to_profile && (
                              <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {item.assigned_to === currentUserId ? "You" : item.assigned_to_profile.name?.split(" ")[0]}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => deleteItem(item.id)}
                            className="text-white/10 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {Object.keys(byCategory).length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-12 w-12 text-slate-700 mb-4" />
            <p className="font-semibold text-white">Nothing here yet</p>
            <p className="text-sm text-slate-500 mt-1">
              {filter === "all" ? "Add your first item below" : "No items in this filter"}
            </p>
          </div>
        )}
      </div>

      {/* Add item form */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed inset-x-0 bottom-20 z-40 px-4"
          >
            <div className="rounded-2xl bg-[#14142a] border border-white/10 shadow-2xl shadow-black/50 p-4 space-y-3">
              <p className="text-sm font-bold text-white">Add item</p>
              <input
                ref={inputRef}
                placeholder="What do you need to pack?"
                value={newItem.title}
                onChange={(e) => setNewItem((p) => ({ ...p, title: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
                className="w-full h-11 rounded-xl bg-white/5 border border-white/8 text-white placeholder:text-slate-600 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem((p) => ({ ...p, category: e.target.value as PackingCategory }))}
                  className="h-10 rounded-xl bg-white/5 border border-white/8 text-white text-sm px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 [color-scheme:dark]"
                >
                  {ALL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_ICONS[c]} {CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
                <select
                  value={newItem.assigned_to}
                  onChange={(e) => setNewItem((p) => ({ ...p, assigned_to: e.target.value }))}
                  className="h-10 rounded-xl bg-white/5 border border-white/8 text-white text-sm px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 [color-scheme:dark]"
                >
                  <option value="">Anyone</option>
                  <option value={currentUserId}>Me</option>
                  {members.filter((m) => m.id !== currentUserId).map((m) => (
                    <option key={m.id} value={m.id}>{m.name?.split(" ")[0] ?? "Member"}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-3 h-10">
                  <button
                    onClick={() => setNewItem((p) => ({ ...p, quantity: Math.max(1, p.quantity - 1) }))}
                    className="text-slate-400 hover:text-white w-5 text-center font-bold"
                  >−</button>
                  <span className="text-white text-sm font-semibold w-5 text-center">{newItem.quantity}</span>
                  <button
                    onClick={() => setNewItem((p) => ({ ...p, quantity: p.quantity + 1 }))}
                    className="text-slate-400 hover:text-white w-5 text-center font-bold"
                  >+</button>
                </div>
                <button
                  onClick={addItem}
                  disabled={saving || !newItem.title.trim()}
                  className="flex-1 h-10 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-40"
                >
                  {saving ? "Adding…" : "Add Item"}
                </button>
                <button
                  onClick={() => setAdding(false)}
                  className="h-10 px-4 rounded-xl bg-white/5 text-slate-400 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      {!adding && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setAdding(true); setTimeout(() => inputRef.current?.focus(), 100); }}
          className="fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full bg-indigo-600 shadow-xl shadow-indigo-500/30 flex items-center justify-center"
        >
          <Plus className="h-6 w-6 text-white" />
        </motion.button>
      )}
    </div>
  );
}
