export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, CATEGORY_ICONS } from "@/lib/utils";
import { Receipt } from "lucide-react";

export default async function ExpensesOverviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: splits } = await supabase
    .from("expense_splits")
    .select("amount, expenses(trip_id, title, category, date, trips(title))")
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: false });

  const totalOwed = (splits ?? []).reduce((s: number, sp: any) => s + sp.amount, 0);

  return (
    <>
      <TopBar title="My Expenses" />
      <div className="px-4 py-4">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 mb-5 text-white">
          <p className="text-sm text-indigo-200">Total across all trips</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(totalOwed)}</p>
        </div>

        {(splits ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Receipt className="h-12 w-12 text-gray-200 mb-4" />
            <p className="font-semibold text-gray-700">No expenses yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(splits ?? []).slice(0, 50).map((sp: any, idx: number) => {
              const expense = sp.expenses;
              const trip = expense?.trips;
              return (
                <Link key={idx} href={`/trips/${expense?.trip_id}/expenses`}>
                  <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                    <div className="text-xl">
                      {CATEGORY_ICONS[expense?.category ?? "misc"] ?? "📦"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{expense?.title}</p>
                      <p className="text-xs text-gray-400">{trip?.title}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(sp.amount)}</p>
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
