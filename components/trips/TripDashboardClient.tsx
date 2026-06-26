"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency, formatShortDate, getInitials } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/components/ui/motion";
import {
  Map, Receipt, Users, Calendar, ArrowRightLeft, MapPin,
  Plus, Clock, ChevronRight, Plane, Camera, Loader2, Package,
} from "lucide-react";
import { LocationShareButton } from "@/components/map/LocationShareButton";
import { createClient } from "@/lib/supabase/client";

interface Props {
  trip: any;
  tripId: string;
  totalSpend: number;
  expenseCount: number;
  currentUserId: string;
  balance: number;
}

function getDaysInfo(startDate?: string, endDate?: string) {
  const now = new Date();
  if (!endDate && !startDate) return { text: "Plan your adventure", tag: "upcoming", daysNum: null };
  if (endDate) {
    const end = new Date(endDate);
    const start = startDate ? new Date(startDate) : null;
    if (start && now < start) {
      const d = Math.ceil((start.getTime() - now.getTime()) / 864e5);
      return { text: `Starts in ${d}d`, tag: "upcoming", daysNum: d };
    }
    const diff = Math.ceil((end.getTime() - now.getTime()) / 864e5);
    if (diff < 0) return { text: "Completed", tag: "past", daysNum: null };
    if (diff === 0) return { text: "Last day!", tag: "ongoing", daysNum: 0 };
    return { text: `${diff} days left`, tag: "ongoing", daysNum: diff };
  }
  if (startDate) {
    const start = new Date(startDate);
    const d = Math.ceil((start.getTime() - now.getTime()) / 864e5);
    if (d > 0) return { text: `Starts in ${d}d`, tag: "upcoming", daysNum: d };
    return { text: "In progress", tag: "ongoing", daysNum: null };
  }
  return { text: "", tag: "upcoming", daysNum: null };
}

const TAG_PILL: Record<string, string> = {
  upcoming: "bg-amber-500/20 text-amber-300",
  ongoing:  "bg-emerald-500/20 text-emerald-300",
  past:     "bg-white/10 text-slate-400",
};

const NAV = (id: string) => [
  { href: `/trips/${id}/expenses`,    icon: Receipt,        label: "Expenses",  sub: "Split bills",    accent: "text-emerald-400", bg: "bg-emerald-500/10" },
  { href: `/trips/${id}/settlements`, icon: ArrowRightLeft, label: "Settle Up", sub: "Clear debts",    accent: "text-orange-400",  bg: "bg-orange-500/10"  },
  { href: `/trips/${id}/itinerary`,   icon: Calendar,       label: "Itinerary", sub: "Day by day",     accent: "text-violet-400",  bg: "bg-violet-500/10"  },
  { href: `/trips/${id}/packing`,     icon: Package,        label: "Packing",   sub: "What to bring",  accent: "text-amber-400",   bg: "bg-amber-500/10"   },
  { href: `/trips/${id}/map`,         icon: Map,            label: "Live Map",  sub: "Track everyone", accent: "text-sky-400",     bg: "bg-sky-500/10"     },
  { href: `/trips/${id}/members`,     icon: Users,          label: "Members",   sub: "Who's in",       accent: "text-pink-400",    bg: "bg-pink-500/10"    },
];

export function TripDashboardClient({ trip, tripId, totalSpend, expenseCount, currentUserId, balance }: Props) {
  const supabase = createClient();
  const coverRef = useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverError, setCoverError] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | null>(trip.trip_image ?? null);

  const budgetPct = trip.budget ? Math.min((totalSpend / trip.budget) * 100, 100) : 0;
  const overBudget = budgetPct >= 100;
  const countdown = getDaysInfo(trip.start_date, trip.end_date);

  const unsplashQuery = encodeURIComponent((trip.destination || "travel adventure") + " city landscape");
  const heroBg = coverUrl
    ? coverUrl
    : `https://source.unsplash.com/featured/900x600/?${unsplashQuery}`;

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setCoverError("");
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `trips/${tripId}/cover.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`;

      const { error: dbErr } = await supabase.from("trips").update({ trip_image: url }).eq("id", tripId);
      if (dbErr) throw dbErr;
      setCoverUrl(url);
    } catch (err: any) {
      setCoverError(err?.message ?? "Cover upload failed. Please try again.");
    } finally {
      setUploadingCover(false);
      if (coverRef.current) coverRef.current.value = "";
    }
  }

  return (
    <div className="bg-[#08080f] min-h-screen">

      {/* Hero */}
      <div
        className="relative h-64"
        style={{ backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/20 to-black/80" />

        <input
          ref={coverRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleCoverUpload}
        />

        <div className="relative h-full flex flex-col justify-between px-5 pt-4 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5">
              {trip.destination
                ? <><MapPin className="h-3 w-3 text-white/70" /><span className="text-white text-xs font-medium">{trip.destination}</span></>
                : <><Plane className="h-3 w-3 text-white/70" /><span className="text-white text-xs font-medium">Adventure awaits</span></>
              }
            </div>
            <div className="flex items-center gap-2">
              {countdown.text && (
                <span className={`rounded-full px-3 py-1.5 text-xs font-bold backdrop-blur-sm ${TAG_PILL[countdown.tag]}`}>
                  {countdown.text}
                </span>
              )}
              <button
                onClick={() => coverRef.current?.click()}
                disabled={uploadingCover}
                className="h-8 w-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
              >
                {uploadingCover
                  ? <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                  : <Camera className="h-3.5 w-3.5 text-white/80" />
                }
              </button>
            </div>
          </div>

          <div>
            {trip.start_date && (
              <p className="text-white/60 text-xs flex items-center gap-1 mb-2.5">
                <Clock className="h-3 w-3" />
                {formatShortDate(trip.start_date)}
                {trip.end_date && ` → ${formatShortDate(trip.end_date)}`}
              </p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {trip.trip_members.slice(0, 5).map((m: any) => (
                    <Avatar key={m.user_id} className="h-8 w-8 border-2 border-white/30">
                      <AvatarImage src={m.profiles?.avatar} />
                      <AvatarFallback className="text-xs bg-indigo-600 text-white font-bold">
                        {getInitials(m.profiles?.name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {trip.trip_members.length > 5 && (
                    <div className="h-8 w-8 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">+{trip.trip_members.length - 5}</span>
                    </div>
                  )}
                </div>
                <p className="text-white/60 text-xs">
                  {trip.trip_members.length} traveller{trip.trip_members.length !== 1 ? "s" : ""}
                </p>
              </div>
              <LocationShareButton tripId={tripId} currentUserId={currentUserId} />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-3 pt-4 pb-8">

        {coverError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 text-xs text-red-400 text-center">
            {coverError}
          </div>
        )}

        {/* Stats */}
        <div className="bg-[#0f0f1e] rounded-2xl border border-white/7 grid grid-cols-3 divide-x divide-white/5">
          {[
            { label: "Spent",  val: formatCurrency(totalSpend),                 sub: `${expenseCount} expense${expenseCount !== 1 ? "s" : ""}` },
            { label: "Budget", val: trip.budget ? formatCurrency(trip.budget) : "—",
              sub: trip.budget ? (overBudget ? "Over budget" : `${Math.round(100 - budgetPct)}% left`) : "not set",
              subColor: trip.budget ? (overBudget ? "text-red-400" : "text-emerald-400") : "text-slate-600" },
            { label: "Days",   val: countdown.daysNum !== null ? String(countdown.daysNum) : "—",
              sub: countdown.tag === "ongoing" ? "remaining" : countdown.tag === "upcoming" ? "to go" : "completed" },
          ].map(({ label, val, sub, subColor }) => (
            <div key={label} className="py-3.5 text-center">
              <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest">{label}</p>
              <p className="text-xl font-black text-white mt-0.5">{val}</p>
              <p className={`text-[10px] font-medium mt-0.5 ${subColor ?? "text-slate-600"}`}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Balance widget */}
        {expenseCount > 0 && (
          <Link href={`/trips/${tripId}/settlements`}>
            <motion.div
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 ${
                balance > 0.01
                  ? "bg-emerald-500/8 border-emerald-500/20"
                  : balance < -0.01
                  ? "bg-red-500/8 border-red-500/20"
                  : "bg-white/4 border-white/7"
              }`}
            >
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-lg ${
                balance > 0.01 ? "bg-emerald-500/15" : balance < -0.01 ? "bg-red-500/15" : "bg-white/8"
              }`}>
                {balance > 0.01 ? "💚" : balance < -0.01 ? "🔴" : "✅"}
              </div>
              <div className="flex-1">
                <p className={`text-xs font-semibold ${
                  balance > 0.01 ? "text-emerald-400" : balance < -0.01 ? "text-red-400" : "text-slate-500"
                }`}>
                  {balance > 0.01 ? "You're owed" : balance < -0.01 ? "You owe" : "All settled up"}
                </p>
                <p className="text-white font-black text-base mt-0.5">
                  {Math.abs(balance) < 0.01 ? "Nothing to settle" : formatCurrency(Math.abs(balance))}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </motion.div>
          </Link>
        )}

        {/* Budget bar */}
        {trip.budget && (
          <div className="flex items-center gap-2.5 px-1">
            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${budgetPct}%` }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                className={`h-full rounded-full ${overBudget ? "bg-red-500" : budgetPct > 75 ? "bg-amber-500" : "bg-emerald-500"}`}
              />
            </div>
            <p className="text-[11px] text-slate-600 font-medium w-8 text-right">{Math.round(budgetPct)}%</p>
          </div>
        )}

        {/* Add expense CTA */}
        <Link href={`/trips/${tripId}/expenses/new`}>
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 bg-indigo-600 rounded-2xl px-4 py-4 shadow-lg shadow-indigo-500/25"
          >
            <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Add Expense</p>
              <p className="text-indigo-300 text-xs">Split it with the group</p>
            </div>
            <ChevronRight className="h-4 w-4 text-white/30" />
          </motion.div>
        </Link>

        {/* Nav grid */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-3"
        >
          {NAV(tripId).map(({ href, icon: Icon, label, sub, accent, bg }) => (
            <motion.div key={href} variants={staggerItem}>
              <Link href={href}>
                <motion.div
                  whileTap={{ scale: 0.96 }}
                  className="bg-[#0f0f1e] rounded-2xl border border-white/7 p-4"
                >
                  <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                    <Icon className={`h-5 w-5 ${accent}`} strokeWidth={2} />
                  </div>
                  <p className="text-sm font-bold text-white">{label}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{sub}</p>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}
