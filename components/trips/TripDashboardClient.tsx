"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency, formatShortDate, getInitials } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/components/ui/motion";
import {
  Map, Receipt, Users, Calendar, ArrowRightLeft, MapPin,
  Plus, Clock, ChevronRight, Plane,
} from "lucide-react";
import { LocationShareButton } from "@/components/map/LocationShareButton";

interface Props {
  trip: any;
  tripId: string;
  totalSpend: number;
  expenseCount: number;
  currentUserId: string;
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
  upcoming: "bg-amber-400/25 text-amber-100",
  ongoing: "bg-emerald-400/25 text-emerald-100",
  past: "bg-white/10 text-white/50",
};

const NAV = (id: string) => [
  { href: `/trips/${id}/expenses`, icon: Receipt, label: "Expenses", sub: "Split bills", bg: "bg-emerald-50", text: "text-emerald-600" },
  { href: `/trips/${id}/settlements`, icon: ArrowRightLeft, label: "Settle Up", sub: "Clear debts", bg: "bg-orange-50", text: "text-orange-600" },
  { href: `/trips/${id}/itinerary`, icon: Calendar, label: "Itinerary", sub: "Day by day", bg: "bg-purple-50", text: "text-purple-600" },
  { href: `/trips/${id}/map`, icon: Map, label: "Live Map", sub: "Track everyone", bg: "bg-blue-50", text: "text-blue-600" },
  { href: `/trips/${id}/members`, icon: Users, label: "Members", sub: "Who's in", bg: "bg-pink-50", text: "text-pink-600" },
];

export function TripDashboardClient({ trip, tripId, totalSpend, expenseCount, currentUserId }: Props) {
  const budgetPct = trip.budget ? Math.min((totalSpend / trip.budget) * 100, 100) : 0;
  const overBudget = budgetPct >= 100;
  const countdown = getDaysInfo(trip.start_date, trip.end_date);

  // Unsplash featured photo by destination — loaded as CSS bg, no next/image config needed
  const photoQuery = encodeURIComponent((trip.destination || "travel adventure") + " city landscape");
  const photoBg = `url(https://source.unsplash.com/featured/900x600/?${photoQuery})`;

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── Hero with destination photo ── */}
      <div
        className="relative h-64 bg-linear-to-br from-indigo-600 via-violet-600 to-purple-700"
        style={{ backgroundImage: photoBg, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        {/* Always-on gradient scrim so text stays readable */}
        <div className="absolute inset-0 bg-linear-to-b from-black/50 via-black/20 to-black/65" />

        <div className="relative h-full flex flex-col justify-between px-5 pt-3 pb-5">
          {/* Top row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-black/25 backdrop-blur-sm rounded-full px-3 py-1.5">
              {trip.destination
                ? <><MapPin className="h-3 w-3 text-white/80" /><span className="text-white text-xs font-medium">{trip.destination}</span></>
                : <><Plane className="h-3 w-3 text-white/80" /><span className="text-white text-xs font-medium">Adventure awaits</span></>
              }
            </div>
            {countdown.text && (
              <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${TAG_PILL[countdown.tag]}`}>
                {countdown.text}
              </span>
            )}
          </div>

          {/* Bottom section */}
          <div>
            {trip.start_date && (
              <p className="text-white/70 text-xs flex items-center gap-1 mb-2.5">
                <Clock className="h-3 w-3" />
                {formatShortDate(trip.start_date)}
                {trip.end_date && ` → ${formatShortDate(trip.end_date)}`}
              </p>
            )}
            <div className="flex items-center justify-between">
              {/* Member avatars */}
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {trip.trip_members.slice(0, 5).map((m: any) => (
                    <Avatar key={m.user_id} className="h-8 w-8 border-2 border-white/40">
                      <AvatarImage src={m.profiles?.avatar} />
                      <AvatarFallback className="text-xs bg-indigo-500 text-white font-semibold">
                        {getInitials(m.profiles?.name)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {trip.trip_members.length > 5 && (
                    <div className="h-8 w-8 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">+{trip.trip_members.length - 5}</span>
                    </div>
                  )}
                </div>
                <p className="text-white/75 text-xs">
                  {trip.trip_members.length} traveller{trip.trip_members.length !== 1 ? "s" : ""}
                </p>
              </div>
              <LocationShareButton tripId={tripId} currentUserId={currentUserId} />
            </div>
          </div>
        </div>
      </div>
      {/* ─────────────────────────────── */}

      <div className="px-4 space-y-3 pt-4 pb-8">

        {/* Stat strip */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 grid grid-cols-3 divide-x divide-gray-100">
          <div className="py-3 text-center">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Spent</p>
            <p className="text-lg font-black text-gray-900 mt-0.5">{formatCurrency(totalSpend)}</p>
            <p className="text-[10px] text-gray-400">{expenseCount} expense{expenseCount !== 1 ? "s" : ""}</p>
          </div>
          <div className="py-3 text-center">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Budget</p>
            <p className="text-lg font-black text-gray-900 mt-0.5">{trip.budget ? formatCurrency(trip.budget) : "—"}</p>
            {trip.budget ? (
              <p className={`text-[10px] font-semibold ${overBudget ? "text-red-500" : "text-emerald-500"}`}>
                {overBudget ? "Over budget" : `${Math.round(100 - budgetPct)}% left`}
              </p>
            ) : <p className="text-[10px] text-gray-400">not set</p>}
          </div>
          <div className="py-3 text-center">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Days</p>
            <p className="text-lg font-black text-gray-900 mt-0.5">
              {countdown.daysNum !== null ? countdown.daysNum : "—"}
            </p>
            <p className="text-[10px] text-gray-400">
              {countdown.tag === "ongoing" ? "remaining" : countdown.tag === "upcoming" ? "to go" : "completed"}
            </p>
          </div>
        </div>

        {/* Budget progress bar */}
        {trip.budget && (
          <div className="flex items-center gap-2.5 px-1">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${budgetPct}%` }}
                transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
                className={`h-full rounded-full ${overBudget ? "bg-red-400" : budgetPct > 75 ? "bg-amber-400" : "bg-emerald-400"}`}
              />
            </div>
            <p className="text-[11px] text-gray-400 font-medium w-8 text-right">{Math.round(budgetPct)}%</p>
          </div>
        )}

        {/* Quick action — Add expense */}
        <Link href={`/trips/${tripId}/expenses/new`}>
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 bg-indigo-600 rounded-2xl px-4 py-3.5 shadow-md shadow-indigo-200/60"
          >
            <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Add Expense</p>
              <p className="text-indigo-200 text-xs">Split it with the group</p>
            </div>
            <ChevronRight className="h-4 w-4 text-white/40" />
          </motion.div>
        </Link>

        {/* Nav grid */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-3"
        >
          {NAV(tripId).map(({ href, icon: Icon, label, sub, bg, text }) => (
            <motion.div key={href} variants={staggerItem}>
              <Link href={href}>
                <motion.div
                  whileTap={{ scale: 0.96 }}
                  className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
                >
                  <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                    <Icon className={`h-5 w-5 ${text}`} strokeWidth={2} />
                  </div>
                  <p className="text-sm font-bold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </div>
  );
}
