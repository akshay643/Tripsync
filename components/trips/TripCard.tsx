"use client";

import Link from "next/link";
import { MapPin, Users, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { staggerItem } from "@/components/ui/motion";
import type { TripWithMembers } from "@/types";

interface TripCardProps {
  trip: TripWithMembers;
  index?: number;
}

const gradients = [
  "from-indigo-500 via-purple-500 to-pink-500",
  "from-blue-500 via-cyan-500 to-teal-400",
  "from-emerald-500 via-green-400 to-lime-400",
  "from-orange-500 via-amber-500 to-yellow-400",
  "from-pink-500 via-rose-500 to-red-400",
  "from-violet-500 via-indigo-500 to-blue-500",
];

function getGradient(id: string) {
  return gradients[id.charCodeAt(0) % gradients.length];
}

function getTripStatus(trip: TripWithMembers): { label: string; variant: "default" | "success" | "secondary" } {
  if (!trip.start_date) return { label: "Planning", variant: "secondary" };
  const now = new Date();
  const start = new Date(trip.start_date);
  const end = trip.end_date ? new Date(trip.end_date) : null;
  if (end && now > end) return { label: "Completed", variant: "secondary" };
  if (now >= start) return { label: "🟢 Active", variant: "success" };
  const days = Math.ceil((start.getTime() - now.getTime()) / 86400000);
  return { label: `In ${days}d`, variant: "default" };
}

export function TripCard({ trip, index = 0 }: TripCardProps) {
  const status = getTripStatus(trip);
  const gradient = getGradient(trip.id);
  const memberCount = trip.trip_members?.length ?? 0;

  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 25 } }}
      whileTap={{ scale: 0.97 }}
    >
      <Link href={`/trips/${trip.id}`} className="block">
        <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
          {/* Banner */}
          <div className={`h-32 bg-linear-to-br ${gradient} relative flex items-end p-4`}>
            {trip.trip_image && (
              <img src={trip.trip_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10 flex items-end justify-between w-full">
              <div>
                <h3 className="text-white font-bold text-lg leading-tight drop-shadow">{trip.title}</h3>
                {trip.destination && (
                  <p className="text-white/80 text-xs flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />{trip.destination}
                  </p>
                )}
              </div>
              <Badge variant={status.variant} className="shrink-0">{status.label}</Badge>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 bg-white">
            <div className="flex items-center gap-3 text-xs text-gray-400">
              {trip.start_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatShortDate(trip.start_date)}
                  {trip.end_date && ` – ${formatShortDate(trip.end_date)}`}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />{memberCount}
              </span>
            </div>
            {trip.budget && (
              <span className="text-xs font-semibold text-indigo-600">
                {formatCurrency(trip.budget)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
