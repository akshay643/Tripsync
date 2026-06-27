"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation, MapPin, X, Clock, Radio, RefreshCw, Crosshair, Sparkles, Flag } from "lucide-react";
import { getInitials } from "@/lib/utils";
import type { Profile, MeetupPoint } from "@/types";
import type { Map as MapboxMap, Marker as MapboxMarker } from "mapbox-gl";

interface TripMapProps {
  tripId: string;
  currentUserId: string;
  memberProfiles: Record<string, Profile>;
}

interface LiveLocation {
  id?: string;
  user_id: string;
  trip_id: string;
  latitude: number;
  longitude: number;
  sharing_enabled: boolean;
  sharing_until: string | null;
  updated_at: string;
}

const SHARE_DURATIONS = [
  { label: "30 minutes", minutes: 30 },
  { label: "2 hours", minutes: 120 },
  { label: "Until I stop", minutes: 0 },
];

function googleMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function timeAgo(date?: string | null) {
  if (!date) return "just now";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function sharingLabel(until?: string | null) {
  if (!until) return "until stopped";
  const mins = Math.ceil((new Date(until).getTime() - Date.now()) / 60000);
  if (mins <= 0) return "ending now";
  if (mins < 60) return `${mins}m left`;
  return `${Math.ceil(mins / 60)}h left`;
}

export function TripMap({ tripId, currentUserId, memberProfiles }: TripMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<Record<string, MapboxMarker>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  const [sharing, setSharing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [locations, setLocations] = useState<LiveLocation[]>([]);
  const [meetupPoints, setMeetupPoints] = useState<MeetupPoint[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const hasToken = !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // ── DB fetch helpers ───────────────────────────────────────────
  async function fetchLocations() {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("locations")
      .select("*")
      .eq("trip_id", tripId)
      .eq("sharing_enabled", true)
      .or(`sharing_until.is.null,sharing_until.gt.${now}`)
      .order("updated_at", { ascending: false });
    if (data) setLocations(data);
  }

  async function fetchMeetupPoints() {
    const { data } = await supabase
      .from("meetup_points")
      .select("*, creator:profiles!created_by(id,name,avatar,email,phone,created_at)")
      .eq("trip_id", tripId)
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (data) setMeetupPoints(data as MeetupPoint[]);
  }

  // ── Realtime subscriptions (Postgres Changes) ──────────────────
  // This was the working approach — DB reads with Postgres Changes for real-time updates.
  // We reverted from Broadcast because late-joiners missed earlier broadcasts.
  useEffect(() => {
    void Promise.resolve().then(() => {
      void fetchLocations();
      void fetchMeetupPoints();
    });

    const channel = supabase
      .channel(`map:${tripId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "locations", filter: `trip_id=eq.${tripId}` }, fetchLocations)
      .on("postgres_changes", { event: "*", schema: "public", table: "meetup_points", filter: `trip_id=eq.${tripId}` }, fetchMeetupPoints)
      .subscribe();

    // Restore own sharing state from DB (own row always readable)
    supabase.from("locations")
      .select("sharing_enabled, sharing_until")
      .eq("user_id", currentUserId)
      .eq("trip_id", tripId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data?.sharing_enabled) return;
        const active = !data.sharing_until || new Date(data.sharing_until) > new Date();
        if (active) {
          setSharing(true);
          const until = data.sharing_until;
          intervalRef.current = setInterval(() => pushLocation(until), 40000);
          if (until) {
            const rem = new Date(until).getTime() - Date.now();
            if (rem > 0) setTimeout(stopSharing, rem);
          }
        } else {
          supabase.from("locations")
            .update({ sharing_enabled: false })
            .eq("user_id", currentUserId)
            .eq("trip_id", tripId);
        }
      });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      supabase.removeChannel(channel);
    };
  }, [tripId, currentUserId]);

  // ── GPS helpers ────────────────────────────────────────────────
  async function pushLocation(until: string | null) {
    return new Promise<void>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await supabase.from("locations").upsert({
            user_id: currentUserId,
            trip_id: tripId,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            sharing_enabled: true,
            sharing_until: until,
            updated_at: new Date().toISOString(),
          });
          resolve();
        },
        (err) => { setGeoError("Location access denied — allow it in browser settings."); reject(err); },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    });
  }

  async function startSharing(minutes: number) {
    setShowPicker(false);
    setGeoError("");
    const until = minutes > 0 ? new Date(Date.now() + minutes * 60 * 1000).toISOString() : null;
    try {
      await pushLocation(until);
      setSharing(true);
      intervalRef.current = setInterval(() => pushLocation(until), 40000);
      if (minutes > 0) setTimeout(stopSharing, minutes * 60 * 1000);
    } catch { }
  }

  async function stopSharing() {
    setSharing(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    await supabase.from("locations")
      .update({ sharing_enabled: false })
      .eq("user_id", currentUserId)
      .eq("trip_id", tripId);
    fetchLocations();
  }

  async function refreshLiveData() {
    setRefreshing(true);
    await Promise.all([fetchLocations(), fetchMeetupPoints()]);
    setRefreshing(false);
  }

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
      const map = mapRef.current;
      if (!map) return;
      const mapboxgl = mod.default;
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};

      locations.forEach((loc) => {
        const profile = memberProfiles[loc.user_id];
        const isMe = loc.user_id === currentUserId;
        const name = isMe ? "You" : profile?.name?.split(" ")[0] || "?";
        const el = document.createElement("div");
        el.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:pointer;";
        el.innerHTML = `
          <div style="width:44px;height:44px;border-radius:50%;background:${isMe ? "#4F46E5" : "#0EA5E9"};border:3px solid white;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;font-weight:700;">
            ${profile?.avatar ? `<img src="${profile.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />` : getInitials(profile?.name)}
          </div>
          <div style="font-size:11px;font-weight:700;color:#1f2937;background:white;border-radius:10px;padding:2px 8px;margin-top:4px;box-shadow:0 1px 6px rgba(0,0,0,0.12);white-space:nowrap;">${name}</div>`;

        const popup = new mapboxgl.Popup({ offset: 58, closeButton: true })
          .setHTML(`
            <div style="padding:4px 2px;min-width:150px;">
              <p style="font-size:13px;font-weight:700;color:#111;margin:0 0 8px;">${isMe ? "Your location" : profile?.name || "Member"}</p>
              <p style="font-size:11px;color:#6b7280;margin:0 0 10px;">Updated ${timeAgo(loc.updated_at)} · ${sharingLabel(loc.sharing_until)}</p>
              <a href="${googleMapsUrl(loc.latitude, loc.longitude)}" target="_blank" rel="noopener"
                style="display:flex;align-items:center;justify-content:center;gap:6px;background:#4F46E5;color:white;border-radius:10px;padding:9px 12px;text-decoration:none;font-size:12px;font-weight:600;">
                Navigate in Google Maps
              </a>
            </div>`);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([loc.longitude, loc.latitude])
          .setPopup(popup)
          .addTo(map);
        markersRef.current[loc.user_id] = marker;
      });

      meetupPoints.forEach((p) => {
        const creator = p.creator ?? memberProfiles[p.created_by];
        const droppedBy = p.created_by === currentUserId ? "You" : creator?.name || "A trip member";
        const el = document.createElement("div");
        el.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:pointer;";
        el.innerHTML = `
          <div style="background:linear-gradient(135deg,#F59E0B,#EF4444);border-radius:50%;width:46px;height:46px;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 10px 24px rgba(245,158,11,0.35);border:3px solid white;">📍</div>
          <div style="font-size:10px;font-weight:800;color:#111827;background:white;border-radius:10px;padding:2px 7px;margin-top:4px;box-shadow:0 1px 6px rgba(0,0,0,0.12);white-space:nowrap;">${droppedBy.split(" ")[0]}</div>`;
        const popup = new mapboxgl.Popup({ offset: 30 })
          .setHTML(`
            <div style="padding:4px 2px;min-width:160px;">
              <p style="font-weight:800;font-size:13px;margin:0 0 4px;color:#111827;">${p.title}</p>
              <p style="font-size:11px;color:#6b7280;margin:0 0 10px;">Dropped by ${droppedBy} · ${timeAgo(p.created_at)}</p>
              <a href="${googleMapsUrl(p.latitude, p.longitude)}" target="_blank" rel="noopener" style="background:#F59E0B;color:white;border-radius:10px;padding:8px 12px;text-decoration:none;font-size:12px;font-weight:700;display:block;text-align:center;">Open in Google Maps</a>
            </div>`);
        const marker = new mapboxgl.Marker({ element: el }).setLngLat([p.longitude, p.latitude]).setPopup(popup).addTo(map);
        markersRef.current[`meetup-${p.id}`] = marker;
      });

      if (locations.length > 0 || meetupPoints.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        locations.forEach((l) => bounds.extend([l.longitude, l.latitude]));
        meetupPoints.forEach((p) => bounds.extend([p.longitude, p.latitude]));
        map.fitBounds(bounds, { padding: 80, maxZoom: 16 });
      }
    });
  }, [locations, meetupPoints, memberProfiles, mapReady, currentUserId]);

  // ── No-token fallback ──────────────────────────────────────────
  const otherLiveCount = locations.filter((loc) => loc.user_id !== currentUserId).length;

  if (!hasToken) {
    return (
      <div className="relative flex flex-col flex-1 bg-[#08080f] overflow-hidden">
        <LivePanel
          locations={locations}
          currentUserId={currentUserId}
          memberProfiles={memberProfiles}
          otherLiveCount={otherLiveCount}
          refreshing={refreshing}
        onRefresh={refreshLiveData}
        meetupPoints={meetupPoints}
        compact={false}
      />
        <div className="flex-1" />
        <ShareControls sharing={sharing} showPicker={showPicker} geoError={geoError}
          onShare={() => setShowPicker(true)} onStop={stopSharing}
          onPickDuration={startSharing} onDismissPicker={() => setShowPicker(false)}
          onMeetup={dropMeetupPoint} />
      </div>
    );
  }

  return (
    <div className="relative flex-1 flex flex-col bg-[#08080f]">
      <div ref={mapContainer} className="flex-1" style={{ minHeight: "calc(100vh - 160px)" }} />
      <LivePanel
        locations={locations}
        currentUserId={currentUserId}
        memberProfiles={memberProfiles}
        otherLiveCount={otherLiveCount}
        refreshing={refreshing}
        onRefresh={refreshLiveData}
        meetupPoints={meetupPoints}
        compact
      />
      <ShareControls sharing={sharing} showPicker={showPicker} geoError={geoError}
        onShare={() => setShowPicker(true)} onStop={stopSharing}
        onPickDuration={startSharing} onDismissPicker={() => setShowPicker(false)}
        onMeetup={dropMeetupPoint} />
    </div>
  );
}

function LivePanel({ locations, currentUserId, memberProfiles, otherLiveCount, refreshing, onRefresh, meetupPoints, compact }: {
  locations: LiveLocation[];
  currentUserId: string;
  memberProfiles: Record<string, Profile>;
  otherLiveCount: number;
  refreshing: boolean;
  onRefresh: () => void;
  meetupPoints: MeetupPoint[];
  compact: boolean;
}) {
  const title = locations.length === 0
    ? "No one is live yet"
    : otherLiveCount === 0
      ? "Only you are live"
      : `${otherLiveCount} friend${otherLiveCount === 1 ? "" : "s"} live nearby`;

  return (
    <div className={compact ? "absolute left-3 right-3 top-3 z-20" : "px-4 pt-4 pb-2"}>
      <div className="rounded-2xl border border-white/10 bg-[#0c1020]/90 backdrop-blur-2xl shadow-2xl shadow-black/30 overflow-hidden">
        <div className="flex items-center gap-3 p-4">
          <div className="h-11 w-11 rounded-xl bg-emerald-500/12 flex items-center justify-center shrink-0">
            <Radio className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white">{title}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {locations.length > 0 ? `${locations.length} total sharing now` : "Ask a trip member to tap Share Location"}
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="h-9 w-9 rounded-xl bg-white/7 flex items-center justify-center text-slate-300"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {locations.length > 0 && (
          <div className="flex gap-2 overflow-x-auto px-4 pb-4">
            {locations.map((loc) => {
              const profile = memberProfiles[loc.user_id];
              const isMe = loc.user_id === currentUserId;
              return (
                <a
                  key={loc.user_id}
                  href={googleMapsUrl(loc.latitude, loc.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-[144px] rounded-xl border border-white/8 bg-white/5 p-3 active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-full ${isMe ? "bg-indigo-600" : "bg-sky-600"} flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0`}>
                      {profile?.avatar ? <img src={profile.avatar} className="h-8 w-8 object-cover" alt="" /> : getInitials(profile?.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{isMe ? "You" : profile?.name || "Member"}</p>
                      <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" />
                        {sharingLabel(loc.sharing_until)}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                    <Crosshair className="h-3 w-3" />
                    Updated {timeAgo(loc.updated_at)}
                  </p>
                </a>
              );
            })}
          </div>
        )}

        {meetupPoints.length > 0 && (
          <div className="border-t border-white/7 px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <Flag className="h-3.5 w-3.5 text-amber-400" />
              <p className="text-xs font-bold text-white">Dropped pins</p>
            </div>
            <div className="space-y-2">
              {meetupPoints.slice(0, 3).map((point) => {
                const creator = point.creator ?? memberProfiles[point.created_by];
                const droppedBy = point.created_by === currentUserId ? "You" : creator?.name || "Trip member";
                return (
                  <a
                    key={point.id}
                    href={googleMapsUrl(point.latitude, point.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 active:scale-[0.98] transition-transform"
                  >
                    <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center text-sm">📍</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{point.title}</p>
                      <p className="text-[10px] text-amber-300 truncate">Dropped by {droppedBy} · {timeAgo(point.created_at)}</p>
                    </div>
                    <Navigation className="h-3.5 w-3.5 text-amber-300" />
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
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
            className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 text-xs text-red-400 text-center">
            {geoError}
          </motion.div>
        )}
        {showPicker && (
          <motion.div key="picker" initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }}
            className="bg-[#14142a]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-4 space-y-1">
            <p className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-indigo-400" /> Share for how long?
            </p>
            {SHARE_DURATIONS.map(({ label, minutes }) => (
              <motion.button key={label} whileTap={{ scale: 0.97 }} onClick={() => onPickDuration(minutes)}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors">
                {label}
              </motion.button>
            ))}
            <button onClick={onDismissPicker} className="w-full text-center text-xs text-slate-600 pt-1">Cancel</button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex gap-2">
        <motion.button whileTap={{ scale: 0.97 }} onClick={onMeetup}
          className="flex-1 flex items-center justify-center gap-1.5 h-12 rounded-xl bg-[#14142a]/90 backdrop-blur border border-white/10 text-sm font-semibold text-slate-300 shadow-lg">
          <MapPin className="h-4 w-4 text-amber-400" /> Drop Pin
        </motion.button>
        {sharing ? (
          <motion.button whileTap={{ scale: 0.97 }} onClick={onStop}
            className="flex-1 flex items-center justify-center gap-1.5 h-12 rounded-xl bg-red-500 text-white text-sm font-bold shadow-lg shadow-red-500/25">
            <X className="h-4 w-4" /> Stop Sharing
          </motion.button>
        ) : (
          <motion.button whileTap={{ scale: 0.97 }} onClick={onShare}
            className="flex-1 flex items-center justify-center gap-1.5 h-12 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/30">
            <Navigation className="h-4 w-4" /> Share Location
          </motion.button>
        )}
      </div>
      {sharing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-1.5 py-0.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
          <p className="text-xs text-slate-500 font-medium">Broadcasting your location</p>
        </motion.div>
      )}
    </div>
  );
}
