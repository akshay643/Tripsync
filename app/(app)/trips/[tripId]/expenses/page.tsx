export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { ExpenseCard } from "@/components/expenses/ExpenseCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  const myExpenses = (expenses ?? []).filter((e: any) =>
    e.expense_splits?.some((s: any) => s.user_id === user?.id)
  );
  const myTotal = myExpenses.reduce((s: number, e: any) => {
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
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </Link>
        }
      />

      <div className="px-4 py-4 grid grid-cols-2 gap-3 mb-2">
        <div className="rounded-2xl bg-indigo-50 p-4">
          <p className="text-xs text-indigo-500 font-medium">Total spent</p>
          <p className="text-xl font-bold text-indigo-900 mt-0.5">{formatCurrency(totalSpend)}</p>
        </div>
        <div className="rounded-2xl bg-amber-50 p-4">
          <p className="text-xs text-amber-600 font-medium">Your share</p>
          <p className="text-xl font-bold text-amber-900 mt-0.5">{formatCurrency(myTotal)}</p>
        </div>
      </div>

      {(expenses ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <Receipt className="h-12 w-12 text-gray-200 mb-4" />
          <p className="font-semibold text-gray-700">No expenses yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">Add the first expense for this trip</p>
          <Link href={`/trips/${tripId}/expenses/new`}>
            <Button className="gap-2"><Plus className="h-4 w-4" />Add Expense</Button>
          </Link>
        </div>
      ) : (
        <div className="px-4 divide-y divide-gray-100">
          {(expenses ?? []).map((expense: any) => (
            <ExpenseCard
              key={expense.id}
              expense={{ ...expense, payer: expense.profiles }}
              currentUserId={user?.id ?? ""}
            />
          ))}
        </div>
      )}
    </>
  );
}
