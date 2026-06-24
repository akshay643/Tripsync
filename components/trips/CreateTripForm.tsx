"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function CreateTripForm() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    destination: "",
    start_date: "",
    end_date: "",
    budget: "",
  });

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) return;
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not authenticated"); setLoading(false); return; }

    const { data: trip, error: tripErr } = await supabase
      .from("trips")
      .insert({
        title: form.title,
        destination: form.destination || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        budget: form.budget ? parseFloat(form.budget) : null,
        created_by: user.id,
      })
      .select()
      .single();

    if (tripErr || !trip) { setError(tripErr?.message || "Failed to create trip"); setLoading(false); return; }

    await supabase.from("trip_members").insert({
      trip_id: trip.id,
      user_id: user.id,
      role: "admin",
    });

    router.push(`/trips/${trip.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Trip name *</Label>
        <Input
          id="title"
          placeholder="Goa Boys Trip"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="destination">Destination</Label>
        <Input
          id="destination"
          placeholder="Goa, India"
          value={form.destination}
          onChange={(e) => set("destination", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="start_date">Start date</Label>
          <Input
            id="start_date"
            type="date"
            value={form.start_date}
            onChange={(e) => set("start_date", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end_date">End date</Label>
          <Input
            id="end_date"
            type="date"
            value={form.end_date}
            onChange={(e) => set("end_date", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="budget">Budget (₹)</Label>
        <Input
          id="budget"
          type="number"
          placeholder="50000"
          value={form.budget}
          onChange={(e) => set("budget", e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading || !form.title}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Create Trip
      </Button>
    </form>
  );
}
