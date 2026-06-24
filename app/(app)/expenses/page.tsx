export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { formatCurrency, CATEGORY_ICONS, CATEGORY_LABELS } from "@/lib/utils";
import { Receipt } from "lucide-react";

export default async function ExpensesOverviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get trips the user is in
  const { data: memberRows } = await supabase
    .from("trip_members")
    .select("trip_id")
    .eq("user_id", user?.id ?? "");

  const tripIds = (memberRows ?? []).map((r: any) => r.trip_id);

  let allExpenses: any[] = [];
  let myTotal = 0;

  if (tripIds.length > 0) {
    // Get all expenses from user's trips
    const { data: expenses } = await supabase
      .from("expenses")
      .select("*, profiles(*), expense_splits(*), trips(title)")
      .in("trip_id", tripIds)
      .order("date", { ascending: false });

    allExpenses = expenses ?? [];

    // Calculate user's share across all trips
    allExpenses.forEach((e) => {
      const split = e.expense_splits?.find((s: any) => s.user_id === user?.id);
      if (split) myTotal += split.amount;
    });
  }

  const totalGroupSpend = allExpenses.reduce((s: number, e: any) => s + e.amount, 0);

  return (
    <>
      <TopBar title="All Expenses" />
      <div className="px-4 py-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-2xl bg-indigo-600 p-4 text-white">
            <p className="text-xs text-indigo-200 font-medium">Group total</p>
            <p className="text-2xl font-bold mt-0.5">{formatCurrency(totalGroupSpend)}</p>
          </div>
          <div className="rounded-2xl bg-amber-500 p-4 text-white">
            <p className="text-xs text-amber-100 font-medium">Your share</p>
            <p className="text-2xl font-bold mt-0.5">{formatCurrency(myTotal)}</p>
          </div>
        </div>

        {allExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Receipt className="h-12 w-12 text-gray-200 mb-4" />
            <p className="font-semibold text-gray-700">No expenses yet</p>
            <p className="text-sm text-gray-400 mt-1">Add expenses inside a trip</p>
          </div>
        ) : (
          <div className="space-y-1">
            {allExpenses.map((expense: any) => {
              const myShare = expense.expense_splits?.find((s: any) => s.user_id === user?.id)?.amount;
              const isMyExpense = expense.paid_by === user?.id;
              return (
                <Link key={expense.id} href={`/trips/${expense.trip_id}/expenses`}>
                  <div className="flex items-center gap-3 py-3.5 border-b border-gray-50 active:bg-gray-50 rounded-xl px-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-xl shrink-0">
                      {CATEGORY_ICONS[expense.category] ?? "📦"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{expense.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {expense.trips?.title} · {isMyExpense ? "You paid" : `${expense.profiles?.name?.split(" ")[0] ?? "Someone"} paid`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(expense.amount)}</p>
                      {myShare !== undefined && (
                        <p className="text-xs text-gray-400">{formatCurrency(myShare)} yours</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
