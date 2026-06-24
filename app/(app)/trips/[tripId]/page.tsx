export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { InviteSheet } from "@/components/trips/InviteSheet";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency, formatShortDate, getInitials } from "@/lib/utils";
import {
  Map, Receipt, Users, Calendar, ChevronRight, MapPin
} from "lucide-react";

export default async function TripDashboardPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: trip } = await supabase
    .from("trips")
    .select("*, trip_members(*, profiles(*))")
    .eq("id", tripId)
    .single();

  if (!trip) notFound();

  const isMember = trip.trip_members.some((m: any) => m.user_id === user?.id);
  if (!isMember) notFound();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("amount")
    .eq("trip_id", tripId);

  const totalSpend = (expenses ?? []).reduce((sum: number, e: any) => sum + e.amount, 0);
  const budgetPct = trip.budget ? Math.min((totalSpend / trip.budget) * 100, 100) : 0;

  const navCards = [
    { href: `/trips/${tripId}/map`, icon: Map, label: "Live Map", color: "text-indigo-600 bg-indigo-50" },
    { href: `/trips/${tripId}/expenses`, icon: Receipt, label: "Expenses", color: "text-emerald-600 bg-emerald-50" },
    { href: `/trips/${tripId}/settlements`, icon: ChevronRight, label: "Settle Up", color: "text-orange-600 bg-orange-50" },
    { href: `/trips/${tripId}/itinerary`, icon: Calendar, label: "Itinerary", color: "text-purple-600 bg-purple-50" },
    { href: `/trips/${tripId}/members`, icon: Users, label: "Members", color: "text-blue-600 bg-blue-50" },
  ];

  return (
    <>
      <TopBar
        title={trip.title}
        backHref="/trips"
        right={<InviteSheet tripId={tripId} tripTitle={trip.title} />}
      />

      <div className="px-4 pt-4 pb-2 space-y-4">
        {/* Header card */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-gray-900 text-lg">{trip.title}</h2>
                {trip.destination && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {trip.destination}
                  </p>
                )}
              </div>
              <Badge variant="default">
                {trip.start_date ? formatShortDate(trip.start_date) : "No dates"}
                {trip.end_date && ` – ${formatShortDate(trip.end_date)}`}
              </Badge>
            </div>

            {trip.budget && (
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-gray-500">Budget</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(totalSpend)} / {formatCurrency(trip.budget)}
                  </span>
                </div>
                <Progress value={budgetPct} className={budgetPct > 90 ? "[&>div]:bg-red-500" : ""} />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {trip.trip_members.slice(0, 5).map((m: any) => (
                  <Avatar key={m.user_id} className="h-7 w-7 border-2 border-white">
                    <AvatarImage src={m.profiles?.avatar} />
                    <AvatarFallback className="text-xs">{getInitials(m.profiles?.name)}</AvatarFallback>
                  </Avatar>
                ))}
                {trip.trip_members.length > 5 && (
                  <div className="h-7 w-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs text-gray-600 font-medium">
                    +{trip.trip_members.length - 5}
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-500">
                {trip.trip_members.length} member{trip.trip_members.length !== 1 ? "s" : ""}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Nav cards */}
        <div className="grid grid-cols-2 gap-3">
          {navCards.map(({ href, icon: Icon, label, color }) => (
            <Link key={href} href={href}>
              <Card className="active:scale-[0.97] transition-transform">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}

          <Card className="col-span-1">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-0.5">Total spent</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalSpend)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{expenses?.length ?? 0} expenses</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
