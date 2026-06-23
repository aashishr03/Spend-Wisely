import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths } from 'date-fns';
import {
  TrendingUp, TrendingDown, PiggyBank, Plus, Trash2, Wallet, BarChart3, ArrowUpRight, ArrowDownRight, Download,
} from 'lucide-react';
import { downloadReportPDF } from '@/lib/generateReport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/AppLayout';
import { MentorPredictionsCard } from '@/components/MentorPredictionsCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useTransactions, useDeleteTransaction, useAccounts } from '@/hooks/useFinance';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';

type DateFilter = 'today' | 'month' | 'custom';

const formatINR = (value: number) => {
  return `₹${Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const formatPctChange = (current: number, previous: number): string => {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  const change = ((current - previous) / previous) * 100;
  return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
};

const Dashboard = () => {
  const [filter, setFilter] = useState<DateFilter>('month');
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  const now = new Date();
  const dateFrom = useMemo(() => {
    if (filter === 'today') return format(startOfDay(now), 'yyyy-MM-dd');
    if (filter === 'month') return format(startOfMonth(now), 'yyyy-MM-dd');
    if (filter === 'custom' && customFrom) return format(customFrom, 'yyyy-MM-dd');
    return undefined;
  }, [filter, customFrom]);

  const dateTo = useMemo(() => {
    if (filter === 'today') return format(endOfDay(now), 'yyyy-MM-dd');
    if (filter === 'month') return format(endOfMonth(now), 'yyyy-MM-dd');
    if (filter === 'custom' && customTo) return format(customTo, 'yyyy-MM-dd');
    return undefined;
  }, [filter, customTo]);

  const { data: transactions = [], isLoading } = useTransactions(dateFrom, dateTo);
  const { data: accounts = [] } = useAccounts();
  const lastMonthFrom = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');
  const lastMonthTo = format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');
  const { data: lastMonthTxs = [] } = useTransactions(lastMonthFrom, lastMonthTo);

  const deleteTx = useDeleteTransaction();

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  const netCashflow = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
  const netWorth = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  const lastMonthExpense = lastMonthTxs.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  const lastMonthIncome = lastMonthTxs.filter((t) => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, { name: string; value: number; color: string }>();
    transactions.filter((t) => t.type === 'expense').forEach((t) => {
      const cat = t.categories;
      if (!cat) return;
      const existing = map.get(cat.id) || { name: cat.name, value: 0, color: cat.color };
      existing.value += Number(t.amount);
      map.set(cat.id, existing);
    });
    return Array.from(map.values());
  }, [transactions]);

  const spendingTrend = useMemo(() => {
    const map = new Map<string, number>();
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const day = format(new Date(t.date + 'T00:00:00'), 'MMM d');
      map.set(day, (map.get(day) || 0) + Number(t.amount));
    });
    return Array.from(map.entries()).map(([date, amount]) => ({ date, amount })).slice(-14);
  }, [transactions]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, typeof transactions>();
    transactions.forEach((t) => {
      const key = t.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [transactions]);

  const quickStats = [
    { label: 'Net Worth', value: netWorth, icon: Wallet, gradient: 'gradient-hero' },
    { label: 'Income', value: totalIncome, icon: TrendingUp, gradient: 'gradient-income' },
    { label: 'Expenses', value: totalExpense, icon: TrendingDown, gradient: 'gradient-expense' },
    { label: 'Savings Rate', value: savingsRate, icon: PiggyBank, gradient: 'gradient-primary', isSavings: true },
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Your financial overview</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadReportPDF({
                transactions,
                totalIncome,
                totalExpense,
                dateFrom: dateFrom || '',
                dateTo: dateTo || '',
              })}
              disabled={transactions.length === 0}
            >
              <Download className="h-4 w-4 mr-1" /> PDF Report
            </Button>
          </div>
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as DateFilter)}>
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>
        </Tabs>

        {filter === 'custom' && (
          <div className="flex gap-2 flex-wrap">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-[180px] justify-start text-left", !customFrom && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customFrom ? format(customFrom, 'PPP') : 'From'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full sm:w-[180px] justify-start text-left", !customTo && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customTo ? format(customTo, 'PPP') : 'To'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customTo} onSelect={setCustomTo} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[100px] rounded-xl" />
            ))
          ) : (
            quickStats.map(({ label, value, icon: Icon, gradient, isSavings }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card className={`${gradient} text-primary-foreground border-0 overflow-hidden`}>
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm opacity-80 truncate">{label}</p>
                        <p className="font-heading text-lg md:text-2xl font-bold mt-1 truncate">
                          {isSavings ? `${value.toFixed(1)}%` : formatINR(value)}
                        </p>
                      </div>
                      <Icon className="h-6 w-6 md:h-8 md:w-8 opacity-40 shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Monthly Cashflow + Comparison */}
        {filter === 'month' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="glass-card">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Monthly Cashflow</p>
                <p className={cn('font-heading text-xl font-bold mt-1', netCashflow >= 0 ? 'text-success' : 'text-destructive')}>
                  {netCashflow >= 0 ? '+' : '-'}{formatINR(Math.abs(netCashflow))}
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">vs Last Month Spending</p>
                <p className={cn('font-heading text-xl font-bold mt-1', totalExpense <= lastMonthExpense ? 'text-success' : 'text-destructive')}>
                  {formatPctChange(totalExpense, lastMonthExpense)}
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">vs Last Month Income</p>
                <p className={cn('font-heading text-xl font-bold mt-1', totalIncome >= lastMonthIncome ? 'text-success' : 'text-destructive')}>
                  {formatPctChange(totalIncome, lastMonthIncome)}
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Savings Goal (20%)</p>
                <Progress value={Math.min(savingsRate / 20 * 100, 100)} className="h-2 mt-2" />
                <p className="text-xs text-muted-foreground mt-1">{savingsRate.toFixed(1)}% of income saved</p>
              </CardContent>
            </Card>
          </div>
        )}

        <MentorPredictionsCard />

        <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
          {/* Pie Chart */}
          <Card className="glass-card lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Expenses by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expenseByCategory.length > 0 ? (
                <div>
                  <div className="h-[200px] md:h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                          {expenseByCategory.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatINR(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {expenseByCategory.map((e) => (
                      <div key={e.name} className="flex items-center gap-1 text-xs">
                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                        <span className="text-muted-foreground">{e.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground text-sm">No expenses yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Add your first transaction to see the breakdown</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction List */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-heading text-lg">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[400px] overflow-auto">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-lg" />
                  ))}
                </div>
              ) : groupedByDate.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground text-sm">No transactions yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Tap the + button to add your first one!</p>
                </div>
              ) : (
                groupedByDate.map(([date, txs]) => (
                  <div key={date}>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      {format(new Date(date + 'T00:00:00'), 'EEEE, MMM d, yyyy')}
                    </p>
                    <div className="space-y-2">
                      {txs.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{ backgroundColor: tx.categories?.color + '20' }}
                            >
                              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: tx.categories?.color }} />
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
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
                                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteTx.mutate(tx.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Spending Trend */}
        {spendingTrend.length > 1 && (
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg">Spending Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] md:h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={spendingTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip formatter={(v: number) => [formatINR(v), 'Spent']} />
                    <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Floating add button */}
        <Link to="/add-transaction" className="fixed bottom-20 right-4 z-40 md:bottom-8 md:right-8">
          <Button className="h-14 w-14 rounded-full gradient-primary shadow-glow z-50" size="icon">
            <Plus className="h-6 w-6" />
          </Button>
        </Link>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
