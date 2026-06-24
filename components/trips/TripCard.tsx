import Link from "next/link";
import { MapPin, Users, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import type { TripWithMembers } from "@/types";

interface TripCardProps {
  trip: TripWithMembers;
}

const gradients = [
  "from-indigo-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-600",
  "from-pink-500 to-rose-600",
];

function getTripGradient(id: string) {
  const idx = id.charCodeAt(0) % gradients.length;
  return gradients[idx];
}

function getTripStatus(trip: TripWithMembers): { label: string; variant: "default" | "success" | "secondary" } {
  if (!trip.start_date) return { label: "Planning", variant: "secondary" };
  const now = new Date();
  const start = new Date(trip.start_date);
  const end = trip.end_date ? new Date(trip.end_date) : null;
  if (end && now > end) return { label: "Completed", variant: "secondary" };
  if (now >= start) return { label: "Active", variant: "success" };
  const daysLeft = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return { label: `In ${daysLeft}d`, variant: "default" };
}

export function TripCard({ trip }: TripCardProps) {
  const status = getTripStatus(trip);
  const gradient = getTripGradient(trip.id);
  const memberCount = trip.trip_members?.length ?? 0;

  return (
    <Link href={`/trips/${trip.id}`}>
      <Card className="overflow-hidden active:scale-[0.98] transition-transform">
        <div className={`h-28 bg-gradient-to-br ${gradient} relative`}>
          {trip.trip_image && (
            <img src={trip.trip_image} alt={trip.title} className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute top-3 right-3">
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 text-base truncate">{trip.title}</h3>
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
            {trip.destination && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {trip.destination}
              </span>
            )}
            {trip.start_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatShortDate(trip.start_date)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Users className="h-3.5 w-3.5" />
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </span>
            {trip.budget && (
              <span className="text-xs font-medium text-indigo-600">
                Budget {formatCurrency(trip.budget)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
