import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lightbulb, TrendingUp, TrendingDown, Target as TargetIcon, ShieldCheck } from 'lucide-react';

const formatINR = (v: number) => `₹${Math.abs(Math.round(v)).toLocaleString('en-IN')}`;

type Tx = { type: string; amount: number | string; category_id?: string | null; categories?: { name?: string | null } | null };
type Goal = { name: string; saved_amount: number | string; target_amount: number | string };

interface Props {
  txs: Tx[];
  lastTxs: Tx[];
  goals: Goal[];
}

interface Insight {
  id: string;
  icon: typeof Lightbulb;
  tone: 'positive' | 'warning' | 'neutral';
  text: string;
}

export const FinancialInsights = ({ txs, lastTxs, goals }: Props) => {
  const insights = useMemo<Insight[]>(() => {
    const out: Insight[] = [];
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const lastExpense = lastTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const savings = income - expense;
    const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;

    // Category breakdown
    const catMap = new Map<string, number>();
    txs.filter(t => t.type === 'expense').forEach(t => {
      const name = t.categories?.name || 'Other';
      catMap.set(name, (catMap.get(name) || 0) + Number(t.amount));
    });
    const sortedCats = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]);
    const topCat = sortedCats[0];
    const topPct = topCat && expense > 0 ? Math.round((topCat[1] / expense) * 100) : 0;

    // 1. Savings insight
    if (income > 0) {
      if (savingsRate >= 30) {
        out.push({ id: 'sav', icon: ShieldCheck, tone: 'positive',
          text: `Excellent — you saved ${savingsRate}% of your money received this month (${formatINR(savings)}).` });
      } else if (savingsRate >= 10) {
        out.push({ id: 'sav', icon: TrendingUp, tone: 'neutral',
          text: `You saved ${savingsRate}% (${formatINR(savings)}) this month. Push toward 20%+ for momentum.` });
      } else if (savings < 0) {
        out.push({ id: 'sav', icon: TrendingDown, tone: 'warning',
          text: `You spent ${formatINR(Math.abs(savings))} more than you received this month.` });
      } else {
        out.push({ id: 'sav', icon: TrendingDown, tone: 'warning',
          text: `Your savings rate is just ${savingsRate}% — aim for 20% or higher.` });
      }
    }

    // 2. Top spending category
    if (topCat && expense > 0) {
      out.push({ id: 'top', icon: Lightbulb, tone: topPct > 50 ? 'warning' : 'neutral',
        text: `${topCat[0]} accounts for ${topPct}% of your spending (${formatINR(topCat[1])}).` });
    }

    // 3. Month-over-month
    if (lastExpense > 0 && expense > 0) {
      const diff = expense - lastExpense;
      const pct = Math.round((diff / lastExpense) * 100);
      if (Math.abs(pct) >= 5) {
        out.push({
          id: 'mom',
          icon: diff < 0 ? TrendingDown : TrendingUp,
          tone: diff < 0 ? 'positive' : 'warning',
          text: diff < 0
            ? `Your expenses decreased by ${Math.abs(pct)}% compared to last month — nice control.`
            : `Your expenses increased by ${pct}% versus last month (${formatINR(diff)} more).`,
        });
      }
    }

    // 4. Goal progress
    const activeGoal = goals.find(g => Number(g.saved_amount) < Number(g.target_amount));
    if (activeGoal) {
      const pct = Math.round((Number(activeGoal.saved_amount) / Number(activeGoal.target_amount)) * 100);
      out.push({
        id: 'goal', icon: TargetIcon, tone: pct >= 50 ? 'positive' : 'neutral',
        text: pct >= 80
          ? `You're ${pct}% to your ${activeGoal.name} goal — final stretch.`
          : pct >= 25
            ? `You are progressing steadily toward your ${activeGoal.name} (${pct}% complete).`
            : `Your ${activeGoal.name} goal is ${pct}% complete — consider boosting weekly contributions.`,
      });
    }

    // 5. Expense control
    if (expense > 0 && income > 0 && expense < income * 0.6) {
      out.push({
        id: 'control', icon: ShieldCheck, tone: 'positive',
        text: `You have maintained excellent expense control — spending only ${Math.round((expense / income) * 100)}% of income.`,
      });
    }

    return out.slice(0, 5);
  }, [txs, lastTxs, goals]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="glass-card border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" /> AI Financial Insights
          </CardTitle>
          <CardDescription>Highlights generated from your actual transactions and goals.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {insights.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add a few transactions and a goal to unlock personalized insights.</p>
          ) : insights.map(i => {
            const Icon = i.icon;
            const tone = i.tone === 'positive' ? 'text-success' : i.tone === 'warning' ? 'text-destructive' : 'text-primary';
            return (
              <div key={i.id} className="flex items-start gap-3 rounded-lg border border-border bg-card/40 p-3">
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${tone}`} />
                <p className="text-sm leading-snug">{i.text}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
};
