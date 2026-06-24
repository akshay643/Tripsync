export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { ExpenseListClient } from "@/components/expenses/ExpenseListClient";
import { formatCurrency } from "@/lib/utils";
import { Plus, Receipt } from "lucide-react";

export default async function ExpensesPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: trip } = await supabase
    .from("trips")
    .select("title, trip_members(user_id)")
    .eq("id", tripId)
    .single();

  if (!trip) notFound();
  const isMember = trip.trip_members.some((m: any) => m.user_id === user?.id);
  if (!isMember) notFound();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*, profiles(*), expense_splits(*)")
    .eq("trip_id", tripId)
    .order("date", { ascending: false });

  const totalSpend = (expenses ?? []).reduce((s: number, e: any) => s + e.amount, 0);
  const myTotal = (expenses ?? []).reduce((s: number, e: any) => {
    const split = e.expense_splits?.find((sp: any) => sp.user_id === user?.id);
    return s + (split?.amount ?? 0);
  }, 0);

  return (
    <>
      <TopBar
        title="Expenses"
        backHref={`/trips/${tripId}`}
        right={
          <Link href={`/trips/${tripId}/expenses/new`}>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />Add
            </Button>
          </Link>
        }
      />

      {/* Summary bar */}
      <div className="px-4 py-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-linear-to-br from-indigo-500 to-indigo-600 p-4 text-white">
          <p className="text-xs text-indigo-200 font-medium">Group total</p>
          <p className="text-2xl font-bold mt-0.5">{formatCurrency(totalSpend)}</p>
          <p className="text-indigo-200 text-xs mt-1">{expenses?.length ?? 0} expenses</p>
        </div>
        <div className="rounded-2xl bg-linear-to-br from-amber-500 to-orange-500 p-4 text-white">
          <p className="text-xs text-amber-100 font-medium">Your share</p>
          <p className="text-2xl font-bold mt-0.5">{formatCurrency(myTotal)}</p>
          <p className="text-amber-100 text-xs mt-1">across all splits</p>
        </div>
      </div>

      {(expenses ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
            <Receipt className="h-8 w-8 text-gray-300" />
          </div>
          <p className="font-bold text-gray-800">No expenses yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-6">Be the first to add one</p>
          <Link href={`/trips/${tripId}/expenses/new`}>
            <Button className="gap-2 shadow-lg shadow-indigo-200">
              <Plus className="h-4 w-4" />Add Expense
            </Button>
          </Link>
        </div>
      ) : (
        <ExpenseListClient expenses={expenses ?? []} currentUserId={user?.id ?? ""} />
      )}
    </>
  );
}
