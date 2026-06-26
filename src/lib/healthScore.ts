// Transparent Financial Health Score (0–100)
// Savings Rate (35) + Expense Control (25) + Goal Progress (20) + Spending Consistency (10) + Investment Setup (10)

export type HealthInputs = {
  income: number;
  expense: number;
  lastMonthExpense: number;
  goals: { target: number; saved: number }[];
  hasInvestmentSetup: boolean;
};

export type HealthBreakdown = {
  total: number;
  status: 'Excellent' | 'Good' | 'Average' | 'Needs Work';
  parts: { key: string; label: string; earned: number; max: number; why: string }[];
};

export function computeHealthScore(input: HealthInputs): HealthBreakdown {
  const { income, expense, lastMonthExpense, goals, hasInvestmentSetup } = input;

  // 1. Savings Rate — 35 pts
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
  let savingsPts = 0;
  if (income > 0) {
    if (savingsRate >= 30) savingsPts = 35;
    else if (savingsRate >= 20) savingsPts = 28;
    else if (savingsRate >= 10) savingsPts = 18;
    else if (savingsRate >= 0) savingsPts = 8;
  }
  const savingsWhy = income > 0
    ? `You saved ${savingsRate.toFixed(0)}% of money received this month.`
    : 'Log income to unlock savings-rate points.';

  // 2. Expense Control — 25 pts (lower spend % = better)
  let expensePts = 0;
  let expenseWhy = 'Log income and expenses to score expense control.';
  if (income > 0 && expense >= 0) {
    const spendPct = (expense / income) * 100;
    if (spendPct <= 50) expensePts = 25;
    else if (spendPct <= 70) expensePts = 18;
    else if (spendPct <= 90) expensePts = 10;
    else if (spendPct <= 100) expensePts = 4;
    else expensePts = 0;
    expenseWhy = `You spent ${spendPct.toFixed(0)}% of money received this month.`;
  }

  // 3. Goal Progress — 20 pts
  let goalPts = 0;
  let goalWhy = 'Create a savings goal to earn progress points.';
  if (goals.length > 0) {
    const avg = goals.reduce((s, g) => s + (g.target > 0 ? Math.min(1, g.saved / g.target) : 0), 0) / goals.length;
    goalPts = Math.round(20 * avg);
    goalWhy = `Average progress across ${goals.length} goal${goals.length > 1 ? 's' : ''}: ${Math.round(avg * 100)}%.`;
  }

  // 4. Spending Consistency — 10 pts
  let consistencyPts = 0;
  let consistencyWhy = "Need last month's data to score consistency.";
  if (lastMonthExpense > 0) {
    const change = Math.abs((expense - lastMonthExpense) / lastMonthExpense) * 100;
    if (change <= 10) consistencyPts = 10;
    else if (change <= 25) consistencyPts = 7;
    else if (change <= 50) consistencyPts = 4;
    else consistencyPts = 0;
    consistencyWhy = `Spending changed ${change.toFixed(0)}% vs last month.`;
  } else if (expense > 0) {
    consistencyPts = 5;
    consistencyWhy = 'First tracked month — baseline established.';
  }

  // 5. Investment Setup — 10 pts (only if questionnaire completed / allocation saved)
  const investPts = hasInvestmentSetup ? 10 : 0;
  const investWhy = hasInvestmentSetup
    ? 'Investment allocation saved from your questionnaire.'
    : 'Complete the investment questionnaire to earn these points.';

  const total = savingsPts + expensePts + goalPts + consistencyPts + investPts;
  const status =
    total >= 80 ? 'Excellent' : total >= 60 ? 'Good' : total >= 40 ? 'Average' : 'Needs Work';

  return {
    total,
    status,
    parts: [
      { key: 'savings', label: 'Savings Rate', earned: savingsPts, max: 35, why: savingsWhy },
      { key: 'expense', label: 'Expense Control', earned: expensePts, max: 25, why: expenseWhy },
      { key: 'goals', label: 'Goal Progress', earned: goalPts, max: 20, why: goalWhy },
      { key: 'consistency', label: 'Spending Consistency', earned: consistencyPts, max: 10, why: consistencyWhy },
      { key: 'invest', label: 'Investment Setup', earned: investPts, max: 10, why: investWhy },
    ],
  };
}
