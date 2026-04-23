import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/AppLayout';
import { useTransactions, useInvestmentProfile } from '@/hooks/useFinance';
import { Skeleton } from '@/components/ui/skeleton';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Shield, TrendingUp, Flame, Target, Wallet, PiggyBank, LineChart as LineChartIcon, Home, Briefcase, AlertTriangle } from 'lucide-react';

const riskIcons = { low: Shield, medium: TrendingUp, high: Flame };
const riskLabels = { low: 'Conservative', medium: 'Moderate Growth', high: 'Aggressive Growth' };
const riskColors = { low: 'text-success', medium: 'text-info', high: 'text-destructive' };
const riskDescriptions = {
  low: 'Focus on capital preservation with stable, low-volatility instruments. Ideal for short-term goals and risk-averse investors.',
  medium: 'Balanced approach with a mix of equity and debt. Good for medium-term goals with moderate risk tolerance.',
  high: 'Growth-oriented strategy with higher equity exposure. Best for long-term goals and investors comfortable with market volatility.',
};

const allocations: Record<string, { name: string; value: number; color: string }[]> = {
  low: [
    { name: 'Index Mutual Funds', value: 40, color: '#10b981' },
    { name: 'Fixed Deposits', value: 25, color: '#3b82f6' },
    { name: 'Gold ETF', value: 15, color: '#eab308' },
    { name: 'Liquid Funds', value: 10, color: '#8b5cf6' },
    { name: 'Emergency Fund', value: 10, color: '#6b7280' },
  ],
  medium: [
    { name: 'Index Mutual Funds', value: 40, color: '#10b981' },
    { name: 'Large Cap Stocks', value: 25, color: '#3b82f6' },
    { name: 'Gold ETF', value: 10, color: '#eab308' },
    { name: 'Emergency Fund', value: 15, color: '#6b7280' },
    { name: 'Liquid Funds', value: 10, color: '#8b5cf6' },
  ],
  high: [
    { name: 'Equity / Stocks', value: 50, color: '#ef4444' },
    { name: 'Flexi Cap Funds', value: 25, color: '#f97316' },
    { name: 'Gold ETF', value: 5, color: '#eab308' },
    { name: 'Emergency Fund', value: 10, color: '#6b7280' },
    { name: 'Liquid Funds', value: 10, color: '#8b5cf6' },
  ],
};

const sipPlans: Record<string, { name: string; amount: number }[]> = {
  low: [
    { name: 'Nifty 50 Index Fund', amount: 0.4 },
    { name: 'Bank FD / RD', amount: 0.25 },
    { name: 'Gold ETF', amount: 0.15 },
    { name: 'Liquid Fund', amount: 0.2 },
  ],
  medium: [
    { name: 'Nifty 50 Index Fund', amount: 0.4 },
    { name: 'Large Cap Fund', amount: 0.25 },
    { name: 'Gold ETF', amount: 0.1 },
    { name: 'Liquid Fund', amount: 0.25 },
  ],
  high: [
    { name: 'Flexi Cap Fund', amount: 0.35 },
    { name: 'Mid-Cap Fund', amount: 0.3 },
    { name: 'Small Cap Fund', amount: 0.2 },
    { name: 'Gold ETF', amount: 0.15 },
  ],
};

const formatINR = (v: number) => {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString('en-IN')}`;
};

const getProjection = (monthlyAmount: number) => {
  const rate = 0.12 / 12;
  const points = [1, 3, 5, 10, 15, 20];
  return points.map(years => {
    const months = years * 12;
    const fv = monthlyAmount * ((Math.pow(1 + rate, months) - 1) / rate) * (1 + rate);
    return { year: `${years}Y`, value: Math.round(fv), invested: monthlyAmount * months };
  });
};

const goalExamples = [
  { name: 'Emergency Fund', icon: AlertTriangle, target: 300000, color: 'text-warning' },
  { name: 'House Down Payment', icon: Home, target: 1000000, color: 'text-info' },
  { name: 'Retirement Corpus', icon: Briefcase, target: 10000000, color: 'text-primary' },
];

const Invest = () => {
  const now = new Date();
  const { data: txs = [], isLoading } = useTransactions(
    format(startOfMonth(now), 'yyyy-MM-dd'),
    format(endOfMonth(now), 'yyyy-MM-dd')
  );
  const { data: investProfile } = useInvestmentProfile();

  const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  const aiRisk = useMemo(() => {
    if (savingsRate > 40) return 'high';
    if (savingsRate > 15) return 'medium';
    return 'low';
  }, [savingsRate]);

  const risk = (investProfile?.risk_level as 'low' | 'medium' | 'high') || aiRisk;
  const RiskIcon = riskIcons[risk];
  const recommendedInvestment = Math.max(0, Math.round(totalIncome * 0.25));
  const investAmount = investProfile?.monthly_investment_amount || recommendedInvestment;
  const currentAllocation = allocations[risk];
  const currentSIPs = sipPlans[risk];
  const projection = getProjection(investAmount);

  // Diversification score (0-100)
  const diversificationScore = currentAllocation.length >= 5 ? 85 : currentAllocation.length >= 3 ? 65 : 40;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Invest</h1>
          <p className="text-muted-foreground text-sm">AI-driven investment planning</p>
        </div>

        {/* Investment Capacity */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Monthly Income', value: totalIncome, icon: Wallet, gradient: 'gradient-income' },
            { label: 'Monthly Expenses', value: totalExpense, icon: TrendingUp, gradient: 'gradient-expense' },
            { label: 'Recommended SIP', value: recommendedInvestment, icon: PiggyBank, gradient: 'gradient-primary' },
          ].map(({ label, value, icon: Icon, gradient }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className={`${gradient} text-primary-foreground border-0`}>
                <CardContent className="p-3 md:p-4">
                  <Icon className="h-5 w-5 opacity-50 mb-1" />
                  <p className="text-[10px] md:text-xs opacity-80">{label}</p>
                  <p className="font-heading text-lg md:text-xl font-bold">{formatINR(value)}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* AI Risk Profile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-card">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center shrink-0">
                  <RiskIcon className={`h-7 w-7 ${riskColors[risk]}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-heading text-lg font-bold">AI Risk Profile</p>
                    <Badge variant="outline" className={riskColors[risk]}>{riskLabels[risk]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{riskDescriptions[risk]}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Based on your {savingsRate.toFixed(0)}% savings rate and spending behavior
                  </p>
                </div>
              </div>
              {/* Diversification */}
              <div className="mt-4 p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                <span className="text-sm font-medium">Diversification Score</span>
                <Badge variant="outline" className={diversificationScore >= 70 ? 'text-success border-success/30' : 'text-warning border-warning/30'}>
                  {diversificationScore}/100
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
          {/* Recommended Portfolio */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="glass-card h-full">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" /> Recommended Portfolio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={currentAllocation} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40}>
                        {currentAllocation.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `${v}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2">
                  {currentAllocation.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{item.value}%</span>
                        {investAmount > 0 && (
                          <span className="text-muted-foreground ml-2 text-xs">
                            (₹{Math.round(investAmount * item.value / 100).toLocaleString('en-IN')}/mo)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Suggested SIP Plan */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="glass-card h-full">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <LineChartIcon className="h-4 w-4 text-primary" /> Suggested SIP Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentSIPs.map((sip) => {
                  const sipAmount = Math.round(investAmount * sip.amount);
                  return (
                    <div key={sip.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <span className="text-sm font-medium">{sip.name}</span>
                      <span className="font-heading font-bold text-primary">₹{sipAmount.toLocaleString('en-IN')}/mo</span>
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Total Monthly SIP</span>
                  <span className="font-heading text-lg font-bold text-primary">₹{investAmount.toLocaleString('en-IN')}/mo</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Goal-Based Investing */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg">Goal-Based Investing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-3">
                {goalExamples.map(goal => {
                  const monthsToGoal = investAmount > 0 ? Math.ceil(goal.target / investAmount) : 0;
                  return (
                    <div key={goal.name} className="p-4 rounded-lg border border-border text-center">
                      <goal.icon className={`h-6 w-6 mx-auto mb-2 ${goal.color}`} />
                      <p className="text-sm font-medium">{goal.name}</p>
                      <p className="font-heading text-lg font-bold mt-1">{formatINR(goal.target)}</p>
                      {investAmount > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">~{monthsToGoal} months</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Investment Projection */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg">
                Wealth Projection (₹{investAmount.toLocaleString('en-IN')}/mo at 12% p.a.)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projection}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatINR(v)} />
                    <Tooltip
                      formatter={(v: number, name: string) => [formatINR(v), name === 'value' ? 'Total Value' : 'Invested']}
                    />
                    <Area type="monotone" dataKey="invested" stackId="1" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted))" name="Invested" />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" name="Total Value" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[projection[2], projection[3], projection[5]].map(p => (
                  <div key={p.year} className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">{p.year}</p>
                    <p className="font-heading text-lg font-bold text-primary">{formatINR(p.value)}</p>
                    <p className="text-[10px] text-muted-foreground">invested {formatINR(p.invested)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Invest;
