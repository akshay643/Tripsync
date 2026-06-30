"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation, X, Clock, Radio } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  tripId: string;
  currentUserId: string;
}

const DURATIONS = [
  { label: "30 min", minutes: 30 },
  { label: "2 hours", minutes: 120 },
  { label: "Until I stop", minutes: 0 },
];

export function LocationShareButton({ tripId, currentUserId }: Props) {
  const supabase = createClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [sharing, setSharing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState("");

  // Restore sharing state on mount (so navigating away + back keeps the button active)
  useEffect(() => {
    let mounted = true;
    supabase
      .from("locations")
      .select("sharing_enabled, sharing_until")
      .eq("user_id", currentUserId)
      .eq("trip_id", tripId)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted || !data?.sharing_enabled) return;
        const active = !data.sharing_until || new Date(data.sharing_until) > new Date();
        if (active) {
          setSharing(true);
          const until = data.sharing_until;
          intervalRef.current = setInterval(() => pushLocation(until), 40000);
          if (until) {
            const rem = new Date(until).getTime() - Date.now();
            if (rem > 0) setTimeout(() => stop(), rem);
          }
        } else {
          supabase.from("locations").update({ sharing_enabled: false })
            .eq("user_id", currentUserId).eq("trip_id", tripId);
        }
      });
    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tripId, currentUserId]);

  async function pushLocation(until: string | null) {
    return new Promise<void>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { error: rpcError } = await supabase.rpc("share_my_location", {
            p_trip_id: tripId,
            p_latitude: pos.coords.latitude,
            p_longitude: pos.coords.longitude,
            p_sharing_until: until,
          });

          if (rpcError) {
            const { error: upsertError } = await supabase.from("locations").upsert({
              user_id: currentUserId,
              trip_id: tripId,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              sharing_enabled: true,
              sharing_until: until,
              updated_at: new Date().toISOString(),
            }, { onConflict: "user_id,trip_id" });

            if (upsertError) {
              const message = upsertError.message || rpcError.message || "Could not share location";
              setError(message);
              reject(new Error(message));
              return;
            }
          }

          resolve();
        },
        (err) => {
          setError(
            err.code === 1
              ? "Allow location access in browser settings"
              : err.code === 2
                ? "Could not find your current location"
                : "Location request timed out"
          );
          reject(err);
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    });
  }

  async function start(minutes: number) {
    setShowPicker(false);
    setError("");
    const until = minutes > 0 ? new Date(Date.now() + minutes * 60 * 1000).toISOString() : null;
    try {
      await pushLocation(until);
      setSharing(true);
      intervalRef.current = setInterval(() => pushLocation(until), 40000);
      if (minutes > 0) setTimeout(stop, minutes * 60 * 1000);
    } catch { /* error state set above */ }
  }

  async function stop() {
    setSharing(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    const { error: rpcError } = await supabase.rpc("stop_my_location", { p_trip_id: tripId });
    if (rpcError) {
      const { error } = await supabase.from("locations").update({
        sharing_enabled: false,
        updated_at: new Date().toISOString(),
      }).eq("user_id", currentUserId).eq("trip_id", tripId);
      if (error) setError(error.message || rpcError.message || "Could not stop sharing");
    }
  }

  return (
    <div className="relative">
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute bottom-full right-0 mb-2 bg-[#14142a] rounded-2xl shadow-2xl border border-white/10 p-3 w-44 z-50"
          >
            <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-2 px-1">
              <Clock className="h-3.5 w-3.5" /> Share for how long?
            </p>
            {DURATIONS.map(({ label, minutes }) => (
              <button
                key={label}
                onClick={() => start(minutes)}
                className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-white hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors"
              >
                {label}
              </button>
            ))}
            <button onClick={() => setShowPicker(false)} className="w-full text-center text-xs text-slate-600 pt-1">Cancel</button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute bottom-full right-0 mb-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 whitespace-nowrap"
        >
          {error}
        </motion.p>
      )}

      {sharing ? (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={stop}
          className="flex items-center gap-2 bg-emerald-500 text-white rounded-xl px-3 py-2 text-xs font-bold shadow-md shadow-emerald-200"
        >
          <Radio className="h-3.5 w-3.5 animate-pulse" />
          Live · Stop
          <X className="h-3 w-3" />
        </motion.button>
      ) : (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur text-white rounded-xl px-3 py-2 text-xs font-bold border border-white/30 transition-colors"
        >
          <Navigation className="h-3.5 w-3.5" />
          Share Location
        </motion.button>
      )}
    </div>
  );
}
