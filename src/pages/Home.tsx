import { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Plus, GraduationCap, Briefcase } from 'lucide-react';
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
    budgets: budgets.map(b => ({ limit: Number(b.monthly_limit), spent: spentByCat.get(b.category_id) || 0 })),
    goals: goals.map(g => ({ target: Number(g.target_amount), saved: Number(g.saved_amount) })),
    hasInvestmentProfile: !!invest,
  }), [income, expense, lastExpense, budgets, spentByCat, goals, invest]);

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

  const stats = [
    { label: 'Current Balance', value: balance, icon: Wallet, gradient: 'gradient-hero' },
    { label: 'Monthly Income', value: income, icon: TrendingUp, gradient: 'gradient-income' },
    { label: 'Monthly Expenses', value: expense, icon: TrendingDown, gradient: 'gradient-expense' },
    { label: 'Savings This Month', value: savings, icon: PiggyBank, gradient: 'gradient-primary' },
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-bold">
                Hi{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} 👋
              </h1>
              {profile?.student_mode ? (
                <Badge variant="outline" className="text-primary border-primary/30">
                  <GraduationCap className="h-3 w-3 mr-1" /> Student
                </Badge>
              ) : (
                <Badge variant="outline">
                  <Briefcase className="h-3 w-3 mr-1" /> Professional
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Your AI Financial Coach — clear money picture at a glance.</p>
          </div>
          <Button asChild size="sm" className="gradient-primary">
            <Link to="/add-transaction"><Plus className="h-4 w-4 mr-1" /> Add Transaction</Link>
          </Button>
        </div>

        {/* 4 cards exactly */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[100px] rounded-xl" />)
            : stats.map(({ label, value, icon: Icon, gradient }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card className={`${gradient} text-primary-foreground border-0 overflow-hidden`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs opacity-80 truncate">{label}</p>
                        <p className="font-heading text-xl font-bold mt-1 truncate">
                          {value < 0 ? '-' : ''}{formatINR(value)}
                        </p>
                      </div>
                      <Icon className="h-7 w-7 opacity-40 shrink-0" />
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
