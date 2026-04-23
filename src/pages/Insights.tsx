import { useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { SmartInsights } from '@/components/SmartInsights';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactions } from '@/hooks/useFinance';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Shield } from 'lucide-react';

const formatINR = (v: number) => `₹${Math.abs(v).toLocaleString('en-IN')}`;

const Insights = () => {
  const now = new Date();
  const { data: txs = [] } = useTransactions(
    format(startOfMonth(now), 'yyyy-MM-dd'),
    format(endOfMonth(now), 'yyyy-MM-dd')
  );

  const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const monthlySavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((monthlySavings) / totalIncome) * 100 : 0;

  const projections = useMemo(() => {
    if (monthlySavings <= 0) return null;
    return [
      { period: '6 months', amount: monthlySavings * 6 },
      { period: '1 year', amount: monthlySavings * 12 },
      { period: '3 years', amount: monthlySavings * 36 },
    ];
  }, [monthlySavings]);

  const emergencyMonths = totalExpense > 0 ? Math.floor(monthlySavings * 6 / totalExpense) : 0;

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Insights</h1>
          <p className="text-muted-foreground text-sm">AI-powered financial analysis</p>
        </div>

        <SmartInsights />

        {/* Savings Projection */}
        {projections && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" /> Savings Projection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  At your current savings rate of {savingsRate.toFixed(0)}% ({formatINR(monthlySavings)}/month):
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {projections.map(p => (
                    <div key={p.period} className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">{p.period}</p>
                      <p className="font-heading text-lg font-bold text-primary">{formatINR(p.amount)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Emergency Fund Insight */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-info" /> Emergency Fund Insight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Recommended emergency fund: <strong>3–6 months</strong> of expenses ({formatINR(totalExpense * 3)} – {formatINR(totalExpense * 6)}).
              </p>
              {totalExpense > 0 && monthlySavings > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  At your current savings rate, you can build a 3-month emergency fund in <strong>{Math.ceil((totalExpense * 3) / monthlySavings)} months</strong>.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Insights;
