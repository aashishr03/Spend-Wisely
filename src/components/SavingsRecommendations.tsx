import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PiggyBank, Sparkles } from 'lucide-react';

const formatINR = (v: number) => `₹${Math.abs(Math.round(v)).toLocaleString('en-IN')}`;

type Tx = { type: string; amount: number | string; categories?: { name?: string | null } | null };
type Goal = { name: string; saved_amount: number | string; target_amount: number | string };

interface Props {
  txs: Tx[];
  lastTxs: Tx[];
  goals: Goal[];
  hasInvestmentSetup: boolean;
}

export const SavingsRecommendations = ({ txs, lastTxs, goals, hasInvestmentSetup }: Props) => {
  const recs = useMemo(() => {
    const out: string[] = [];
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const lastExpense = lastTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const savings = income - expense;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    const catMap = new Map<string, number>();
    txs.filter(t => t.type === 'expense').forEach(t => {
      const name = t.categories?.name || 'Other';
      catMap.set(name, (catMap.get(name) || 0) + Number(t.amount));
    });
    const sortedCats = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]);

    const lastCatMap = new Map<string, number>();
    lastTxs.filter(t => t.type === 'expense').forEach(t => {
      const name = t.categories?.name || 'Other';
      lastCatMap.set(name, (lastCatMap.get(name) || 0) + Number(t.amount));
    });

    // 1. Top category reduction
    if (sortedCats[0]) {
      const [name, amt] = sortedCats[0];
      const cut = Math.round(amt * 0.15);
      out.push(`Your ${name} category is your largest expense (${formatINR(amt)}). Trimming it by 15% would save about ${formatINR(cut)} this month.`);
    }

    // 2. Category that grew significantly
    sortedCats.forEach(([name, amt]) => {
      if (out.length >= 5) return;
      const prev = lastCatMap.get(name) || 0;
      if (prev > 0 && amt > prev * 1.2) {
        const extra = amt - prev;
        const saveTarget = Math.round(extra * 0.5);
        out.push(`${name} spending increased ${formatINR(extra)} versus last month. Cutting it back 20% could save you ${formatINR(saveTarget)}.`);
      }
    });

    // 3. Goal-specific tip
    const activeGoal = goals.find(g => Number(g.saved_amount) < Number(g.target_amount));
    if (activeGoal) {
      const remaining = Number(activeGoal.target_amount) - Number(activeGoal.saved_amount);
      const weekly = Math.max(100, Math.round(remaining / 12));
      out.push(`You're close to reaching your ${activeGoal.name} — saving an extra ${formatINR(weekly)} weekly will help you finish sooner.`);
    }

    // 4. Investment nudge
    if (savingsRate >= 25) {
      if (hasInvestmentSetup) {
        out.push(`Your savings rate is strong (${Math.round(savingsRate)}%). Consider increasing your monthly investment to put idle cash to work.`);
      } else {
        out.push(`Since your savings rate is already high (${Math.round(savingsRate)}%), consider investing a portion instead of keeping everything as cash.`);
      }
    }

    // 5. Generic but data-grounded fallback
    if (out.length < 3 && expense > 0) {
      const eatOut = sortedCats.find(([n]) => /food|restaurant|dining/i.test(n));
      if (eatOut) {
        const cut = Math.round(eatOut[1] * 0.2);
        out.push(`Cook at home a couple more times this week to cut your ${eatOut[0]} bill by roughly ${formatINR(cut)}.`);
      }
    }

    if (out.length < 3 && lastExpense > 0 && expense > lastExpense) {
      out.push(`Total expenses are up ${formatINR(expense - lastExpense)} vs last month — review the largest categories first.`);
    }

    return out.slice(0, 5);
  }, [txs, lastTxs, goals, hasInvestmentSetup]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
      <Card className="glass-card border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-primary" /> Savings Recommendations
          </CardTitle>
          <CardDescription>Personalized actions, all calculated from your real spending.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {recs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Log a full month of transactions to unlock tailored savings tips.</p>
          ) : recs.map((r, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-card/40 p-3">
              <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <p className="text-sm leading-snug">{r}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
};
