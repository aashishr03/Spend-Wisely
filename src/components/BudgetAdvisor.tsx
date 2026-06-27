import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Brain, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

const formatINR = (v: number) => `₹${Math.abs(Math.round(v)).toLocaleString('en-IN')}`;

type Tx = { type: string; amount: number | string; category_id?: string | null; categories?: { name?: string | null } | null };
type Budget = {
  category_id: string;
  monthly_limit: number | string;
  categories?: { name?: string | null } | null;
};

interface Props {
  budgets: Budget[];
  txs: Tx[];
  lastTxs: Tx[];
}

type Tip = { id: string; tone: 'warning' | 'positive' | 'neutral'; text: string };

export const BudgetAdvisor = ({ budgets, txs, lastTxs }: Props) => {
  const tips = useMemo<Tip[]>(() => {
    const out: Tip[] = [];

    const spentByCat = new Map<string, number>();
    txs.filter(t => t.type === 'expense').forEach(t => {
      if (!t.category_id) return;
      spentByCat.set(t.category_id, (spentByCat.get(t.category_id) || 0) + Number(t.amount));
    });

    const lastSpentByCat = new Map<string, number>();
    lastTxs.filter(t => t.type === 'expense').forEach(t => {
      if (!t.category_id) return;
      lastSpentByCat.set(t.category_id, (lastSpentByCat.get(t.category_id) || 0) + Number(t.amount));
    });

    budgets.forEach(b => {
      const name = b.categories?.name || 'Category';
      const limit = Number(b.monthly_limit);
      const spent = spentByCat.get(b.category_id) || 0;
      const pct = limit > 0 ? (spent / limit) * 100 : 0;
      const remaining = limit - spent;

      if (pct >= 100) {
        out.push({
          id: `over-${b.category_id}`, tone: 'warning',
          text: `You're over your ${name} budget by ${formatINR(spent - limit)} (spent ${formatINR(spent)} of ${formatINR(limit)}).`,
        });
      } else if (pct >= 80) {
        out.push({
          id: `near-${b.category_id}`, tone: 'warning',
          text: `You've already spent ${Math.round(pct)}% of your ${name} budget — only ${formatINR(remaining)} left.`,
        });
      } else if (pct < 50 && remaining > 0) {
        out.push({
          id: `safe-${b.category_id}`, tone: 'positive',
          text: `${name} is on track — you can safely spend another ${formatINR(remaining)} this month.`,
        });
      }

      const lastSpent = lastSpentByCat.get(b.category_id) || 0;
      if (lastSpent > 0 && spent > lastSpent * 1.2) {
        out.push({
          id: `up-${b.category_id}`, tone: 'warning',
          text: `${name} spending is increasing compared to last month (+${formatINR(spent - lastSpent)}).`,
        });
      }
    });

    // Overall budget vs spending
    const totalLimit = budgets.reduce((s, b) => s + Number(b.monthly_limit), 0);
    const totalCovered = budgets.reduce((s, b) => s + (spentByCat.get(b.category_id) || 0), 0);
    if (totalLimit > 0) {
      const left = totalLimit - totalCovered;
      if (left > 0) {
        out.push({
          id: 'overall-left', tone: 'neutral',
          text: `Across all your budgets, you have ${formatINR(left)} remaining for the rest of this month.`,
        });
      }
    }

    return out.slice(0, 6);
  }, [budgets, txs, lastTxs]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="glass-card border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" /> AI Budget Advisor
          </CardTitle>
          <CardDescription>Recommendations generated from your live budget usage and transaction history.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {tips.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add budgets and a few transactions to receive personalized advice.</p>
          ) : tips.map(t => {
            const Icon = t.tone === 'warning' ? AlertTriangle : t.tone === 'positive' ? CheckCircle2 : TrendingUp;
            const color = t.tone === 'warning' ? 'text-destructive' : t.tone === 'positive' ? 'text-success' : 'text-primary';
            return (
              <div key={t.id} className="flex items-start gap-3 rounded-lg border border-border bg-card/40 p-3">
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
                <p className="text-sm leading-snug">{t.text}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
};
