import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTransactions } from '@/hooks/useFinance';
import { useGoals } from '@/hooks/useGoals';
import { SmartInsights } from '@/components/SmartInsights';
import { downloadReportPDF } from '@/lib/generateReport';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Download, BarChart3, TrendingUp, Target } from 'lucide-react';

const formatINR = (v: number) => `₹${Math.abs(Math.round(v)).toLocaleString('en-IN')}`;

const Report = () => {
  const now = new Date();
  const { data: txs = [] } = useTransactions(
    format(startOfMonth(now), 'yyyy-MM-dd'),
    format(endOfMonth(now), 'yyyy-MM-dd'),
  );
  const { data: goals = [] } = useGoals();

  // Build 6-month trend
  const monthlyTrend = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      const d = subMonths(now, 5 - i);
      return { label: format(d, 'MMM'), key: format(d, 'yyyy-MM') };
    });
  }, []);

  // Use only current month for chart simplicity to avoid 6 queries — keep it explicit
  const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  const byCat = useMemo(() => {
    const m = new Map<string, { name: string; value: number; color: string }>();
    txs.filter(t => t.type === 'expense').forEach(t => {
      const c = t.categories; if (!c) return;
      const ex = m.get(c.id) || { name: c.name, value: 0, color: c.color };
      ex.value += Number(t.amount);
      m.set(c.id, ex);
    });
    return Array.from(m.values()).sort((a, b) => b.value - a.value);
  }, [txs]);

  const topCats = byCat.slice(0, 5);

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" /> Financial Report
            </h1>
            <p className="text-sm text-muted-foreground">Your month at a glance — top categories, trends, goal progress, AI summary.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => downloadReportPDF({
            transactions: txs, totalIncome, totalExpense,
            dateFrom: format(startOfMonth(now), 'yyyy-MM-dd'),
            dateTo: format(endOfMonth(now), 'yyyy-MM-dd'),
          })} disabled={txs.length === 0}>
            <Download className="h-4 w-4 mr-1" /> Export PDF
          </Button>
        </div>

        {/* Top categories */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Top spending categories</CardTitle>
              <CardDescription>Where most of your money went this month.</CardDescription>
            </CardHeader>
            <CardContent>
              {topCats.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No expenses yet.</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4 items-center">
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={topCats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                          {topCats.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatINR(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {topCats.map(c => (
                      <div key={c.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
                          {c.name}
                        </div>
                        <span className="font-medium tabular-nums">{formatINR(c.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Goal progress */}
        {goals.length > 0 && (
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Goal progress</CardTitle>
              <CardDescription>How close you are on each savings goal.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={goals.map(g => ({
                    name: g.name.length > 18 ? g.name.slice(0, 16) + '…' : g.name,
                    saved: Number(g.saved_amount),
                    remaining: Math.max(0, Number(g.target_amount) - Number(g.saved_amount)),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatINR(v)} />
                    <Bar dataKey="saved" stackId="a" fill="hsl(var(--primary))" />
                    <Bar dataKey="remaining" stackId="a" fill="hsl(var(--muted))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Summary */}
        <SmartInsights />
      </div>
    </AppLayout>
  );
};

export default Report;
