// Transparent Financial Health Score (0–100)
// Savings Rate (35) + Budget Discipline (25) + Goal Progress (20) + Expense Consistency (15) + Investment Habits (5)

export type HealthInputs = {
  income: number;
  expense: number;
  lastMonthExpense: number;
  budgets: { limit: number; spent: number }[];
  goals: { target: number; saved: number }[];
  hasInvestmentProfile: boolean;
};

export type HealthBreakdown = {
  total: number;
  status: 'Excellent' | 'Good' | 'Average' | 'Needs Work';
  parts: { key: string; label: string; earned: number; max: number; why: string }[];
};

export function computeHealthScore(input: HealthInputs): HealthBreakdown {
  const { income, expense, lastMonthExpense, budgets, goals, hasInvestmentProfile } = input;

  // 1. Savings Rate — 35 pts
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
  let savingsPts = 0;
  if (savingsRate >= 30) savingsPts = 35;
  else if (savingsRate >= 20) savingsPts = 28;
  else if (savingsRate >= 10) savingsPts = 18;
  else if (savingsRate >= 0) savingsPts = 8;
  const savingsWhy = income > 0
    ? `You saved ${savingsRate.toFixed(0)}% of income this month.`
    : 'Add income to start scoring savings.';

  // 2. Budget Discipline — 25 pts
  let budgetPts = 0;
  let budgetWhy = 'Set budgets to earn discipline points.';
  if (budgets.length > 0) {
    const overCount = budgets.filter(b => b.spent > b.limit).length;
    const ratio = 1 - overCount / budgets.length;
    budgetPts = Math.round(25 * ratio);
    budgetWhy = overCount === 0
      ? `All ${budgets.length} budgets on track.`
      : `${overCount} of ${budgets.length} budgets exceeded.`;
  }

  // 3. Goal Progress — 20 pts
  let goalPts = 0;
  let goalWhy = 'Create a goal to start earning progress points.';
  if (goals.length > 0) {
    const avg = goals.reduce((s, g) => s + (g.target > 0 ? Math.min(1, g.saved / g.target) : 0), 0) / goals.length;
    goalPts = Math.round(20 * avg);
    goalWhy = `Avg progress across ${goals.length} goal${goals.length > 1 ? 's' : ''}: ${Math.round(avg * 100)}%.`;
  }

  // 4. Expense Consistency — 15 pts (smaller MoM change = better)
  let consistencyPts = 0;
  let consistencyWhy = 'Need last month\'s data to score consistency.';
  if (lastMonthExpense > 0) {
    const change = Math.abs((expense - lastMonthExpense) / lastMonthExpense) * 100;
    if (change <= 10) consistencyPts = 15;
    else if (change <= 25) consistencyPts = 10;
    else if (change <= 50) consistencyPts = 5;
    else consistencyPts = 0;
    consistencyWhy = `Spending changed ${change.toFixed(0)}% vs last month.`;
  } else if (expense > 0) {
    consistencyPts = 8;
    consistencyWhy = 'First tracked month — baseline established.';
  }

  // 5. Investment Habits — 5 pts
  const investPts = hasInvestmentProfile ? 5 : 0;
  const investWhy = hasInvestmentProfile
    ? 'You have an investment profile set up.'
    : 'Set up an investment profile to earn these points.';

  const total = savingsPts + budgetPts + goalPts + consistencyPts + investPts;
  const status =
    total >= 80 ? 'Excellent' : total >= 60 ? 'Good' : total >= 40 ? 'Average' : 'Needs Work';

  return {
    total,
    status,
    parts: [
      { key: 'savings', label: 'Savings Rate', earned: savingsPts, max: 35, why: savingsWhy },
      { key: 'budget', label: 'Budget Discipline', earned: budgetPts, max: 25, why: budgetWhy },
      { key: 'goals', label: 'Goal Progress', earned: goalPts, max: 20, why: goalWhy },
      { key: 'consistency', label: 'Expense Consistency', earned: consistencyPts, max: 15, why: consistencyWhy },
      { key: 'invest', label: 'Investment Habits', earned: investPts, max: 5, why: investWhy },
    ],
  };
}
