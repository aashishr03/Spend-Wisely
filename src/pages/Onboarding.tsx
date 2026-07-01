import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useFinance';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Minimal onboarding. We only ask for essentials — everything else the AI
 * learns from transactions, budgets, and goals over time.
 */
const Onboarding = () => {
  const { user } = useAuth();
  const { data: existing } = useProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [fullName, setFullName] = useState(existing?.full_name ?? '');
  const [income, setIncome] = useState(existing?.monthly_income ? String(existing.monthly_income) : '');
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    if (!fullName.trim()) {
      toast.error('Please enter your name to continue.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: fullName.trim(),
        monthly_income: income ? Number(income) : null,
        onboarding_completed: true,
      }).eq('id', user!.id);
      if (error) throw error;

      if (goalName.trim() && goalAmount && Number(goalAmount) > 0) {
        await supabase.from('savings_goals').insert({
          user_id: user!.id,
          name: goalName.trim(),
          target_amount: Number(goalAmount),
          saved_amount: 0,
        });
      }

      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['savings_goals'] });
      toast.success(`Welcome, ${fullName.split(' ')[0]} 🎉`);
      navigate('/home');
    } catch (e: any) {
      toast.error(e.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Sparkles className="h-3 w-3 text-primary" /> Quick setup — takes 30 seconds
            </div>
            <CardTitle className="font-heading text-2xl">Welcome to Spend Wisely AI</CardTitle>
            <CardDescription>
              Just the essentials. Your Coach will learn the rest from your activity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Your name <span className="text-destructive">*</span></Label>
              <Input
                id="fullName"
                autoFocus
                placeholder="e.g. Aditi Sharma"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" value="Indian Rupee (₹)" disabled />
              <p className="text-[11px] text-muted-foreground">More currencies coming soon.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="income">
                Monthly income <span className="text-muted-foreground text-xs">— optional</span>
              </Label>
              <Input
                id="income"
                type="number"
                inputMode="numeric"
                placeholder="e.g. 25000 (skip if it varies)"
                value={income}
                onChange={e => setIncome(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Savings goal <span className="text-muted-foreground text-xs">— optional</span></Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="e.g. Emergency fund"
                  value={goalName}
                  onChange={e => setGoalName(e.target.value)}
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="Target ₹"
                  value={goalAmount}
                  onChange={e => setGoalAmount(e.target.value)}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">You can add more goals anytime from the Goals page.</p>
            </div>

            <Button
              className="gradient-primary w-full mt-2"
              onClick={finish}
              disabled={saving || !fullName.trim()}
            >
              {saving ? 'Setting up…' : 'Enter Spend Wisely'}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              No long questionnaire. Your Coach adapts as you use the app.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Onboarding;
