import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Brain, TrendingUp, AlertTriangle, Sparkles, Target, Trophy,
  Rocket, PiggyBank, LineChart as LineChartIcon, Loader2, ChevronRight,
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMentor } from '@/hooks/useMentor';
import { useProfile } from '@/hooks/useFinance';

const formatINR = (v: number) =>
  `₹${Math.abs(Math.round(v)).toLocaleString('en-IN')}`;

const scoreColor = (score: number) =>
  score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-primary' : score >= 40 ? 'text-amber-500' : 'text-destructive';

const MentorPage = () => {
  const { data: profile } = useProfile();
  const { data, isLoading, error, refetch, isFetching } = useMentor();

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
            <p className="text-sm text-muted-foreground">
              {profile?.student_mode ? 'Student Mode • ' : ''}AI-powered coaching for your money
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
                  {data.recommendations.slice(0, 2).map((r, i) => (
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
                {data.categoryPredictions.slice(0, 6).map(c => {
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

        {/* Challenges */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-success" /> Weekly Savings Challenges
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {data.challenges.map(c => (
                <div key={c.title} className="rounded-lg border border-border bg-card/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{c.title}</h4>
                    <Badge variant="secondary">Save {formatINR(c.savings)}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                </div>
              ))}
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
              <SimTile title="Invest @ 12% p.a." sub="Compounded monthly" s={data.simulations.invest} tone="good" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Student-only insights */}
        {profile?.student_mode && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="glass-card border-primary/30">
              <CardHeader>
                <CardTitle className="font-heading text-lg">🎓 Student Insights</CardTitle>
                <CardDescription>Pocket money, certifications, and semester planning</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StudentTile label="Pocket Money Used" value={formatINR(data.expense)} />
                <StudentTile label="Cert Savings Pace" value={formatINR((data.projectedSavings > 0 ? data.projectedSavings : 0) * 0.3)} />
                <StudentTile label="Semester Fee Fund" value={formatINR((data.projectedSavings > 0 ? data.projectedSavings : 0) * 6)} sub="6-mo projection" />
                <StudentTile label="Placement Prep Fund" value={formatINR((data.projectedSavings > 0 ? data.projectedSavings : 0) * 12)} sub="1-yr projection" />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </AppLayout>
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

const StudentTile = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="rounded-lg border border-border bg-card/50 p-3">
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="mt-1 text-lg font-bold">{value}</div>
    {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
  </div>
);

export default MentorPage;
