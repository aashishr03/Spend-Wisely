import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AppLayout } from '@/components/AppLayout';
import { useCategories, useBudgets, useUpsertBudget, useTransactions } from '@/hooks/useFinance';
import { BudgetAdvisor } from '@/components/BudgetAdvisor';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

const Budgets = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { data: categories = [] } = useCategories();
  const { data: budgets = [], isLoading } = useBudgets(month, year);
  const { data: transactions = [] } = useTransactions(
    format(startOfMonth(now), 'yyyy-MM-dd'),
    format(endOfMonth(now), 'yyyy-MM-dd')
  );
  const lastMonthDate = subMonths(now, 1);
  const { data: lastTransactions = [] } = useTransactions(
    format(startOfMonth(lastMonthDate), 'yyyy-MM-dd'),
    format(endOfMonth(lastMonthDate), 'yyyy-MM-dd')
  );
  const upsertBudget = useUpsertBudget();

  const [showAdd, setShowAdd] = useState(false);
  const [selectedCat, setSelectedCat] = useState('');
  const [limit, setLimit] = useState('');

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const getSpent = (categoryId: string) =>
    transactions
      .filter((t) => t.type === 'expense' && t.category_id === categoryId)
      .reduce((sum, t) => sum + Number(t.amount), 0);

  const handleAdd = async () => {
    if (!selectedCat || !limit) return;
    try {
      await upsertBudget.mutateAsync({
        category_id: selectedCat,
        monthly_limit: parseFloat(limit),
        month,
        year,
      });
      toast.success('Budget saved!');
      setShowAdd(false);
      setSelectedCat('');
      setLimit('');
    } catch {
      toast.error('Failed to save budget');
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">Budgets</h1>
            <p className="text-muted-foreground text-sm">{format(now, 'MMMM yyyy')}</p>
          </div>
          <Button className="gradient-primary" onClick={() => setShowAdd(true)}>Add Budget</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : budgets.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No budgets set for this month. Create one to start tracking!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {budgets.map((budget, i) => {
              const spent = getSpent(budget.category_id);
              const remaining = Number(budget.monthly_limit) - spent;
              const pct = Math.min((spent / Number(budget.monthly_limit)) * 100, 100);
              const overspent = remaining < 0;

              return (
                <motion.div key={budget.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="glass-card-hover">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: budget.categories?.color }} />
                          <span className="font-medium text-sm">{budget.categories?.name}</span>
                        </div>
                        {overspent && (
                          <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                            Overspent
                          </span>
                        )}
                      </div>
                      <Progress
                        value={pct}
                        className={cn('h-2', overspent && '[&>div]:bg-destructive')}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>₹{spent.toLocaleString('en-IN')} spent</span>
                        <span>₹{Number(budget.monthly_limit).toLocaleString('en-IN')} limit</span>
                      </div>
                      <p className={cn('text-sm font-heading font-semibold', overspent ? 'text-destructive' : 'text-success')}>
                        {overspent ? `-₹${Math.abs(remaining).toLocaleString('en-IN')} over` : `₹${remaining.toLocaleString('en-IN')} remaining`}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Set Monthly Budget</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={selectedCat} onValueChange={setSelectedCat}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monthly Limit (₹)</Label>
                <Input type="number" placeholder="5000" value={limit} onChange={(e) => setLimit(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button className="gradient-primary" onClick={handleAdd} disabled={upsertBudget.isPending}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Budgets;
