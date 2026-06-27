import { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Plus } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  useTransactions, useAccounts, useProfile, useBudgets, useInvestmentProfile,
} from '@/hooks/useFinance';
import { useGoals } from '@/hooks/useGoals';
import { computeHealthScore } from '@/lib/healthScore';
import { HealthScoreCard } from '@/components/HealthScoreCard';
import { AIActionCenter, type AIAction } from '@/components/AIActionCenter';
import { FinancialInsights } from '@/components/FinancialInsights';
import { SavingsRecommendations } from '@/components/SavingsRecommendations';

const formatINR = (v: number) =>
  `₹${Math.abs(Math.round(v)).toLocaleString('en-IN')}`;

const Home = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: txs = [], isLoading } = useTransactions(
    format(startOfMonth(now), 'yyyy-MM-dd'),
    format(endOfMonth(now), 'yyyy-MM-dd'),
  );
  const { data: lastTxs = [] } = useTransactions(
    format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'),
    format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'),
  );
  const { data: accounts = [] } = useAccounts();
  const { data: budgets = [] } = useBudgets(month, year);
  const { data: goals = [] } = useGoals();
  const { data: invest } = useInvestmentProfile();


  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const savings = income - expense;
  const balance = accounts.reduce((s, a) => s + Number(a.balance), 0);
  const lastExpense = lastTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  // Budget spending lookup
  const spentByCat = useMemo(() => {
    const m = new Map<string, number>();
    txs.filter(t => t.type === 'expense').forEach(t => {
      if (!t.category_id) return;
      m.set(t.category_id, (m.get(t.category_id) || 0) + Number(t.amount));
    });
    return m;
  }, [txs]);

  const health = useMemo(() => computeHealthScore({
    income, expense, lastMonthExpense: lastExpense,
    goals: goals.map(g => ({ target: Number(g.target_amount), saved: Number(g.saved_amount) })),
    hasInvestmentSetup: !!invest,
  }), [income, expense, lastExpense, goals, invest]);

  // AI actions — max 3, transparent why
  const actions = useMemo<AIAction[]>(() => {
    const list: AIAction[] = [];

    // 1. Spending change
    if (lastExpense > 0 && expense > 0) {
      const change = ((expense - lastExpense) / lastExpense) * 100;
      if (change > 15) {
        list.push({
          id: 'spending-up',
          title: `Your spending is up ${change.toFixed(0)}% vs last month.`,
          why: `You spent ${formatINR(expense)} so far vs ${formatINR(lastExpense)} last month.`,
          cta: { label: 'See breakdown', to: '/report' },
        });
      }
    }

    // 2. Budget breach
    const over = budgets
      .map(b => ({ name: b.categories?.name, spent: spentByCat.get(b.category_id) || 0, limit: Number(b.monthly_limit) }))
      .filter(b => b.spent > b.limit)[0];
    if (over) {
      list.push({
        id: 'budget-over',
        title: `Over budget on ${over.name} by ${formatINR(over.spent - over.limit)}.`,
        why: `You set a ${formatINR(over.limit)} cap; you've already spent ${formatINR(over.spent)}.`,
        cta: { label: 'Adjust budget', to: '/budgets' },
      });
    }

    // 3. Goal progress
    const topGoal = goals.find(g => Number(g.saved_amount) < Number(g.target_amount));
    if (topGoal) {
      const pct = Math.round((Number(topGoal.saved_amount) / Number(topGoal.target_amount)) * 100);
      list.push({
        id: 'goal-progress',
        title: `${pct}% toward your ${topGoal.name}.`,
        why: `${formatINR(Number(topGoal.saved_amount))} saved of ${formatINR(Number(topGoal.target_amount))} target.`,
        cta: { label: 'Open Goals', to: '/goals' },
      });
    }

    // 4. Savings rate low
    if (list.length < 3 && income > 0 && (savings / income) * 100 < 10) {
      list.push({
        id: 'low-savings',
        title: 'Your savings rate is below 10% this month.',
        why: `Aim for 20%+. Open the Coach for personalized cuts.`,
        cta: { label: 'Ask AI Coach', to: '/coach' },
      });
    }

    return list;
  }, [income, expense, lastExpense, budgets, spentByCat, goals, savings]);

  if (!profileLoading && profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  // Storytelling subtext per card
  const balanceDelta = savings; // net flow this month
  const expensePctOfIncome = income > 0 ? Math.round((expense / income) * 100) : 0;
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;
  const hasSalary = txs.some(t => t.type === 'income' && /salary|stipend|pocket/i.test(t.description || ''));

  const stats = [
    {
      label: 'Current Balance', value: balance, icon: Wallet, gradient: 'gradient-hero',
      sub: balanceDelta !== 0 && income > 0
        ? `${balanceDelta >= 0 ? '↑' : '↓'} ${balanceDelta >= 0 ? '+' : '-'}${formatINR(balanceDelta)} this month`
        : 'No movement this month',
    },
    {
      label: 'Money Received', value: income, icon: TrendingUp, gradient: 'gradient-income',
      sub: income > 0 ? (hasSalary ? 'Income received' : `${txs.filter(t => t.type === 'income').length} income entries`) : 'Add your first income',
    },
    {
      label: 'Monthly Expenses', value: expense, icon: TrendingDown, gradient: 'gradient-expense',
      sub: income > 0 && expense > 0 ? `${expensePctOfIncome}% of income` : expense > 0 ? `${txs.filter(t => t.type === 'expense').length} expenses logged` : 'Nothing spent yet',
    },
    {
      label: 'Savings This Month', value: savings, icon: PiggyBank, gradient: 'gradient-primary',
      sub: income > 0 ? `${savingsRate}% savings rate` : 'Log income to see rate',
    },
  ];

  // Personalized one-line summary
  const topGoalSummary = goals.find(g => Number(g.saved_amount) < Number(g.target_amount));
  const goalPct = topGoalSummary ? Math.round((Number(topGoalSummary.saved_amount) / Number(topGoalSummary.target_amount)) * 100) : 0;
  const riskLabel = invest?.risk_level === 'low' ? 'Conservative' : invest?.risk_level === 'high' ? 'Growth-Oriented' : invest?.risk_level === 'medium' ? 'Moderate' : null;
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = profile?.full_name?.split(' ')[0];

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-bold">
                {greet}{firstName ? `, ${firstName}` : ''} 👋
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">Your AI Financial Coach — clear money picture at a glance.</p>
          </div>
          <Button asChild size="sm" className="gradient-primary">
            <Link to="/add-transaction"><Plus className="h-4 w-4 mr-1" /> Add Transaction</Link>
          </Button>
        </div>

        {/* Personalized AI narrative */}
        {(income > 0 || topGoalSummary || riskLabel) && (
          <Card className="glass-card border-primary/20">
            <CardContent className="p-4 space-y-1 text-sm">
              {income > 0 && (
                <p>
                  This month you saved <span className="font-semibold text-success">{savingsRate}%</span> of your income
                  {savingsRate >= 20 ? ' — strong pace.' : savingsRate >= 10 ? ' — solid, aim for 20%+.' : ' — let\'s improve this.'}
                </p>
              )}
              {topGoalSummary && (
                <p>
                  You're <span className="font-semibold">{goalPct}%</span> of the way to your <span className="font-semibold">{topGoalSummary.name}</span>.
                </p>
              )}
              {riskLabel && (
                <p>Your investment profile remains <span className="font-semibold">{riskLabel}</span>.</p>
              )}
              {actions[0] && (
                <p className="pt-1 border-t border-border/40 mt-2">
                  <span className="text-primary font-medium">Today's suggestion: </span>{actions[0].title}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* 4 cards with story subtext */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[110px] rounded-xl" />)
            : stats.map(({ label, value, icon: Icon, gradient, sub }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card className={`${gradient} text-primary-foreground border-0 overflow-hidden`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs opacity-80 truncate">{label}</p>
                        <p className="font-heading text-xl font-bold mt-1 truncate">
                          {value < 0 ? '-' : ''}{formatINR(value)}
                        </p>
                        <p className="text-[11px] opacity-80 mt-1 truncate">{sub}</p>
                      </div>
                      <Icon className="h-6 w-6 opacity-40 shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
        </div>

        <HealthScoreCard data={health} />

        <AIActionCenter actions={actions} />
      </div>
    </AppLayout>
  );
};

export default Home;
