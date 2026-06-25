"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency, formatShortDate, getInitials } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/components/ui/motion";
import {
  Map, Receipt, Users, Calendar, ArrowRightLeft, MapPin, Wallet,
  Plane, Clock, TrendingUp,
} from "lucide-react";
import { LocationShareButton } from "@/components/map/LocationShareButton";

interface Props {
  trip: any;
  tripId: string;
  totalSpend: number;
  expenseCount: number;
  currentUserId: string;
}

const navCards = (tripId: string) => [
  { href: `/trips/${tripId}/expenses`, icon: Receipt, label: "Expenses", sub: "Split bills", bg: "bg-emerald-50", text: "text-emerald-600", badge: null },
  { href: `/trips/${tripId}/settlements`, icon: ArrowRightLeft, label: "Settle Up", sub: "Clear debts", bg: "bg-orange-50", text: "text-orange-600", badge: null },
  { href: `/trips/${tripId}/itinerary`, icon: Calendar, label: "Itinerary", sub: "Day by day", bg: "bg-purple-50", text: "text-purple-600", badge: null },
  { href: `/trips/${tripId}/map`, icon: Map, label: "Live Map", sub: "Track everyone", bg: "bg-blue-50", text: "text-blue-600", badge: null },
  { href: `/trips/${tripId}/members`, icon: Users, label: "Members", sub: "Who's in", bg: "bg-pink-50", text: "text-pink-600", badge: null },
];

function getDaysLeft(endDate?: string): { label: string; value: number | null; status: "future" | "ongoing" | "past" } {
  if (!endDate) return { label: "", value: null, status: "future" };
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / 864e5);
  if (diff < 0) return { label: "Trip ended", value: null, status: "past" };
  if (diff === 0) return { label: "Last day!", value: 0, status: "ongoing" };
  return { label: `${diff} days left`, value: diff, status: "future" };
}

export function TripDashboardClient({ trip, tripId, totalSpend, expenseCount, currentUserId }: Props) {
  const budgetPct = trip.budget ? Math.min((totalSpend / trip.budget) * 100, 100) : 0;
  const overBudget = budgetPct >= 100;
  const countdown = getDaysLeft(trip.end_date);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <div className="relative bg-linear-to-br from-indigo-600 via-violet-600 to-purple-700 px-5 pt-4 pb-16 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/5" />

        {/* Destination + countdown row */}
        <div className="relative flex items-start justify-between mb-5">
          <div>
            {trip.destination ? (
              <p className="text-indigo-200 text-sm flex items-center gap-1 font-medium">
                <MapPin className="h-3.5 w-3.5" />{trip.destination}
              </p>
            ) : (
              <p className="text-indigo-300 text-sm flex items-center gap-1">
                <Plane className="h-3.5 w-3.5" />Adventure awaits
              </p>
            )}
            {trip.start_date && (
              <p className="text-white/60 text-xs mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatShortDate(trip.start_date)}
                {trip.end_date && ` → ${formatShortDate(trip.end_date)}`}
              </p>
            )}
          </div>
          {countdown.value !== null && (
            <div className="text-right">
              <p className={`text-2xl font-black ${countdown.status === "past" ? "text-gray-300" : "text-white"}`}>
                {countdown.value}
              </p>
              <p className="text-indigo-200 text-[10px] font-semibold uppercase tracking-wider">days left</p>
            </div>
          )}
          {countdown.status === "past" && (
            <div className="bg-white/10 rounded-xl px-3 py-1.5">
              <p className="text-white text-xs font-semibold">Trip ended</p>
            </div>
          )}
        </div>

        {/* Budget bar */}
        {trip.budget ? (
          <div className="relative bg-white/10 rounded-2xl p-4 mb-4 backdrop-blur">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-indigo-200 text-xs font-medium">Spent</p>
                <p className="text-white text-xl font-black">{formatCurrency(totalSpend)}</p>
              </div>
              <div className="text-right">
                <p className="text-indigo-200 text-xs font-medium">Budget</p>
                <p className="text-white text-xl font-black">{formatCurrency(trip.budget)}</p>
              </div>
            </div>
            <div className="relative h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${budgetPct}%` }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                className={`absolute h-full rounded-full ${overBudget ? "bg-red-400" : budgetPct > 75 ? "bg-amber-400" : "bg-emerald-400"}`}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <p className="text-indigo-300 text-xs">{expenseCount} expenses</p>
              <p className={`text-xs font-semibold ${overBudget ? "text-red-400" : "text-emerald-400"}`}>
                {overBudget ? "Over budget!" : `${Math.round(100 - budgetPct)}% remaining`}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative bg-white/10 rounded-2xl p-4 mb-4 backdrop-blur flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-xs font-medium">Total spent</p>
              <p className="text-white text-xl font-black">{formatCurrency(totalSpend)}</p>
              <p className="text-indigo-300 text-xs mt-0.5">{expenseCount} expenses</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-indigo-200" />
            </div>
          </div>
        )}

        {/* Members + share location */}
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2.5">
              {trip.trip_members.slice(0, 5).map((m: any) => (
                <Avatar key={m.user_id} className="h-8 w-8 border-2 border-indigo-600 ring-1 ring-white/20">
                  <AvatarImage src={m.profiles?.avatar} />
                  <AvatarFallback className="text-xs bg-indigo-400 text-white font-semibold">
                    {getInitials(m.profiles?.name)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {trip.trip_members.length > 5 && (
                <div className="h-8 w-8 rounded-full bg-white/20 border-2 border-indigo-600 flex items-center justify-center">
                  <span className="text-[10px] text-white font-bold">+{trip.trip_members.length - 5}</span>
                </div>
              )}
            </div>
            <p className="text-indigo-200 text-xs">
              {trip.trip_members.length} traveller{trip.trip_members.length !== 1 ? "s" : ""}
            </p>
          </div>
          <LocationShareButton tripId={tripId} currentUserId={currentUserId} />
        </div>
      </div>

      {/* Nav cards grid */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="px-4 -mt-8 pb-8 grid grid-cols-2 gap-3"
      >
        {navCards(tripId).map(({ href, icon: Icon, label, sub, bg, text }) => (
          <motion.div key={href} variants={staggerItem}>
            <Link href={href}>
              <motion.div
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm active:shadow-none transition-shadow"
              >
                <div className={`h-11 w-11 rounded-2xl ${bg} flex items-center justify-center mb-3`}>
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
  );
}
