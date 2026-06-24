"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Clock, X } from "lucide-react";
import { getInitials } from "@/lib/utils";
import type { Location, Profile, MeetupPoint } from "@/types";

interface TripMapProps {
  tripId: string;
  currentUserId: string;
  memberProfiles: Record<string, Profile>;
}

const SHARE_DURATIONS = [
  { label: "30 min", minutes: 30 },
  { label: "2 hours", minutes: 120 },
  { label: "Until I stop", minutes: 0 },
];

export function TripMap({ tripId, currentUserId, memberProfiles }: TripMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Record<string, mapboxgl.Marker>>({});
  const locationInterval = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  const [sharing, setSharing] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [memberLocations, setMemberLocations] = useState<Location[]>([]);
  const [meetupPoints, setMeetupPoints] = useState<MeetupPoint[]>([]);

  useEffect(() => {
    if (!mapContainer.current || !process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [78.9629, 20.5937],
      zoom: 4,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    fetchLocations();
    fetchMeetupPoints();

    const channel = supabase
      .channel(`map:${tripId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "locations", filter: `trip_id=eq.${tripId}` }, fetchLocations)
      .on("postgres_changes", { event: "*", schema: "public", table: "meetup_points", filter: `trip_id=eq.${tripId}` }, fetchMeetupPoints)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      map.current?.remove();
      if (locationInterval.current) clearInterval(locationInterval.current);
    };
  }, [tripId]);

  async function fetchLocations() {
    const { data } = await supabase
      .from("locations")
      .select("*")
      .eq("trip_id", tripId)
      .eq("sharing_enabled", true);
    if (data) setMemberLocations(data);
  }

  async function fetchMeetupPoints() {
    const { data } = await supabase
      .from("meetup_points")
      .select("*")
      .eq("trip_id", tripId)
      .eq("active", true);
    if (data) setMeetupPoints(data);
  }

  useEffect(() => {
    if (!map.current) return;

    Object.values(markers.current).forEach((m) => m.remove());
    markers.current = {};

    memberLocations.forEach((loc) => {
      const profile = memberProfiles[loc.user_id];
      const el = document.createElement("div");
      el.className = "flex flex-col items-center";
      el.innerHTML = `
        <div style="width:36px;height:36px;border-radius:50%;background:#4F46E5;border:2.5px solid white;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:600;">
          ${profile?.avatar ? `<img src="${profile.avatar}" style="width:100%;height:100%;object-fit:cover;" />` : getInitials(profile?.name)}
        </div>
        <div style="font-size:11px;font-weight:600;color:#1f2937;background:white;border-radius:8px;padding:1px 6px;margin-top:3px;box-shadow:0 1px 4px rgba(0,0,0,0.15);">
          ${profile?.name?.split(" ")[0] || "?"}
        </div>
      `;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([loc.longitude, loc.latitude])
        .addTo(map.current!);

      markers.current[loc.user_id] = marker;
    });

    meetupPoints.forEach((point) => {
      const el = document.createElement("div");
      el.innerHTML = `<div style="background:#F59E0B;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.25);">📍</div>`;

      new mapboxgl.Marker({ element: el })
        .setLngLat([point.longitude, point.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 20 }).setText(point.title))
        .addTo(map.current!);
    });

    if (memberLocations.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      memberLocations.forEach((loc) => bounds.extend([loc.longitude, loc.latitude]));
      meetupPoints.forEach((p) => bounds.extend([p.longitude, p.latitude]));
      map.current.fitBounds(bounds, { padding: 80, maxZoom: 15 });
    }
  }, [memberLocations, meetupPoints, memberProfiles]);

  async function startSharing(minutes: number) {
    setShowDurationPicker(false);
    setSharing(true);

    const sharingUntil = minutes > 0
      ? new Date(Date.now() + minutes * 60 * 1000).toISOString()
      : null;

    async function pushLocation() {
      return new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            await supabase.from("locations").upsert({
              user_id: currentUserId,
              trip_id: tripId,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              sharing_enabled: true,
              sharing_until: sharingUntil,
              updated_at: new Date().toISOString(),
            });
            resolve();
          },
          reject,
          { enableHighAccuracy: false, timeout: 8000 }
        );
      });
    }

    await pushLocation();
    locationInterval.current = setInterval(pushLocation, 40000);

    if (minutes > 0) {
      setTimeout(stopSharing, minutes * 60 * 1000);
    }
  }

  async function stopSharing() {
    setSharing(false);
    if (locationInterval.current) {
      clearInterval(locationInterval.current);
      locationInterval.current = null;
    }
    await supabase
      .from("locations")
      .update({ sharing_enabled: false })
      .eq("user_id", currentUserId)
      .eq("trip_id", tripId);
  }

  async function dropMeetupPoint() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      await supabase.from("meetup_points").insert({
        trip_id: tripId,
        created_by: currentUserId,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        title: "Meet Here",
        active: true,
      });
    });
  }

  return (
    <div className="relative flex-1 flex flex-col">
      <div ref={mapContainer} className="flex-1 min-h-[calc(100vh-180px)]" />

      <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
        {memberLocations.length === 0 && !sharing && (
          <div className="bg-white/90 backdrop-blur rounded-2xl px-4 py-3 text-sm text-gray-600 text-center shadow">
            No one is sharing location yet
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 bg-white/90 backdrop-blur shadow"
            onClick={dropMeetupPoint}
          >
            <MapPin className="h-4 w-4 text-amber-500" />
            Drop meetup
          </Button>

          {sharing ? (
            <Button
              variant="destructive"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={stopSharing}
            >
              <X className="h-4 w-4" />
              Stop sharing
            </Button>
          ) : (
            <Button
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => setShowDurationPicker(true)}
            >
              <Navigation className="h-4 w-4" />
              Share location
            </Button>
          )}
        </div>

        {showDurationPicker && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 space-y-2">
            <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Share for how long?
            </p>
            {SHARE_DURATIONS.map(({ label, minutes }) => (
              <button
                key={label}
                onClick={() => startSharing(minutes)}
                className="w-full text-left px-4 py-2.5 rounded-xl text-sm hover:bg-indigo-50 text-gray-800 font-medium transition-colors"
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setShowDurationPicker(false)}
              className="w-full text-center text-sm text-gray-400 py-1"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
