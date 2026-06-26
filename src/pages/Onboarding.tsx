import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles, PiggyBank, Wallet, TrendingUp, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useFinance';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type PrimaryGoal = 'save_more' | 'control_spending' | 'start_investing' | 'build_wealth';
type MoneySource = 'salary' | 'pocket_money' | 'freelancing' | 'business' | 'scholarship' | 'multiple' | 'prefer_not_say';
type Experience = 'none' | 'beginner' | 'intermediate' | 'advanced';
type Horizon = 'short' | 'medium' | 'long';

const GOAL_OPTIONS: { v: PrimaryGoal; label: string; desc: string; icon: any }[] = [
  { v: 'save_more', label: 'Save More Money', desc: 'Build a habit of putting money aside.', icon: PiggyBank },
  { v: 'control_spending', label: 'Control Spending', desc: 'Stop leakage and track where money goes.', icon: Wallet },
  { v: 'start_investing', label: 'Start Investing', desc: 'Put money to work with simple allocations.', icon: TrendingUp },
  { v: 'build_wealth', label: 'Build Long-Term Wealth', desc: 'Compound steadily over years.', icon: Trophy },
];

const SOURCE_OPTIONS: { v: MoneySource; label: string }[] = [
  { v: 'salary', label: 'Salary' },
  { v: 'pocket_money', label: 'Pocket Money' },
  { v: 'freelancing', label: 'Freelancing' },
  { v: 'business', label: 'Business' },
  { v: 'scholarship', label: 'Scholarship' },
  { v: 'multiple', label: 'Multiple Sources' },
  { v: 'prefer_not_say', label: 'Prefer not to say' },
];

const Onboarding = () => {
  const { user } = useAuth();
  const { data: existing } = useProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [step, setStep] = useState(0);
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal | null>((existing?.primary_goal as PrimaryGoal) ?? null);
  const [moneySource, setMoneySource] = useState<MoneySource | null>((existing?.money_source as MoneySource) ?? null);
  const [income, setIncome] = useState(existing?.monthly_income ? String(existing.monthly_income) : '');
  const [risk, setRisk] = useState([existing?.risk_appetite ?? 3]);
  const [experience, setExperience] = useState<Experience>((existing?.investment_experience as Experience) ?? 'beginner');
  const [horizon, setHorizon] = useState<Horizon>((existing?.goal_horizon as Horizon) ?? 'medium');
  const [saving, setSaving] = useState(false);

  const totalSteps = 6;

  const canNext = () => {
    if (step === 0) return !!primaryGoal;
    if (step === 1) return !!moneySource;
    return true;
  };

  const finish = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        primary_goal: primaryGoal,
        money_source: moneySource,
        monthly_income: income ? Number(income) : null,
        risk_appetite: risk[0],
        investment_experience: experience,
        goal_horizon: horizon,
        onboarding_completed: true,
      }).eq('id', user!.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['profile'] });
      toast.success('All set! Welcome to Spend Wisely AI 🎉');
      navigate('/home');
    } catch (e: any) {
      toast.error(e.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const titles = [
    'What is your primary financial goal?',
    'How do you usually receive money?',
    'Monthly money received',
    'Risk appetite',
    'Investment experience',
    'Primary goal horizon',
  ];

  const descs = [
    'This shapes your dashboard, goals and AI coaching.',
    'Helps tailor suggestions to how money actually arrives.',
    'Optional — leave blank if it varies month to month.',
    'How much volatility are you comfortable with?',
    'So recommendations match your comfort level.',
    'When do you want to reach this goal?',
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Sparkles className="h-3 w-3" />
              Step {step + 1} of {totalSteps}
            </div>
            <CardTitle className="font-heading text-2xl">{titles[step]}</CardTitle>
            <CardDescription>{descs[step]}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {step === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GOAL_OPTIONS.map(({ v, label, desc, icon: Icon }) => (
                  <button key={v} onClick={() => setPrimaryGoal(v)} className={cn(
                    'rounded-xl border p-4 text-left transition',
                    primaryGoal === v ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'
                  )}>
                    <Icon className={cn('h-5 w-5 mb-2', primaryGoal === v ? 'text-primary' : 'text-muted-foreground')} />
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                  </button>
                ))}
              </div>
            )}

            {step === 1 && (
              <RadioGroup value={moneySource ?? ''} onValueChange={(v: any) => setMoneySource(v)} className="grid grid-cols-2 gap-2">
                {SOURCE_OPTIONS.map(o => (
                  <label key={o.v} className={cn(
                    'flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer text-sm',
                    moneySource === o.v ? 'border-primary bg-primary/5' : 'border-border'
                  )}>
                    <RadioGroupItem value={o.v} /> {o.label}
                  </label>
                ))}
              </RadioGroup>
            )}

            {step === 2 && (
              <div className="space-y-2">
                <Label>Monthly money received (₹) <span className="text-muted-foreground text-xs">— optional</span></Label>
                <Input type="number" placeholder="e.g. 25000 (skip if it varies)" value={income} onChange={e => setIncome(e.target.value)} />
                <p className="text-xs text-muted-foreground">
                  We use this only to suggest savings and investment amounts. You can skip it and set a comfortable amount later.
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { v: 2, l: 'Low', d: 'Protect capital' },
                    { v: 3, l: 'Medium', d: 'Balanced' },
                    { v: 5, l: 'High', d: 'Grow aggressively' },
                  ] as const).map(o => (
                    <button key={o.v} onClick={() => setRisk([o.v])} className={cn(
                      'rounded-lg border p-3 text-left',
                      risk[0] === o.v ? 'border-primary bg-primary/5' : 'border-border'
                    )}>
                      <p className="font-medium text-sm">{o.l}</p>
                      <p className="text-[11px] text-muted-foreground">{o.d}</p>
                    </button>
                  ))}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Fine-tune (1–5)</Label>
                    <span className="text-xs text-muted-foreground">{risk[0]}/5</span>
                  </div>
                  <Slider min={1} max={5} step={1} value={risk} onValueChange={setRisk} />
                </div>
              </div>
            )}

            {step === 4 && (
              <RadioGroup value={experience} onValueChange={(v: any) => setExperience(v)} className="grid grid-cols-2 gap-2">
                {[
                  { v: 'none', l: 'None' },
                  { v: 'beginner', l: 'Beginner' },
                  { v: 'intermediate', l: 'Intermediate' },
                  { v: 'advanced', l: 'Advanced' },
                ].map(o => (
                  <label key={o.v} className={cn(
                    'flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer text-sm',
                    experience === o.v ? 'border-primary bg-primary/5' : 'border-border'
                  )}>
                    <RadioGroupItem value={o.v} /> {o.l}
                  </label>
                ))}
              </RadioGroup>
            )}

            {step === 5 && (
              <RadioGroup value={horizon} onValueChange={(v: any) => setHorizon(v)} className="grid grid-cols-3 gap-2">
                {[
                  { v: 'short', l: '< 2 years' },
                  { v: 'medium', l: '2–5 years' },
                  { v: 'long', l: '5+ years' },
                ].map(o => (
                  <label key={o.v} className={cn(
                    'flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer text-sm justify-center',
                    horizon === o.v ? 'border-primary bg-primary/5' : 'border-border'
                  )}>
                    <RadioGroupItem value={o.v} className="sr-only" /> {o.l}
                  </label>
                ))}
              </RadioGroup>
            )}

            <div className="flex gap-2 pt-2">
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              )}
              {step < totalSteps - 1 ? (
                <Button className="gradient-primary flex-1" disabled={!canNext()} onClick={() => setStep(s => s + 1)}>
                  Continue <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button className="gradient-primary flex-1" onClick={finish} disabled={saving}>
                  {saving ? 'Saving…' : 'Finish Setup'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Onboarding;
