import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { Plus, Trash2, Download, Receipt } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useTransactions, useDeleteTransaction } from '@/hooks/useFinance';
import { downloadReportPDF } from '@/lib/generateReport';

type Filter = 'today' | 'month' | 'all';

const Transactions = () => {
  const now = new Date();
  const [filter, setFilter] = useState<Filter>('month');
  const dateFrom = filter === 'today' ? format(startOfDay(now), 'yyyy-MM-dd')
    : filter === 'month' ? format(startOfMonth(now), 'yyyy-MM-dd') : undefined;
  const dateTo = filter === 'today' ? format(endOfDay(now), 'yyyy-MM-dd')
    : filter === 'month' ? format(endOfMonth(now), 'yyyy-MM-dd') : undefined;

  const { data: txs = [], isLoading } = useTransactions(dateFrom, dateTo);
  const del = useDeleteTransaction();

  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  const grouped = useMemo(() => {
    const m = new Map<string, typeof txs>();
    txs.forEach(t => {
      if (!m.has(t.date)) m.set(t.date, []);
      m.get(t.date)!.push(t);
    });
    return Array.from(m.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [txs]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
              <Receipt className="h-6 w-6 text-primary" /> Transactions
            </h1>
            <p className="text-sm text-muted-foreground">All your income and expenses in one place.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadReportPDF({
              transactions: txs, totalIncome: income, totalExpense: expense,
              dateFrom: dateFrom || '', dateTo: dateTo || '',
            })} disabled={txs.length === 0}>
              <Download className="h-4 w-4 mr-1" /> PDF
            </Button>
            <Button asChild size="sm" className="gradient-primary">
              <Link to="/add-transaction"><Plus className="h-4 w-4 mr-1" /> Add</Link>
            </Button>
          </div>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-2 gap-3">
          <Card className="glass-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Income</p>
              <p className="font-heading text-xl font-bold text-success">+₹{income.toLocaleString('en-IN')}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Expenses</p>
              <p className="font-heading text-xl font-bold text-destructive">-₹{expense.toLocaleString('en-IN')}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card">
          <CardHeader><CardTitle className="font-heading text-lg">Transaction history</CardTitle></CardHeader>
          <CardContent className="space-y-4 max-h-[60vh] overflow-auto">
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
            ) : grouped.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-muted-foreground">No transactions yet.</p>
                <Button asChild size="sm" className="mt-3 gradient-primary"><Link to="/add-transaction">Add your first</Link></Button>
              </div>
            ) : grouped.map(([date, list]) => (
              <motion.div key={date} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  {format(new Date(date + 'T00:00:00'), 'EEEE, MMM d, yyyy')}
                </p>
                <div className="space-y-2">
                  {list.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/40">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: (tx.categories?.color || '#888') + '20' }}>
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: tx.categories?.color || '#888' }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{tx.description || tx.categories?.name}</p>
                          <p className="text-xs text-muted-foreground">{tx.categories?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn('font-heading font-semibold text-sm', tx.type === 'income' ? 'text-success' : 'text-destructive')}>
                          {tx.type === 'income' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                        </span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
                              <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => del.mutate(tx.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Transactions;
