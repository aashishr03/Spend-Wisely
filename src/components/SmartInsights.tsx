import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useFinance';
import {
  Heart, TrendingUp, TrendingDown, Lightbulb, PiggyBank, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Target, BarChart3, Sparkles, Lock, RefreshCw,
  ShieldCheck, Wallet, LineChart as LineChartIcon, Zap,
} from 'lucide-react';
import { toast } from 'sonner';

interface Insights {
  healthScore: number;
  healthColor: 'green' | 'yellow' | 'red';
  healthFactors: {
    savingsRate: number;
    expenseControl: number;
    budgetAdherence: number;
    investmentConsistency: number;
  };
  topSpending: { category: string; amount: number; percentOfTotal: number; changeVsLastMonth: number }[];
  mostFrequentExpense: { category: string; count: number };
  biggestExpense: { description: string; amount: number };
  recommendations: { text: string; type: 'saving' | 'investment' | 'warning' | 'positive'; priority: 'high' | 'medium' | 'low' }[];
  savingsOpportunities: { text: string; potentialSaving: number }[];
  monthlyComparison: { incomeChange: number; expenseChange: number; savingsChange: number };
  goalProjection: string | null;
  investmentInsight: string | null;
}

const useInsights = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['finance-insights', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('finance-insights');
      if (error) throw error;
      return data as Insights;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

const healthColorMap = { green: 'text-success', yellow: 'text-warning', red: 'text-destructive' };
const healthBgMap = { green: 'bg-success/10', yellow: 'bg-warning/10', red: 'bg-destructive/10' };
const healthRingMap = { green: 'border-success', yellow: 'border-warning', red: 'border-destructive' };

const recIconMap = { saving: PiggyBank, investment: TrendingUp, warning: AlertTriangle, positive: Sparkles };
const recColorMap = {
  saving: 'bg-success/10 text-success border-success/20',
  investment: 'bg-info/10 text-info border-info/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  positive: 'bg-primary/10 text-primary border-primary/20',
};

const formatINR = (v: number) => `₹${Math.abs(v).toLocaleString('en-IN')}`;

export const SmartInsights = () => {
  const { data: insights, isLoading, error, refetch, isFetching } = useInsights();
  const { data: profile } = useProfile();
  const isPremium = profile?.plan_type === 'premium';

  if (error) {
    return (
      <Card className="glass-card border-destructive/20">
        <CardContent className="p-4 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Failed to load insights.</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
            <RefreshCw className="h-3 w-3 mr-1" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-lg font-bold">Smart Finance Analyzer</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { refetch(); toast.info('Refreshing insights...'); }} disabled={isFetching}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Health Score */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={`glass-card ${healthRingMap[insights.healthColor]} border-2`}>
          <CardContent className="p-5">
            <div className="flex items-center gap-5">
              <div className={`relative h-24 w-24 rounded-full ${healthBgMap[insights.healthColor]} flex items-center justify-center shrink-0`}>
                <div className="text-center">
                  <p className={`font-heading text-3xl font-bold ${healthColorMap[insights.healthColor]}`}>{insights.healthScore}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">/100</p>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-sm font-semibold mb-3">Financial Health Score</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Savings', value: insights.healthFactors.savingsRate, icon: PiggyBank },
                    { label: 'Expenses', value: insights.healthFactors.expenseControl, icon: ShieldCheck },
                    { label: 'Budget', value: insights.healthFactors.budgetAdherence, icon: Wallet },
                    { label: 'Investing', value: insights.healthFactors.investmentConsistency, icon: LineChartIcon },
                  ].map(f => (
                    <div key={f.label} className="flex items-center gap-1.5">
                      <f.icon className="h-3 w-3 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-muted-foreground truncate">{f.label}</span>
                          <span className="text-[10px] font-medium">{f.value}/25</span>
                        </div>
                        <Progress value={(f.value / 25) * 100} className="h-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Spending Analysis */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Top Spending Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.topSpending.map((cat, i) => (
              <div key={cat.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                  <span className="text-sm font-medium truncate">{cat.category}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold">{formatINR(cat.amount)}</span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 ${cat.changeVsLastMonth > 0 ? 'text-destructive border-destructive/30' : 'text-success border-success/30'}`}>
                    {cat.changeVsLastMonth > 0 ? <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" /> : <ArrowDownRight className="h-2.5 w-2.5 mr-0.5" />}
                    {Math.abs(cat.changeVsLastMonth).toFixed(0)}%
                  </Badge>
                </div>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>🔄 Most frequent: <strong>{insights.mostFrequentExpense.category}</strong> ({insights.mostFrequentExpense.count}x)</span>
              <span>💸 Biggest: <strong>{formatINR(insights.biggestExpense.amount)}</strong> ({insights.biggestExpense.description})</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Monthly Comparison */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Monthly Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Income', value: insights.monthlyComparison.incomeChange, icon: TrendingUp },
                { label: 'Expenses', value: insights.monthlyComparison.expenseChange, icon: TrendingDown },
                { label: 'Savings', value: insights.monthlyComparison.savingsChange, icon: PiggyBank },
              ].map(item => {
                const isPositive = item.label === 'Expenses' ? item.value < 0 : item.value > 0;
                return (
                  <div key={item.label} className="text-center p-3 rounded-lg bg-muted/50">
                    <item.icon className={`h-4 w-4 mx-auto mb-1 ${isPositive ? 'text-success' : 'text-destructive'}`} />
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className={`font-heading text-lg font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                      {item.value > 0 ? '↑' : '↓'} {Math.abs(item.value).toFixed(1)}%
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Smart Recommendations */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" /> Smart Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.recommendations.map((rec, i) => {
              const Icon = recIconMap[rec.type] || Sparkles;
              return (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${recColorMap[rec.type]}`}>
                  <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm">{rec.text}</p>
                    <Badge variant="secondary" className="mt-1 text-[9px]">{rec.priority} priority</Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* Savings Opportunities */}
      {insights.savingsOpportunities.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-warning" /> Savings Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {insights.savingsOpportunities.map((opp, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/20">
                  <p className="text-sm flex-1 min-w-0">{opp.text}</p>
                  <Badge className="bg-success/10 text-success border-success/20 shrink-0 ml-2">
                    Save {formatINR(opp.potentialSaving)}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Goal & Investment (Premium) */}
      {(insights.goalProjection || insights.investmentInsight) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-card border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                Premium Insights
                {!isPremium && <Lock className="h-3 w-3 text-muted-foreground" />}
              </CardTitle>
            </CardHeader>
            <CardContent className={!isPremium ? 'relative' : ''}>
              {!isPremium && (
                <div className="absolute inset-0 bg-card/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-b-lg">
                  <div className="text-center p-4">
                    <Lock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium">Upgrade to Premium</p>
                    <p className="text-xs text-muted-foreground">Unlock predictive forecasts & investment advice</p>
                  </div>
                </div>
              )}
              <div className="space-y-3">
                {insights.goalProjection && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm">{insights.goalProjection}</p>
                  </div>
                )}
                {insights.investmentInsight && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-info/5 border border-info/20">
                    <LineChartIcon className="h-4 w-4 text-info mt-0.5 shrink-0" />
                    <p className="text-sm">{insights.investmentInsight}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
