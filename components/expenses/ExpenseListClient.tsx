"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/components/ui/motion";
import { formatCurrency, CATEGORY_ICONS, CATEGORY_LABELS } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface Props {
  expenses: any[];
  currentUserId: string;
}

export function ExpenseListClient({ expenses, currentUserId }: Props) {
  const grouped: Record<string, any[]> = {};
  expenses.forEach((e) => {
    const key = e.date || "Unknown";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="px-4 pb-8">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} className="mb-5">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 px-1">
            {new Date(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
          </p>
          <div className="bg-[#0f0f1e] rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/4">
            {items.map((expense) => {
              const isMyExpense = expense.paid_by === currentUserId;
              const myShare = expense.expense_splits?.find((s: any) => s.user_id === currentUserId)?.amount;
              const payerName = isMyExpense ? "You" : expense.profiles?.name?.split(" ")[0] ?? "Someone";

              return (
                <motion.div key={expense.id} variants={staggerItem} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-xl shrink-0">
                    {CATEGORY_ICONS[expense.category] ?? "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{expense.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={expense.profiles?.avatar} />
                        <AvatarFallback className="text-[8px] bg-indigo-600">{getInitials(expense.profiles?.name)}</AvatarFallback>
                      </Avatar>
                      <p className="text-xs text-slate-500">
                        {payerName} paid · {CATEGORY_LABELS[expense.category] ?? expense.category}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-white">{formatCurrency(expense.amount)}</p>
                    {myShare !== undefined && (
                      <p className={`text-xs mt-0.5 font-medium ${isMyExpense ? "text-emerald-400" : "text-amber-400"}`}>
                        {isMyExpense ? "+" : ""}{formatCurrency(myShare)}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
