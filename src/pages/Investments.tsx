import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLayout } from '@/components/AppLayout';
import { useProfile, useInvestmentProfile, useUpsertInvestmentProfile } from '@/hooks/useFinance';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Shield, TrendingUp, Flame, Sparkles, RotateCcw, Info } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

type Risk = 'low' | 'medium' | 'high';

const riskMeta: Record<Risk, { label: string; icon: any; color: string; rationale: string }> = {
  low:    { label: 'Conservative',   icon: Shield,     color: 'text-success',     rationale: 'Lower risk, preserves capital — fits short horizons or beginners.' },
  medium: { label: 'Moderate',       icon: TrendingUp, color: 'text-info',        rationale: 'Balanced growth + safety — fits medium horizons.' },
  high:   { label: 'Growth-Oriented',icon: Flame,      color: 'text-destructive', rationale: 'Higher volatility for higher long-term returns — fits long horizons.' },
};

const allocations: Record<Risk, { name: string; pct: number; color: string; why: string }[]> = {
  low: [
    { name: 'Index Fund SIP',    pct: 40, color: '#10b981', why: 'Broad market exposure with low fees.' },
    { name: 'Recurring Deposit', pct: 30, color: '#3b82f6', why: 'Predictable, capital-safe returns.' },
    { name: 'Gold ETF',          pct: 15, color: '#eab308', why: 'Inflation hedge & diversifier.' },
    { name: 'Liquid Fund',       pct: 15, color: '#8b5cf6', why: 'Emergency liquidity, beats savings rates.' },
  ],
  medium: [
    { name: 'Index Fund SIP',    pct: 50, color: '#10b981', why: 'Core equity exposure for medium horizon.' },
    { name: 'Recurring Deposit', pct: 20, color: '#3b82f6', why: 'Stabilizes overall portfolio.' },
    { name: 'Gold ETF',          pct: 10, color: '#eab308', why: 'Diversification across asset classes.' },
    { name: 'Liquid Fund',       pct: 20, color: '#8b5cf6', why: 'Short-term needs & rebalancing buffer.' },
  ],
  high: [
    { name: 'Index Fund SIP',    pct: 60, color: '#10b981', why: 'Equity drives long-term compounding.' },
    { name: 'Diversified Equity',pct: 25, color: '#f97316', why: 'Adds breadth beyond the index.' },
    { name: 'Gold ETF',          pct: 5,  color: '#eab308', why: 'Small hedge against equity drawdowns.' },
    { name: 'Liquid Fund',       pct: 10, color: '#8b5cf6', why: 'Keeps rebalancing optionality.' },
  ],
};

const formatINR = (v: number) => `₹${Math.abs(Math.round(v)).toLocaleString('en-IN')}`;

function deriveRisk(args: { risk_appetite?: number | null; horizon?: string | null; experience?: string | null }): Risk {
  const { risk_appetite, horizon, experience } = args;
  let score = 0;
  if (risk_appetite) score += risk_appetite;
  if (horizon === 'long') score += 2;
  else if (horizon === 'medium') score += 1;
  if (experience === 'advanced') score += 2;
  else if (experience === 'intermediate') score += 1;
  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

const SOURCE_LABEL: Record<string, string> = {
  salary: 'Salary',
  pocket_money: 'Pocket Money',
  freelancing: 'Freelancing',
  business: 'Business',
  scholarship: 'Scholarship',
  multiple: 'Multiple Sources',
  prefer_not_say: 'Not specified',
};

const Investments = () => {
  const { data: profile } = useProfile();
  const { data: invest } = useInvestmentProfile();
  const upsert = useUpsertInvestmentProfile();

  const profileComplete = !!(profile?.risk_appetite && profile?.goal_horizon);
  const risk: Risk = useMemo(() => {
    if (invest?.risk_level) return invest.risk_level as Risk;
    if (!profileComplete) return 'medium';
    return deriveRisk({
      risk_appetite: profile?.risk_appetite,
      horizon: profile?.goal_horizon,
      experience: profile?.investment_experience,
    });
  }, [invest, profile, profileComplete]);

  const moneyReceived = profile?.monthly_income ? Number(profile.monthly_income) : 0;
  // Default suggestion: 20% of money received, otherwise nothing pre-filled.
  const suggestedFromIncome = moneyReceived > 0 ? Math.round(moneyReceived * 0.20) : 0;
  const [comfortable, setComfortable] = useState<string>(
    invest?.monthly_investment_amount ? String(invest.monthly_investment_amount) : ''
  );
  useEffect(() => {
    if (invest?.monthly_investment_amount && !comfortable) {
      setComfortable(String(invest.monthly_investment_amount));
    }
  }, [invest, comfortable]);

  const monthly = Number(comfortable) > 0
    ? Number(comfortable)
    : invest?.monthly_investment_amount
      ? Number(invest.monthly_investment_amount)
      : suggestedFromIncome;

  const meta = riskMeta[risk];
  const alloc = allocations[risk];

  if (!profileComplete) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-2xl pt-8">
          <Card className="glass-card text-center">
            <CardHeader>
              <CardTitle className="font-heading">Complete your investment profile</CardTitle>
              <CardDescription>We won't assign you a risk profile without your input.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Finish the quick questionnaire to get personalized allocations with clear explanations.
              </p>
              <Button asChild className="gradient-primary">
                <Link to="/onboarding">Start Questionnaire</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const saveAllocation = async () => {
    const amt = Number(comfortable);
    if (!amt || amt <= 0) {
      toast.error('Enter a comfortable monthly amount first');
      return;
    }
    await upsert.mutateAsync({ risk_level: risk, monthly_investment_amount: amt, goals: profile?.goal_horizon || 'medium' });
    toast.success('Allocation saved');
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" /> Investments
            </h1>
            <p className="text-sm text-muted-foreground">
              Allocation derived from your questionnaire — every percentage has a reason.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/onboarding"><RotateCcw className="h-3.5 w-3.5 mr-1" /> Re-take questionnaire</Link>
          </Button>
        </div>

        {/* Profile snapshot — universal fields */}
        <Card className="glass-card">
          <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Monthly Money Received</p>
              <p className="font-medium">
                {moneyReceived > 0 ? formatINR(moneyReceived) : <span className="text-muted-foreground">Not provided</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Risk Appetite</p>
              <p className="font-medium">{profile?.risk_appetite ?? '—'}/5</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Investment Experience</p>
              <p className="font-medium capitalize">{profile?.investment_experience ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Goal Horizon</p>
              <p className="font-medium capitalize">{profile?.goal_horizon ?? '—'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Risk + rationale */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center shrink-0">
                <meta.icon className={`h-7 w-7 ${meta.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-heading text-lg font-bold">Your Risk Profile</p>
                  <Badge variant="outline" className={meta.color}>{meta.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-medium text-foreground/80">Why:</span> {meta.rationale}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on: risk appetite <b>{profile?.risk_appetite}/5</b>, <b>{profile?.investment_experience}</b> experience,
                  {' '}<b>{profile?.goal_horizon}</b> horizon.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Suggested monthly investment */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Suggested Monthly Investment</CardTitle>
            <CardDescription>
              {moneyReceived > 0
                ? `Based on ${formatINR(moneyReceived)}/mo received, investing 10–30% is a healthy range.`
                : 'You didn\'t share monthly money received — tell us a comfortable amount you can invest each month.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {moneyReceived > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {[0.10, 0.20, 0.30].map(pct => {
                  const amt = Math.round(moneyReceived * pct);
                  return (
                    <button key={pct} onClick={() => setComfortable(String(amt))}
                      className="rounded-lg border border-border p-3 text-left hover:border-primary/40 hover:bg-primary/5 transition">
                      <p className="text-xs text-muted-foreground">{Math.round(pct * 100)}%</p>
                      <p className="font-semibold">{formatINR(amt)}/mo</p>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">How much can you comfortably invest every month? (₹)</Label>
              <div className="flex gap-2">
                <Input type="number" value={comfortable} onChange={e => setComfortable(e.target.value)}
                  placeholder={moneyReceived > 0 ? String(suggestedFromIncome) : 'e.g. 2000'} />
                <Button onClick={saveAllocation} className="gradient-primary">
                  <Sparkles className="h-3.5 w-3.5 mr-1" /> Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Future value projection */}
        {monthly > 0 && (() => {
          const horizonYears = profile?.goal_horizon === 'short' ? 2 : profile?.goal_horizon === 'long' ? 10 : 5;
          const annualReturn = risk === 'low' ? 0.07 : risk === 'medium' ? 0.10 : 0.12;
          const months = horizonYears * 12;
          const r = annualReturn / 12;
          const futureValue = monthly * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
          const invested = monthly * months;
          const gains = futureValue - invested;
          return (
            <Card className="glass-card">
              <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Monthly Investment</p>
                  <p className="font-heading text-lg font-bold">{formatINR(monthly)}</p>
                  <p className="text-[11px] text-muted-foreground">your chosen amount</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Horizon</p>
                  <p className="font-heading text-lg font-bold">{horizonYears} yrs</p>
                  <p className="text-[11px] text-muted-foreground">from your goal horizon</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">You'd Invest</p>
                  <p className="font-heading text-lg font-bold">{formatINR(invested)}</p>
                  <p className="text-[11px] text-muted-foreground">{months} monthly contributions</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estimated Value</p>
                  <p className="font-heading text-lg font-bold text-success">{formatINR(futureValue)}</p>
                  <p className="text-[11px] text-muted-foreground">+{formatINR(gains)} at ~{Math.round(annualReturn*100)}%/yr (illustrative)</p>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Allocation w/ why */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg">How your money should be distributed</CardTitle>
              <CardDescription>Plain-English allocation for {meta.label.toLowerCase()} investors.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={alloc} dataKey="pct" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40}>
                      {alloc.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg">Why each allocation</CardTitle>
              <CardDescription>
                {monthly > 0 ? `Suggested monthly contribution: ${formatINR(monthly)}` : 'Enter a comfortable amount above to see ₹ splits.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="space-y-2">
                  {alloc.map(a => (
                    <div key={a.name} className="rounded-lg border border-border p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: a.color }} />
                          <span className="text-sm font-medium">{a.name}</span>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[220px] text-xs">{a.why}</TooltipContent>
                          </UITooltip>
                        </div>
                        <span className="text-sm font-semibold">
                          {a.pct}%{monthly > 0 ? ` · ${formatINR(monthly * a.pct / 100)}` : ''}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80">Why:</span> {a.why}
                      </p>
                    </div>
                  ))}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </div>

        {/* Expected Risk / Return / Tips */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-info" /> Expected Risk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-lg font-bold">
                {risk === 'low' ? 'Low' : risk === 'medium' ? 'Moderate' : 'High'}
              </p>
              <p className="text-xs text-muted-foreground">
                {risk === 'low'
                  ? 'Small drawdowns (5–10%) possible. Capital protection prioritized.'
                  : risk === 'medium'
                  ? 'Moderate swings (10–20%) expected. Balanced equity + safety.'
                  : 'Larger swings (20–35%) possible. Higher long-term potential.'}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" /> Expected Return
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-lg font-bold text-success">
                ~{risk === 'low' ? '7' : risk === 'medium' ? '10' : '12'}% / year
              </p>
              <p className="text-xs text-muted-foreground">
                Historical long-term averages for this allocation. Not guaranteed — markets fluctuate.
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Investment Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• Start small, automate monthly contributions.</li>
                <li>• Don't react to short-term news — stay invested.</li>
                <li>• Rebalance once a year to keep your allocation on target.</li>
                <li>• Build a 3–6 month emergency fund before investing aggressively.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Investments;
