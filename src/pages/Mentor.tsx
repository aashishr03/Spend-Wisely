import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Brain, TrendingUp, AlertTriangle, Sparkles, Target, Trophy,
  Rocket, PiggyBank, LineChart as LineChartIcon, Loader2, ChevronRight,
  CheckCircle2, Play, Plus, GraduationCap, Award, Laptop, BookOpen, Briefcase, Trash2,
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useMentor } from '@/hooks/useMentor';
import { useProfile } from '@/hooks/useFinance';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const formatINR = (v: number) =>
  `₹${Math.abs(Math.round(v)).toLocaleString('en-IN')}`;

const scoreColor = (score: number) =>
  score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-primary' : score >= 40 ? 'text-amber-500' : 'text-destructive';

// ---------- Hooks ----------
const useChallenges = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['mentor-challenges', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentor_challenges').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};
const useGoals = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['savings-goals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('savings_goals').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

const GOAL_PRESETS = [
  { name: 'AWS Certification Fund', icon_key: 'award', target_amount: 15000, category: 'certification' },
  { name: 'Placement Preparation Fund', icon_key: 'briefcase', target_amount: 25000, category: 'placement' },
  { name: 'Laptop Upgrade Fund', icon_key: 'laptop', target_amount: 60000, category: 'device' },
  { name: 'Higher Studies Fund', icon_key: 'graduationcap', target_amount: 200000, category: 'education' },
];

const iconFor = (key: string) => {
  switch (key) {
    case 'award': return Award;
    case 'briefcase': return Briefcase;
    case 'laptop': return Laptop;
    case 'graduationcap': return GraduationCap;
    case 'book': return BookOpen;
    default: return Target;
  }
};

const MentorPage = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const { data, isLoading, error, refetch, isFetching } = useMentor();
  const { data: challenges = [] } = useChallenges();
  const { data: goals = [] } = useGoals();

  const startChallenge = useMutation({
    mutationFn: async (c: { title: string; description: string; target_savings: number }) => {
      const { error } = await supabase.from('mentor_challenges').insert({
        user_id: user!.id, title: c.title, description: c.description, target_savings: c.target_savings,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mentor-challenges'] }); toast({ title: 'Challenge started 🚀' }); },
  });

  const updateChallenge = useMutation({
    mutationFn: async ({ id, saved_amount, complete }: { id: string; saved_amount?: number; complete?: boolean }) => {
      const patch: any = {};
      if (saved_amount !== undefined) patch.saved_amount = saved_amount;
      if (complete) { patch.status = 'completed'; patch.completed_at = new Date().toISOString(); }
      const { error } = await supabase.from('mentor_challenges').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mentor-challenges'] }),
  });

  const deleteChallenge = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mentor_challenges').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mentor-challenges'] }),
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout>
        <Card className="glass-card">
          <CardContent className="p-8 text-center space-y-3">
            <Brain className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Couldn't load mentor insights. Add a few transactions and try again.</p>
            <Button onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" /> Financial Mentor
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              
              Predicts future spending behaviour and generates preventive financial guidance using your transaction patterns and scenario simulation.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>

        {/* Health score */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card overflow-hidden">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-warning" /> Financial Health Score
              </CardTitle>
              <CardDescription>Composite of savings rate, budget adherence, and consistency.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative h-32 w-32 shrink-0">
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted/30" />
                    <circle
                      cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="8" fill="none"
                      strokeDasharray={`${(data.score / 100) * 276.46} 276.46`}
                      className={scoreColor(data.score)} strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold ${scoreColor(data.score)}`}>{data.score}</span>
                    <span className="text-xs text-muted-foreground">/ 100</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2 text-center md:text-left">
                  <Badge variant="outline" className={scoreColor(data.score)}>{data.status}</Badge>
                  <p className="text-sm text-muted-foreground">
                    Savings rate <span className="font-medium text-foreground">{data.savingsRate.toFixed(1)}%</span> •
                    Spending change <span className="font-medium text-foreground">{data.growth > 0 ? '+' : ''}{data.growth.toFixed(1)}%</span>
                  </p>
                  {data.recommendations.slice(0, 2).map((r: string, i: number) => (
                    <p key={i} className="text-sm flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 mt-0.5 text-primary shrink-0" /> {r}
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Predictions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Next-Month Predictions
              </CardTitle>
              <CardDescription>Projected from your daily spending pace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatTile label="Projected Expense" value={formatINR(data.projectedMonthExpense)} icon={LineChartIcon} />
                <StatTile label="Projected Savings" value={formatINR(data.projectedSavings)} icon={PiggyBank} tone={data.projectedSavings >= 0 ? 'good' : 'bad'} />
                <StatTile label="Income" value={formatINR(data.income)} icon={TrendingUp} />
              </div>

              <div className="space-y-2 pt-2">
                {data.categoryPredictions.slice(0, 6).map((c: any) => {
                  const pct = c.limit ? Math.min(100, (c.projected / c.limit) * 100) : 50;
                  const over = c.limit && c.projected > c.limit;
                  return (
                    <div key={c.category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{c.category}</span>
                        <span className={over ? 'text-destructive' : 'text-muted-foreground'}>
                          {formatINR(c.projected)} {c.limit ? `/ ${formatINR(c.limit)}` : ''}
                          {over && ` (over by ${formatINR(c.overBy)})`}
                        </span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })}
                {data.categoryPredictions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No expenses yet this month. <Link to="/add-transaction" className="text-primary underline">Add one</Link>.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Narrative */}
        {data.mentorNarrative && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="glass-card border-primary/30">
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> AI Mentor Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.mentorNarrative}</div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Challenges with tracking */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-success" /> Weekly Savings Challenges
              </CardTitle>
              <CardDescription>Start a challenge and track your progress.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Suggested (not yet started) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {data.challenges.map((c: any) => {
                  const active = challenges.find(ch => ch.title === c.title && ch.status === 'active');
                  const done = challenges.find(ch => ch.title === c.title && ch.status === 'completed');
                  return (
                    <div key={c.title} className="rounded-lg border border-border bg-card/50 p-4 space-y-2 flex flex-col">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{c.title}</h4>
                        <Badge variant="secondary">Save {formatINR(c.savings)}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex-1">{c.description}</p>
                      {done ? (
                        <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 w-fit">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
                        </Badge>
                      ) : active ? (
                        <Badge variant="outline" className="w-fit">In progress</Badge>
                      ) : (
                        <Button size="sm" variant="outline" className="w-fit"
                          onClick={() => startChallenge.mutate({ title: c.title, description: c.description, target_savings: c.savings })}>
                          <Play className="h-3 w-3 mr-1" /> Start Challenge
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Active tracked challenges */}
              {challenges.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <h4 className="text-sm font-medium text-muted-foreground">My Challenges</h4>
                  {challenges.map(ch => {
                    const pct = ch.target_savings > 0 ? Math.min(100, (Number(ch.saved_amount) / Number(ch.target_savings)) * 100) : 0;
                    const isDone = ch.status === 'completed';
                    return (
                      <div key={ch.id} className="rounded-lg border border-border bg-card/50 p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{ch.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatINR(Number(ch.saved_amount))} / {formatINR(Number(ch.target_savings))} • {Math.round(pct)}%
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {isDone ? (
                              <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Done
                              </Badge>
                            ) : (
                              <>
                                <Input type="number" placeholder="+₹" className="h-8 w-20"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const v = Number((e.target as HTMLInputElement).value);
                                      if (v > 0) {
                                        updateChallenge.mutate({ id: ch.id, saved_amount: Number(ch.saved_amount) + v });
                                        (e.target as HTMLInputElement).value = '';
                                      }
                                    }
                                  }}
                                />
                                <Button size="sm" variant="ghost" onClick={() => updateChallenge.mutate({ id: ch.id, complete: true, saved_amount: Number(ch.target_savings) })}>
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => deleteChallenge.mutate(ch.id)}>
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Future Simulation */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" /> Future Financial Simulation
              </CardTitle>
              <CardDescription>Projected outcomes over 6 months & 1 year.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SimTile title="Current Habits" sub="If you keep spending exactly as today" s={data.simulations.current} tone="default" />
              <SimTile title="If Spending +20%" sub="Lifestyle creep scenario" s={data.simulations.increase20} tone="warn" icon={AlertTriangle} />
              <SimTile title="Save ₹100/day" sub="Daily discipline habit" s={data.simulations.save100Daily} tone="good" />
              <SimTile title="Compound @ 12% p.a." sub="Compounded monthly" s={data.simulations.invest} tone="good" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Placement / Savings Goals */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <SavingsGoalsCard goals={goals} presets={GOAL_PRESETS} />
        </motion.div>
      </div>
    </AppLayout>
  );
};

// ---------- Savings Goals Card ----------
const SavingsGoalsCard = ({ goals, presets }: { goals: any[]; presets: typeof GOAL_PRESETS }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', target_amount: 0, icon_key: 'target', category: 'placement' });

  const createGoal = useMutation({
    mutationFn: async (g: any) => {
      const { error } = await supabase.from('savings_goals').insert({ ...g, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['savings-goals'] }); toast({ title: 'Goal added 🎯' }); setOpen(false); },
  });
  const updateGoal = useMutation({
    mutationFn: async ({ id, saved_amount }: { id: string; saved_amount: number }) => {
      const { error } = await supabase.from('savings_goals').update({ saved_amount }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['savings-goals'] }),
  });
  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('savings_goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['savings-goals'] }),
  });

  return (
    <Card className="glass-card border-primary/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" /> Placement & Student Savings Goals
          </CardTitle>
          <CardDescription>Save toward certifications, placements, devices, and higher studies.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Goal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Savings Goal</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Quick Presets</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {presets.map(p => (
                    <Button key={p.name} variant="outline" size="sm" className="justify-start"
                      onClick={() => setForm({ name: p.name, target_amount: p.target_amount, icon_key: p.icon_key, category: p.category })}>
                      {p.name}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="g-name">Name</Label>
                <Input id="g-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="g-target">Target Amount (₹)</Label>
                <Input id="g-target" type="number" value={form.target_amount || ''} onChange={e => setForm({ ...form, target_amount: Number(e.target.value) })} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => createGoal.mutate(form)} disabled={!form.name || form.target_amount <= 0}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {presets.map(p => {
              const Icon = iconFor(p.icon_key);
              return (
                <button key={p.name} onClick={() => createGoal.mutate({ ...p, saved_amount: 0 })}
                  className="rounded-lg border border-dashed border-border bg-card/30 p-4 text-left hover:bg-card/60 transition">
                  <Icon className="h-5 w-5 text-primary mb-2" />
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">Target {formatINR(p.target_amount)}</div>
                  <div className="text-[10px] text-primary mt-2">+ Start saving</div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {goals.map(g => {
              const Icon = iconFor(g.icon_key);
              const pct = g.target_amount > 0 ? Math.min(100, (Number(g.saved_amount) / Number(g.target_amount)) * 100) : 0;
              return (
                <div key={g.id} className="rounded-lg border border-border bg-card/50 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="h-5 w-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{g.name}</div>
                        <div className="text-xs text-muted-foreground">{formatINR(Number(g.saved_amount))} / {formatINR(Number(g.target_amount))}</div>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => deleteGoal.mutate(g.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{Math.round(pct)}% complete</span>
                    <Input type="number" placeholder="+₹ saved"
                      className="h-8 w-28"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const v = Number((e.target as HTMLInputElement).value);
                          if (v > 0) {
                            updateGoal.mutate({ id: g.id, saved_amount: Number(g.saved_amount) + v });
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const StatTile = ({ label, value, icon: Icon, tone = 'default' }: { label: string; value: string; icon: any; tone?: 'default' | 'good' | 'bad' }) => (
  <div className="rounded-lg border border-border bg-card/50 p-4">
    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
    <div className={`mt-1 text-xl font-bold ${tone === 'good' ? 'text-emerald-500' : tone === 'bad' ? 'text-destructive' : ''}`}>{value}</div>
  </div>
);

const SimTile = ({ title, sub, s, tone, icon: Icon }: { title: string; sub: string; s: { sixMonth: number; oneYear: number }; tone: 'default' | 'good' | 'warn'; icon?: any }) => {
  const accent = tone === 'good' ? 'border-emerald-500/40' : tone === 'warn' ? 'border-amber-500/40' : 'border-border';
  return (
    <div className={`rounded-lg border ${accent} bg-card/50 p-4 space-y-2`}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
        {Icon && <Icon className="h-4 w-4 text-amber-500" />}
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div>
          <div className="text-[10px] uppercase text-muted-foreground">6 months</div>
          <div className="font-semibold">{formatINR(s.sixMonth)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-muted-foreground">1 year</div>
          <div className="font-semibold">{formatINR(s.oneYear)}</div>
        </div>
      </div>
    </div>
  );
};

export default MentorPage;
