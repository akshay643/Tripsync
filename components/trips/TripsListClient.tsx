"use client";

import { motion } from "framer-motion";
import { TripCard } from "./TripCard";
import { staggerContainer } from "@/components/ui/motion";
import type { TripWithMembers } from "@/types";

export function TripsListClient({ trips }: { trips: TripWithMembers[] }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-3 pt-3"
    >
      {trips.map((trip, i) => (
        <TripCard key={trip.id} trip={trip} index={i} />
      ))}
    </motion.div>
  );
}
