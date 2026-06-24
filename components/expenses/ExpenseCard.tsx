import { formatCurrency, CATEGORY_ICONS, CATEGORY_LABELS } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import type { Expense } from "@/types";

interface ExpenseCardProps {
  expense: Expense;
  currentUserId: string;
}

export function ExpenseCard({ expense, currentUserId }: ExpenseCardProps) {
  const icon = CATEGORY_ICONS[expense.category] || "📦";
  const label = CATEGORY_LABELS[expense.category] || expense.category;
  const isMyExpense = expense.paid_by === currentUserId;
  const payerName = expense.payer?.name || "Someone";

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-lg shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{expense.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {isMyExpense ? "You paid" : `${payerName} paid`} · {label}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-gray-900">
          {formatCurrency(expense.amount)}
        </p>
        {expense.expense_splits && (
          <p className="text-xs text-gray-400 mt-0.5">
            {formatCurrency(
              expense.expense_splits.find((s) => s.user_id === currentUserId)?.amount ?? 0
            )}{" "}
            your share
          </p>
        )}
      </div>
    </div>
  );
}
