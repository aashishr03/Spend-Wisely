import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Briefcase, ChevronRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [step, setStep] = useState<0 | 1>(0);
  const [persona, setPersona] = useState<'student' | 'professional' | null>(null);
  const [age, setAge] = useState('');
  const [income, setIncome] = useState('');
  const [risk, setRisk] = useState([3]);
  const [experience, setExperience] = useState<'none' | 'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [horizon, setHorizon] = useState<'short' | 'medium' | 'long'>('medium');
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    if (!persona) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        student_mode: persona === 'student',
        onboarding_completed: true,
        persona_age: age ? Number(age) : null,
        monthly_income: income ? Number(income) : null,
        risk_appetite: risk[0],
        investment_experience: experience,
        goal_horizon: horizon,
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Sparkles className="h-3 w-3" />
              Step {step + 1} of 2
            </div>
            <CardTitle className="font-heading text-2xl">
              {step === 0 ? 'Who are you?' : 'A few quick basics'}
            </CardTitle>
            <CardDescription>
              {step === 0
                ? 'This personalizes every screen — goals, budgets, AI coaching.'
                : 'Helps your Coach give context-aware suggestions. You can change these later.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {step === 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([
                    { v: 'student', icon: GraduationCap, label: 'Student', desc: 'Pocket money, certifications, placement prep.' },
                    { v: 'professional', icon: Briefcase, label: 'Working Professional', desc: 'Emergency fund, investments, retirement.' },
                  ] as const).map(({ v, icon: Icon, label, desc }) => (
                    <button
                      key={v} onClick={() => setPersona(v)}
                      className={cn(
                        'rounded-xl border p-4 text-left transition',
                        persona === v ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'
                      )}
                    >
                      <Icon className={cn('h-6 w-6 mb-2', persona === v ? 'text-primary' : 'text-muted-foreground')} />
                      <p className="font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                    </button>
                  ))}
                </div>
                <Button
                  className="w-full gradient-primary" disabled={!persona}
                  onClick={() => setStep(1)}
                >
                  Continue <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Age</Label>
                    <Input type="number" placeholder="22" value={age} onChange={e => setAge(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Monthly income (₹)</Label>
                    <Input type="number" placeholder={persona === 'student' ? '5000' : '60000'} value={income} onChange={e => setIncome(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Risk appetite</Label>
                    <span className="text-xs text-muted-foreground">
                      {['Very low', 'Low', 'Balanced', 'High', 'Very high'][risk[0] - 1]}
                    </span>
                  </div>
                  <Slider min={1} max={5} step={1} value={risk} onValueChange={setRisk} />
                </div>

                <div className="space-y-2">
                  <Label>Investment experience</Label>
                  <RadioGroup value={experience} onValueChange={(v: any) => setExperience(v)} className="grid grid-cols-2 gap-2">
                    {[
                      { v: 'none', l: 'None' },
                      { v: 'beginner', l: 'Beginner' },
                      { v: 'intermediate', l: 'Intermediate' },
                      { v: 'advanced', l: 'Advanced' },
                    ].map(o => (
                      <label key={o.v} className={cn(
                        'flex items-center gap-2 rounded-lg border p-2 cursor-pointer text-sm',
                        experience === o.v ? 'border-primary bg-primary/5' : 'border-border'
                      )}>
                        <RadioGroupItem value={o.v} /> {o.l}
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Primary goal horizon</Label>
                  <RadioGroup value={horizon} onValueChange={(v: any) => setHorizon(v)} className="grid grid-cols-3 gap-2">
                    {[
                      { v: 'short', l: '< 2 yrs' },
                      { v: 'medium', l: '2–5 yrs' },
                      { v: 'long', l: '5+ yrs' },
                    ].map(o => (
                      <label key={o.v} className={cn(
                        'flex items-center gap-2 rounded-lg border p-2 cursor-pointer text-sm justify-center',
                        horizon === o.v ? 'border-primary bg-primary/5' : 'border-border'
                      )}>
                        <RadioGroupItem value={o.v} className="sr-only" /> {o.l}
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(0)} className="flex-1">Back</Button>
                  <Button className="gradient-primary flex-1" onClick={finish} disabled={saving}>
                    {saving ? 'Saving…' : 'Finish Setup'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Onboarding;
