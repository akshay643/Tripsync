"use client";

import Link from "next/link";
import { MapPin, Users, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { staggerItem } from "@/components/ui/motion";
import type { TripWithMembers } from "@/types";

interface TripCardProps {
  trip: TripWithMembers;
  index?: number;
}

const gradients = [
  "from-indigo-600 via-violet-600 to-purple-700",
  "from-blue-600 via-cyan-600 to-teal-600",
  "from-emerald-600 via-teal-600 to-cyan-600",
  "from-orange-600 via-rose-600 to-pink-600",
  "from-pink-600 via-fuchsia-600 to-violet-600",
  "from-violet-600 via-indigo-600 to-blue-700",
];

function getGradient(id: string) {
  return gradients[id.charCodeAt(0) % gradients.length];
}

function getTripStatus(trip: TripWithMembers) {
  if (!trip.start_date) return { label: "Planning", color: "bg-slate-500/20 text-slate-300" };
  const now = new Date();
  const start = new Date(trip.start_date);
  const end = trip.end_date ? new Date(trip.end_date) : null;
  if (end && now > end) return { label: "Done", color: "bg-white/10 text-slate-400" };
  if (now >= start) return { label: "• Live", color: "bg-emerald-500/20 text-emerald-400" };
  const days = Math.ceil((start.getTime() - now.getTime()) / 86400000);
  return { label: `In ${days}d`, color: "bg-indigo-500/20 text-indigo-300" };
}

export function TripCard({ trip }: TripCardProps) {
  const status = getTripStatus(trip);
  const gradient = getGradient(trip.id);
  const memberCount = trip.trip_members?.length ?? 0;

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -2, transition: { type: "spring", stiffness: 400, damping: 25 } }}
      whileTap={{ scale: 0.97 }}
    >
      <Link href={`/trips/${trip.id}`} className="block">
        <div className="rounded-2xl overflow-hidden border border-white/[0.07] bg-[#0f0f1e] shadow-xl shadow-black/40">
          {/* Banner */}
          <div className={`h-36 bg-linear-to-br ${gradient} relative`}>
            {trip.trip_image && (
              <img src={trip.trip_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-4 flex items-end justify-between">
              <div>
                <h3 className="text-white font-bold text-lg leading-tight drop-shadow-md">{trip.title}</h3>
                {trip.destination && (
                  <p className="text-white/70 text-xs flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />{trip.destination}
                  </p>
                )}
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm ${status.color}`}>
                {status.label}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              {trip.start_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-600" />
                  {formatShortDate(trip.start_date)}
                  {trip.end_date && ` – ${formatShortDate(trip.end_date)}`}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-slate-600" />{memberCount}
              </span>
            </div>
            {trip.budget && (
              <span className="text-xs font-bold text-indigo-400">
                {formatCurrency(trip.budget)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
