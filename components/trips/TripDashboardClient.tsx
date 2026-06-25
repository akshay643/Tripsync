"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency, formatShortDate, getInitials } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/components/ui/motion";
import {
  Map, Receipt, Users, Calendar, ArrowRightLeft, MapPin, Wallet,
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
  { href: `/trips/${tripId}/map`, icon: Map, label: "Live Map", sub: "Track everyone", color: "from-blue-500 to-cyan-500", bg: "bg-blue-50", text: "text-blue-600" },
  { href: `/trips/${tripId}/expenses`, icon: Receipt, label: "Expenses", sub: "Split bills", color: "from-emerald-500 to-teal-500", bg: "bg-emerald-50", text: "text-emerald-600" },
  { href: `/trips/${tripId}/settlements`, icon: ArrowRightLeft, label: "Settle Up", sub: "Clear debts", color: "from-orange-500 to-amber-500", bg: "bg-orange-50", text: "text-orange-600" },
  { href: `/trips/${tripId}/itinerary`, icon: Calendar, label: "Itinerary", sub: "Day by day", color: "from-purple-500 to-violet-500", bg: "bg-purple-50", text: "text-purple-600" },
  { href: `/trips/${tripId}/members`, icon: Users, label: "Members", sub: "Who's in", color: "from-pink-500 to-rose-500", bg: "bg-pink-50", text: "text-pink-600" },
];

export function TripDashboardClient({ trip, tripId, totalSpend, expenseCount, currentUserId }: Props) {
  const budgetPct = trip.budget ? Math.min((totalSpend / trip.budget) * 100, 100) : 0;
  const overBudget = budgetPct >= 100;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <div className="bg-linear-to-br from-indigo-600 via-indigo-700 to-purple-700 px-5 pt-5 pb-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">{trip.title}</h2>
            {trip.destination && (
              <p className="text-indigo-300 text-sm flex items-center gap-1 mt-0.5">
                <MapPin className="h-3.5 w-3.5" />{trip.destination}
              </p>
            )}
          </div>
          {trip.start_date && (
            <div className="text-right">
              <p className="text-xs text-indigo-300">Dates</p>
              <p className="text-white text-sm font-semibold">
                {formatShortDate(trip.start_date)}
                {trip.end_date && ` – ${formatShortDate(trip.end_date)}`}
              </p>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur">
            <p className="text-indigo-200 text-xs font-medium">Total Spent</p>
            <p className="text-white text-2xl font-bold mt-0.5">{formatCurrency(totalSpend)}</p>
            <p className="text-indigo-300 text-xs mt-0.5">{expenseCount} expenses</p>
          </div>
          {trip.budget ? (
            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur">
              <div className="flex items-center justify-between mb-2">
                <p className="text-indigo-200 text-xs font-medium">Budget</p>
                <span className={`text-xs font-bold ${overBudget ? "text-red-400" : "text-emerald-400"}`}>
                  {Math.round(budgetPct)}%
                </span>
              </div>
              <Progress
                value={budgetPct}
                className={`h-1.5 bg-white/20 ${overBudget ? "[&>div]:bg-red-400" : "[&>div]:bg-emerald-400"}`}
              />
              <p className="text-white text-sm font-semibold mt-1.5">{formatCurrency(trip.budget)}</p>
            </div>
          ) : (
            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur flex items-center justify-center">
              <div className="text-center">
                <Wallet className="h-6 w-6 text-indigo-300 mx-auto mb-1" />
                <p className="text-indigo-200 text-xs">No budget set</p>
              </div>
            </div>
          )}
        </div>

        {/* Members */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {trip.trip_members.slice(0, 6).map((m: any) => (
                <Avatar key={m.user_id} className="h-7 w-7 border-2 border-indigo-600">
                  <AvatarImage src={m.profiles?.avatar} />
                  <AvatarFallback className="text-xs bg-indigo-400 text-white">{getInitials(m.profiles?.name)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <p className="text-indigo-200 text-xs">
              {trip.trip_members.length} member{trip.trip_members.length !== 1 ? "s" : ""}
            </p>
          </div>
          <LocationShareButton tripId={tripId} currentUserId={currentUserId} />
        </div>
      </div>

      {/* Nav cards */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="px-4 -mt-5 pb-6 grid grid-cols-2 gap-3"
      >
        {navCards(tripId).map(({ href, icon: Icon, label, sub, bg, text }) => (
          <motion.div key={href} variants={staggerItem}>
            <Link href={href}>
              <motion.div
                whileHover={{ y: -2, transition: { type: "spring", stiffness: 400 } }}
                whileTap={{ scale: 0.96 }}
                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={`h-5 w-5 ${text}`} />
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
