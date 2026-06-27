import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#3b82f6'];
const formatINR = (v: number) => `₹${Math.abs(Math.round(v)).toLocaleString('en-IN')}`;

type Tx = {
  type: string;
  amount: number | string;
  description?: string | null;
  categories?: { name?: string | null; color?: string | null } | null;
};

export const SpendingAnalytics = ({ txs }: { txs: Tx[] }) => {
  const { data, total, top, largest, avg } = useMemo(() => {
    const expenses = txs.filter(t => t.type === 'expense');
    const map = new Map<string, { name: string; value: number; color: string }>();
    let largestTx = { amount: 0, name: '', category: '' };

    expenses.forEach((t, idx) => {
      const name = t.categories?.name || 'Others';
      const existing = map.get(name);
      const color = t.categories?.color || PALETTE[idx % PALETTE.length];
      if (existing) {
        existing.value += Number(t.amount);
      } else {
        map.set(name, { name, value: Number(t.amount), color });
      }
      if (Number(t.amount) > largestTx.amount) {
        largestTx = { amount: Number(t.amount), name: t.description || name, category: name };
      }
    });

    const arr = Array.from(map.values()).sort((a, b) => b.value - a.value);
    const totalSpent = arr.reduce((s, c) => s + c.value, 0);
    const topCat = arr[0];
    const avgExpense = expenses.length ? totalSpent / expenses.length : 0;

    return { data: arr, total: totalSpent, top: topCat, largest: largestTx, avg: avgExpense };
  }, [txs]);

  if (data.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <PieIcon className="h-5 w-5 text-primary" /> Spending Analytics
          </CardTitle>
          <CardDescription>Where your money goes — updates automatically with every transaction.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={45}
                  paddingAngle={2}
                  label={({ percent }: any) => `${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((d, i) => <Cell key={d.name} fill={d.color || PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip
                  formatter={(v: any, _n: any, p: any) => {
                    const pct = total > 0 ? ((Number(v) / total) * 100).toFixed(1) : '0';
                    return [`${formatINR(Number(v))} (${pct}%)`, p.payload.name];
                  }}
                />
                <Legend verticalAlign="bottom" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-border bg-card/40 p-3">
              <p className="text-[11px] text-muted-foreground">Top Category</p>
              <p className="text-sm font-heading font-semibold truncate">{top?.name || '—'}</p>
              <p className="text-xs text-muted-foreground">{top ? formatINR(top.value) : ''}</p>
            </div>
            <div className="rounded-lg border border-border bg-card/40 p-3">
              <p className="text-[11px] text-muted-foreground">Total Categories</p>
              <p className="text-sm font-heading font-semibold">{data.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card/40 p-3">
              <p className="text-[11px] text-muted-foreground">Largest Expense</p>
              <p className="text-sm font-heading font-semibold truncate">{formatINR(largest.amount)}</p>
              <p className="text-xs text-muted-foreground truncate">{largest.name}</p>
            </div>
            <div className="rounded-lg border border-border bg-card/40 p-3">
              <p className="text-[11px] text-muted-foreground">Average Expense</p>
              <p className="text-sm font-heading font-semibold">{formatINR(avg)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
