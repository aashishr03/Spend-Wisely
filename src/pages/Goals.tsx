import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AppLayout } from '@/components/AppLayout';
import { Target, Plus, Trash2, Award, GraduationCap, Laptop, Briefcase, Home as HomeIcon, Shield, Plane, CheckCircle2 } from 'lucide-react';
import { useGoals, useAddGoal, useUpdateGoal, useDeleteGoal, useChallenges } from '@/hooks/useGoals';
import { useProfile, useTransactions } from '@/hooks/useFinance';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { toast } from 'sonner';

const formatINR = (v: number) => `₹${Math.abs(Math.round(v)).toLocaleString('en-IN')}`;

const UNIVERSAL_PRESETS = [
  { name: 'Emergency Fund', icon_key: 'shield', target_amount: 50000, category: 'emergency' },
  { name: 'Vacation', icon_key: 'plane', target_amount: 40000, category: 'travel' },
  { name: 'New Laptop', icon_key: 'laptop', target_amount: 60000, category: 'device' },
  { name: 'Higher Studies', icon_key: 'graduationcap', target_amount: 200000, category: 'education' },
  { name: 'New Vehicle', icon_key: 'briefcase', target_amount: 100000, category: 'vehicle' },
  { name: 'Home Down Payment', icon_key: 'home', target_amount: 500000, category: 'home' },
  { name: 'Retirement Fund', icon_key: 'award', target_amount: 500000, category: 'retirement' },
];

// Re-order presets to surface what fits the user's primary goal first.
const presetsForGoal = (goal?: string | null) => {
  const order: Record<string, string[]> = {
    save_more:         ['Emergency Fund', 'Vacation', 'New Laptop', 'New Vehicle', 'Higher Studies', 'Home Down Payment', 'Retirement Fund'],
    control_spending:  ['Emergency Fund', 'Vacation', 'New Laptop', 'Higher Studies', 'New Vehicle', 'Home Down Payment', 'Retirement Fund'],
    start_investing:   ['Emergency Fund', 'Retirement Fund', 'Home Down Payment', 'New Vehicle', 'Higher Studies', 'New Laptop', 'Vacation'],
    build_wealth:      ['Retirement Fund', 'Home Down Payment', 'Emergency Fund', 'New Vehicle', 'Higher Studies', 'New Laptop', 'Vacation'],
  };
  const ranked = order[goal || ''] || UNIVERSAL_PRESETS.map(p => p.name);
  return ranked
    .map(n => UNIVERSAL_PRESETS.find(p => p.name === n))
    .filter(Boolean) as typeof UNIVERSAL_PRESETS;
};

const iconFor = (k?: string) => {
  switch (k) {
    case 'award': return Award;
    case 'briefcase': return Briefcase;
    case 'laptop': return Laptop;
    case 'graduationcap': return GraduationCap;
    case 'shield': return Shield;
    case 'home': return HomeIcon;
    case 'plane': return Plane;
    default: return Target;
  }
};

const GoalsPage = () => {
  const { data: profile } = useProfile();
  const { data: goals = [] } = useGoals();
  const { data: challenges = [] } = useChallenges();
  const addGoal = useAddGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const presets = presetsForGoal((profile as any)?.primary_goal);

  // Estimate completion: monthly average savings → months remaining
  const now = new Date();
  const { data: txs3 = [] } = useTransactions(
    format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-dd'),
    format(endOfMonth(now), 'yyyy-MM-dd'),
  );
  const monthlySavings = useMemo(() => {
    const inc = txs3.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const exp = txs3.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    return Math.max(0, (inc - exp) / 3);
  }, [txs3]);

  const active = goals.filter(g => Number(g.saved_amount) < Number(g.target_amount));
  const completed = goals.filter(g => Number(g.saved_amount) >= Number(g.target_amount));

  const [openCustom, setOpenCustom] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const handlePreset = async (p: typeof STUDENT_PRESETS[number]) => {
    if (goals.some(g => g.name === p.name)) {
      toast.info('Goal already exists');
      return;
    }
    await addGoal.mutateAsync(p);
    toast.success(`Created: ${p.name}`);
  };

  const handleCreate = async () => {
    const t = Number(target);
    if (!name.trim() || !t || t <= 0) return toast.error('Enter a name and target');
    await addGoal.mutateAsync({ name: name.trim(), target_amount: t, target_date: targetDate || null });
    setName(''); setTarget(''); setTargetDate(''); setOpenCustom(false);
    toast.success('Goal created');
  };

  const renderGoalCard = (g: any) => {
    const saved = Number(g.saved_amount);
    const targetAmt = Number(g.target_amount);
    const pct = targetAmt > 0 ? Math.min(100, (saved / targetAmt) * 100) : 0;
    const remaining = Math.max(0, targetAmt - saved);
    const Icon = iconFor(g.icon_key);
    const monthsLeft = monthlySavings > 0 ? Math.ceil(remaining / monthlySavings) : null;
    const done = saved >= targetAmt;
    // Monthly contribution suggestion: hit goal in 12 months (or by target_date if set)
    let suggestedMonths = 12;
    if (g.target_date) {
      const months = Math.max(1, Math.round((new Date(g.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)));
      suggestedMonths = months;
    }
    const suggestedMonthly = Math.ceil(remaining / suggestedMonths);
    const quickAmounts = profile?.student_mode ? [200, 500, 1000] : [1000, 2500, 5000];

    return (
      <Card key={g.id} className="glass-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{g.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatINR(saved)} of {formatINR(targetAmt)}
                </p>
              </div>
            </div>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteGoal.mutate(g.id)}>
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium">{Math.round(pct)}% complete</span>
              {done ? (
                <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Done
                </Badge>
              ) : monthsLeft !== null ? (
                <span className="text-muted-foreground">
                  ~{monthsLeft} mo at current pace
                </span>
              ) : (
                <span className="text-muted-foreground">Add income to estimate</span>
              )}
            </div>
            <Progress value={pct} className="h-1.5" />
          </div>
          {!done && (
            <>
              {/* Target date • Current pace • Expected finish */}
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="rounded-md bg-muted/30 p-2">
                  <p className="text-muted-foreground">Target date</p>
                  <p className="font-semibold text-foreground">
                    {g.target_date ? format(new Date(g.target_date), 'MMM yyyy') : '—'}
                  </p>
                </div>
                <div className="rounded-md bg-muted/30 p-2">
                  <p className="text-muted-foreground">Current pace</p>
                  <p className="font-semibold text-foreground">
                    {monthlySavings > 0 ? `${formatINR(monthlySavings)}/mo` : '—'}
                  </p>
                </div>
                <div className="rounded-md bg-muted/30 p-2">
                  <p className="text-muted-foreground">Expected finish</p>
                  <p className="font-semibold text-foreground">
                    {monthsLeft !== null
                      ? format(new Date(now.getFullYear(), now.getMonth() + monthsLeft, 1), 'MMM yyyy')
                      : '—'}
                  </p>
                </div>
              </div>
              <div className="rounded-md bg-muted/40 px-2.5 py-1.5 text-xs">
                <span className="text-muted-foreground">Suggested contribution: </span>
                <span className="font-semibold text-foreground">{formatINR(suggestedMonthly)}/mo</span>
                <span className="text-muted-foreground"> to finish in ~{suggestedMonths} mo</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {quickAmounts.map(q => (
                  <Button key={q} size="sm" variant="outline" className="h-7 text-xs"
                    onClick={() => updateGoal.mutate({ id: g.id, saved_amount: saved + q })}>
                    +{formatINR(q)}
                  </Button>
                ))}
                <Input
                  type="number" placeholder="Custom ₹" className="h-7 text-xs flex-1 min-w-[90px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const v = Number((e.target as HTMLInputElement).value);
                      if (v > 0) {
                        updateGoal.mutate({ id: g.id, saved_amount: saved + v });
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" /> Goals
            </h1>
            <p className="text-sm text-muted-foreground">
              {profile?.student_mode ? 'Student savings goals & weekly challenges.' : 'Long-term savings goals & weekly challenges.'}
            </p>
          </div>
          <Dialog open={openCustom} onOpenChange={setOpenCustom}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary">
                <Plus className="h-4 w-4 mr-1" /> New Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create a custom goal</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Goal name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. New bike" />
                </div>
                <div className="space-y-1">
                  <Label>Target amount (₹)</Label>
                  <Input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="50000" />
                </div>
                <div className="space-y-1">
                  <Label>Target date <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} className="gradient-primary w-full">Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Weekly challenges strip */}
        {challenges.filter(c => c.status === 'active').length > 0 && (
          <Card className="glass-card border-success/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Weekly Challenges</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {challenges.filter(c => c.status === 'active').map(c => (
                <Badge key={c.id} variant="outline" className="text-success border-success/30">
                  {c.title} — {formatINR(Number(c.saved_amount))}/{formatINR(Number(c.target_savings))}
                </Badge>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Presets */}
        {goals.length === 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Start with a {profile?.student_mode ? 'student' : 'professional'} preset</CardTitle>
              <CardDescription>One-tap to create a goal sized for your persona.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {presets.map(p => {
                const Icon = iconFor(p.icon_key);
                return (
                  <button key={p.name} onClick={() => handlePreset(p)}
                    className="flex items-center gap-3 rounded-lg border border-border p-3 text-left hover:bg-muted/40 transition">
                    <Icon className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">Target {formatINR(p.target_amount)}</p>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Active / Completed */}
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="space-y-3 mt-4">
            {active.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No active goals yet — pick a preset above.</p>
            ) : (
              <motion.div className="grid md:grid-cols-2 gap-3"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {active.map(renderGoalCard)}
              </motion.div>
            )}
          </TabsContent>
          <TabsContent value="completed" className="space-y-3 mt-4">
            {completed.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No completed goals yet — keep saving!</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">{completed.map(renderGoalCard)}</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default GoalsPage;
