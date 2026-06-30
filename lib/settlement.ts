import type { Expense, ExpenseSplit, CalculatedSettlement } from "@/types";

export function calculateSettlements(
  expenses: (Expense & { expense_splits: ExpenseSplit[] })[],
  memberIds: string[]
): CalculatedSettlement[] {
  const balances: Record<string, number> = {};
  memberIds.forEach((id) => (balances[id] = 0));

  for (const expense of expenses) {
    balances[expense.paid_by] = balances[expense.paid_by] || 0;
    balances[expense.paid_by] = (balances[expense.paid_by] || 0) + expense.amount;
    for (const split of expense.expense_splits) {
      balances[split.user_id] = balances[split.user_id] || 0;
      balances[split.user_id] = (balances[split.user_id] || 0) - split.amount;
    }
  }

  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  for (const [id, balance] of Object.entries(balances)) {
    if (balance > 0.01) creditors.push({ id, amount: balance });
    else if (balance < -0.01) debtors.push({ id, amount: -balance });
  }

  const settlements: CalculatedSettlement[] = [];
  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const credit = creditors[i];
    const debt = debtors[j];
    const amount = Math.min(credit.amount, debt.amount);

    settlements.push({
      from_user: debt.id,
      to_user: credit.id,
      amount: Math.round(amount * 100) / 100,
    });

    credit.amount -= amount;
    debt.amount -= amount;

    if (credit.amount < 0.01) i++;
    if (debt.amount < 0.01) j++;
  }

  return settlements;
}

export function buildEqualSplits(
  amount: number,
  memberIds: string[]
): { user_id: string; amount: number }[] {
  const each = Math.floor((amount / memberIds.length) * 100) / 100;
  const remainder = Math.round((amount - each * memberIds.length) * 100) / 100;

  return memberIds.map((id, idx) => ({
    user_id: id,
    amount: idx === 0 ? each + remainder : each,
  }));
}
