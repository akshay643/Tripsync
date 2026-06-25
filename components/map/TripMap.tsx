"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation, MapPin, X, Clock, Radio, Users } from "lucide-react";
import { getInitials } from "@/lib/utils";
import type { Profile, MeetupPoint } from "@/types";

interface LiveLocation {
  user_id: string;
  latitude: number;
  longitude: number;
  sharing_until: string | null;
}

interface TripMapProps {
  tripId: string;
  currentUserId: string;
  memberProfiles: Record<string, Profile>;
}

const SHARE_DURATIONS = [
  { label: "30 minutes", minutes: 30 },
  { label: "2 hours", minutes: 120 },
  { label: "Until I stop", minutes: 0 },
];

function googleMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function TripMap({ tripId, currentUserId, memberProfiles }: TripMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);
  const sharingUntilRef = useRef<string | null>(null);
  const supabase = createClient();

  const [sharing, setSharing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [locationMap, setLocationMap] = useState<Map<string, LiveLocation>>(new Map());
  const [meetupPoints, setMeetupPoints] = useState<MeetupPoint[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [geoError, setGeoError] = useState("");

  const hasToken = !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const locations = Array.from(locationMap.values());

  // ── Broadcast helpers ──────────────────────────────────────────
  const broadcastLocation = useCallback(async (lat: number, lng: number, until: string | null) => {
    await channelRef.current?.send({
      type: "broadcast",
      event: "loc_update",
      payload: { user_id: currentUserId, latitude: lat, longitude: lng, sharing_until: until } as LiveLocation,
    });
    await supabase.from("locations").upsert({
      user_id: currentUserId,
      trip_id: tripId,
      latitude: lat,
      longitude: lng,
      sharing_enabled: true,
      sharing_until: until,
      updated_at: new Date().toISOString(),
    });
  }, [currentUserId, tripId]);

  const pingGPS = useCallback((until: string | null) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => { await broadcastLocation(pos.coords.latitude, pos.coords.longitude, until); },
      () => setGeoError("Location access denied — allow it in browser settings."),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, [broadcastLocation]);

  // ── Realtime broadcast channel (no RLS needed for broadcast) ──
  useEffect(() => {
    const channel = supabase.channel(`loc:${tripId}`);

    channel
      .on("broadcast", { event: "loc_update" }, ({ payload }: { payload: LiveLocation }) => {
        setLocationMap((prev) => new Map(prev).set(payload.user_id, payload));
      })
      .on("broadcast", { event: "loc_stop" }, ({ payload }: { payload: { user_id: string } }) => {
        setLocationMap((prev) => { const n = new Map(prev); n.delete(payload.user_id); return n; });
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;

        // Seed from DB for persistence (own row always readable; others need migration 004)
        const { data: dbLocs } = await supabase
          .from("locations")
          .select("user_id, latitude, longitude, sharing_enabled, sharing_until")
          .eq("trip_id", tripId)
          .eq("sharing_enabled", true);

        if (dbLocs?.length) {
          const init = new Map<string, LiveLocation>();
          dbLocs.forEach((l) => {
            const active = !l.sharing_until || new Date(l.sharing_until) > new Date();
            if (active) init.set(l.user_id, l as LiveLocation);
          });
          setLocationMap(init);
        }

        // Restore own sharing state from own DB row (always readable)
        const { data: own } = await supabase
          .from("locations")
          .select("sharing_enabled, sharing_until, latitude, longitude")
          .eq("user_id", currentUserId)
          .eq("trip_id", tripId)
          .maybeSingle();

        if (own?.sharing_enabled) {
          const active = !own.sharing_until || new Date(own.sharing_until) > new Date();
          if (active) {
            setSharing(true);
            sharingUntilRef.current = own.sharing_until;
            await broadcastLocation(own.latitude, own.longitude, own.sharing_until);
            intervalRef.current = setInterval(() => pingGPS(own.sharing_until), 40000);
            if (own.sharing_until) {
              const rem = new Date(own.sharing_until).getTime() - Date.now();
              if (rem > 0) setTimeout(() => doStop(channel), rem);
            }
          } else {
            supabase.from("locations").update({ sharing_enabled: false })
              .eq("user_id", currentUserId).eq("trip_id", tripId);
          }
        }
      });

    channelRef.current = channel;
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      supabase.removeChannel(channel);
    };
  }, [tripId, currentUserId]);

  // ── Meetup points ──────────────────────────────────────────────
  useEffect(() => {
    fetchMeetupPoints();
    const sub = supabase
      .channel(`meetup:${tripId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "meetup_points", filter: `trip_id=eq.${tripId}` }, fetchMeetupPoints)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [tripId]);

  async function fetchMeetupPoints() {
    const { data } = await supabase.from("meetup_points").select("*").eq("trip_id", tripId).eq("active", true);
    if (data) setMeetupPoints(data);
  }

  // ── Sharing controls ───────────────────────────────────────────
  async function doStop(channel: any) {
    setSharing(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    sharingUntilRef.current = null;
    await channel?.send({ type: "broadcast", event: "loc_stop", payload: { user_id: currentUserId } });
    await supabase.from("locations").update({ sharing_enabled: false })
      .eq("user_id", currentUserId).eq("trip_id", tripId);
    setLocationMap((prev) => { const n = new Map(prev); n.delete(currentUserId); return n; });
  }

  async function startSharing(minutes: number) {
    setShowPicker(false);
    setGeoError("");
    const until = minutes > 0 ? new Date(Date.now() + minutes * 60 * 1000).toISOString() : null;
    sharingUntilRef.current = until;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await broadcastLocation(pos.coords.latitude, pos.coords.longitude, until);
        setSharing(true);
        intervalRef.current = setInterval(() => pingGPS(until), 40000);
        if (minutes > 0) setTimeout(() => doStop(channelRef.current), minutes * 60 * 1000);
      },
      () => setGeoError("Location access denied — allow it in browser settings."),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  function stopSharing() { doStop(channelRef.current); }

  async function dropMeetupPoint() {
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await supabase.from("meetup_points").insert({
          trip_id: tripId, created_by: currentUserId,
          latitude: pos.coords.latitude, longitude: pos.coords.longitude,
          title: "Meet Here", active: true,
        });
      },
      () => setGeoError("Location access denied.")
    );
  }

  // ── Map init ───────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainer.current || !hasToken) return;
    let cancelled = false;
    import("mapbox-gl").then((mod) => {
      if (cancelled || !mapContainer.current) return;
      const mapboxgl = mod.default;
      import("mapbox-gl/dist/mapbox-gl.css").catch(() => {});
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
      const m = new mapboxgl.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [78.9629, 20.5937],
        zoom: 4,
      });
      m.addControl(new mapboxgl.NavigationControl(), "top-right");
      m.on("load", () => setMapReady(true));
      mapRef.current = m;
    });
    return () => { cancelled = true; mapRef.current?.remove(); };
  }, [hasToken]);

  // ── Render markers ─────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    import("mapbox-gl").then((mod) => {
      const mapboxgl = mod.default;
      Object.values(markersRef.current).forEach((m: any) => m.remove());
      markersRef.current = {};

      locations.forEach((loc) => {
        const profile = memberProfiles[loc.user_id];
        const isMe = loc.user_id === currentUserId;
        const name = isMe ? "You" : profile?.name?.split(" ")[0] || "?";
        const el = document.createElement("div");
        el.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:pointer;";
        el.innerHTML = `
          <div style="width:42px;height:42px;border-radius:50%;background:${isMe ? "#4F46E5" : "#0EA5E9"};border:3px solid white;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.22);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;font-weight:700;">
            ${profile?.avatar ? `<img src="${profile.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />` : getInitials(profile?.name)}
          </div>
          <div style="font-size:11px;font-weight:700;color:#1f2937;background:white;border-radius:10px;padding:2px 8px;margin-top:4px;box-shadow:0 1px 6px rgba(0,0,0,0.12);white-space:nowrap;">${name}</div>`;

        const popup = new mapboxgl.Popup({ offset: 55, closeButton: true })
          .setHTML(`
            <div style="padding:4px 2px;min-width:140px;">
              <p style="font-size:13px;font-weight:700;color:#111;margin:0 0 8px;">${isMe ? "Your location" : profile?.name || "Member"}</p>
              <a href="${googleMapsUrl(loc.latitude, loc.longitude)}" target="_blank" rel="noopener"
                style="display:flex;align-items:center;gap:6px;background:#4F46E5;color:white;border-radius:10px;padding:8px 12px;text-decoration:none;font-size:12px;font-weight:600;">
                Navigate in Google Maps
              </a>
            </div>`);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([loc.longitude, loc.latitude])
          .setPopup(popup)
          .addTo(mapRef.current);
        markersRef.current[loc.user_id] = marker;
      });

      meetupPoints.forEach((p) => {
        const el = document.createElement("div");
        el.innerHTML = `<div style="background:#F59E0B;border-radius:50%;width:42px;height:42px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 4px 12px rgba(0,0,0,0.2);">📍</div>`;
        const popup = new mapboxgl.Popup({ offset: 28 })
          .setHTML(`<div style="padding:4px 2px;"><p style="font-weight:700;font-size:13px;margin:0 0 6px;">${p.title}</p><a href="${googleMapsUrl(p.latitude, p.longitude)}" target="_blank" rel="noopener" style="background:#F59E0B;color:white;border-radius:10px;padding:7px 12px;text-decoration:none;font-size:12px;font-weight:600;display:block;text-align:center;">Open in Google Maps</a></div>`);
        new mapboxgl.Marker({ element: el }).setLngLat([p.longitude, p.latitude]).setPopup(popup).addTo(mapRef.current);
      });

      if (locations.length > 0 || meetupPoints.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        locations.forEach((l) => bounds.extend([l.longitude, l.latitude]));
        meetupPoints.forEach((p) => bounds.extend([p.longitude, p.latitude]));
        mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 16 });
      }
    });
  }, [locations, meetupPoints, memberProfiles, mapReady, currentUserId]);

  // ── No-token fallback ──────────────────────────────────────────
  if (!hasToken) {
    return (
      <div className="flex flex-col flex-1 bg-gray-50">
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-indigo-500" />
            <p className="text-sm font-semibold text-gray-700">
              {locations.length > 0 ? `${locations.length} sharing live` : "No one sharing yet"}
            </p>
          </div>
          <div className="space-y-2">
            {locations.map((loc) => {
              const profile = memberProfiles[loc.user_id];
              const isMe = loc.user_id === currentUserId;
              return (
                <div key={loc.user_id} className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-3 shadow-sm">
                  <div className={`h-10 w-10 rounded-full ${isMe ? "bg-indigo-500" : "bg-sky-500"} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                    {profile?.avatar ? <img src={profile.avatar} className="h-10 w-10 rounded-full object-cover" alt="" /> : getInitials(profile?.name)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{isMe ? "You" : profile?.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Radio className="h-3 w-3 text-emerald-500 animate-pulse" /> Live
                    </p>
                  </div>
                  {!isMe && (
                    <a href={googleMapsUrl(loc.latitude, loc.longitude)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 rounded-xl px-3 py-2 text-xs font-bold shrink-0">
                      <Navigation className="h-3.5 w-3.5" /> Navigate
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-6 text-center py-8">
          <div>
            <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-3">
              <MapPin className="h-8 w-8 text-indigo-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700">No Mapbox token</p>
            <p className="text-xs text-gray-400 mt-1">Add <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code> in Vercel env vars to see the live map.</p>
          </div>
        </div>
        <ShareControls sharing={sharing} showPicker={showPicker} geoError={geoError}
          onShare={() => setShowPicker(true)} onStop={stopSharing}
          onPickDuration={startSharing} onDismissPicker={() => setShowPicker(false)}
          onMeetup={dropMeetupPoint} />
      </div>
    );
  }

  return (
    <div className="relative flex-1 flex flex-col">
      <div ref={mapContainer} className="flex-1" style={{ minHeight: "calc(100vh - 160px)" }} />
      <ShareControls sharing={sharing} showPicker={showPicker} geoError={geoError}
        onShare={() => setShowPicker(true)} onStop={stopSharing}
        onPickDuration={startSharing} onDismissPicker={() => setShowPicker(false)}
        onMeetup={dropMeetupPoint} />
    </div>
  );
}

function ShareControls({ sharing, showPicker, geoError, onShare, onStop, onPickDuration, onDismissPicker, onMeetup }: {
  sharing: boolean; showPicker: boolean; geoError: string;
  onShare: () => void; onStop: () => void;
  onPickDuration: (m: number) => void; onDismissPicker: () => void; onMeetup: () => void;
}) {
  return (
    <div className="absolute bottom-4 left-4 right-4 space-y-2">
      <AnimatePresence>
        {geoError && (
          <motion.div key="err" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-xs text-red-600 text-center"
          >{geoError}</motion.div>
        )}
        {showPicker && (
          <motion.div key="picker" initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 space-y-1"
          >
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-indigo-500" /> Share for how long?
            </p>
            {SHARE_DURATIONS.map(({ label, minutes }) => (
              <motion.button key={label} whileTap={{ scale: 0.97 }} onClick={() => onPickDuration(minutes)}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-gray-800 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >{label}</motion.button>
            ))}
            <button onClick={onDismissPicker} className="w-full text-center text-xs text-gray-400 pt-1">Cancel</button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex gap-2">
        <motion.button whileTap={{ scale: 0.97 }} onClick={onMeetup}
          className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl bg-white/90 backdrop-blur border border-gray-200 text-sm font-semibold text-gray-700 shadow-sm"
        ><MapPin className="h-4 w-4 text-amber-500" /> Drop Pin</motion.button>
        {sharing ? (
          <motion.button whileTap={{ scale: 0.97 }} onClick={onStop}
            className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl bg-red-500 text-white text-sm font-bold shadow-md"
          ><X className="h-4 w-4" /> Stop Sharing</motion.button>
        ) : (
          <motion.button whileTap={{ scale: 0.97 }} onClick={onShare}
            className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-md shadow-indigo-200"
          ><Navigation className="h-4 w-4" /> Share Location</motion.button>
        )}
      </div>
      {sharing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-1.5 py-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
          <p className="text-xs text-gray-500 font-medium">Broadcasting your location live</p>
        </motion.div>
      )}
    </div>
  );
}
