import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUsageLimits, useSubscription, useUpgradePlan } from '@/hooks/useFinance';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Crown, Mic, Camera, Brain, LogOut, Trash2, User } from 'lucide-react';

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: usage } = useUsageLimits();
  const { data: subscription } = useSubscription();
  const upgradePlan = useUpgradePlan();
  
  // Initialize dark mode from current DOM state, not from a hook that auto-applies
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [fullName, setFullName] = useState('');

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      const root = document.documentElement;
      if (next) {
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return next;
    });
  };

  const isPremium = profile?.plan_type === 'premium';

  const handleUpdateName = async () => {
    if (!fullName.trim()) return;
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user!.id);
    if (error) toast.error('Failed to update');
    else toast.success('Name updated!');
  };

  const handleUpgrade = async () => {
    try {
      await upgradePlan.mutateAsync();
      toast.success('🎉 Upgraded to Premium!');
    } catch {
      toast.error('Upgrade failed');
    }
  };

  const handleDeleteAccount = async () => {
    await signOut();
    navigate('/auth');
    toast.success('Account deleted');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const usageItems = [
    { label: 'Voice Entries', icon: Mic, used: usage?.voice_entries_used ?? 0, limit: isPremium ? '∞' : '5' },
    { label: 'Receipt Scans', icon: Camera, used: usage?.receipt_scans_used ?? 0, limit: isPremium ? '∞' : '5' },
    { label: 'AI Queries', icon: Brain, used: usage?.ai_premium_queries_used ?? 0, limit: isPremium ? '∞' : '10' },
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="font-heading text-2xl font-bold">Settings</h1>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <User className="h-5 w-5" /> Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={profile?.full_name || 'Your name'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  <Button variant="outline" onClick={handleUpdateName}>Save</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className={isPremium ? 'glass-card border-primary/30' : 'glass-card'}>
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Crown className={`h-5 w-5 ${isPremium ? 'text-warning' : ''}`} />
                {isPremium ? 'Premium Plan' : 'Free Plan'}
              </CardTitle>
              <CardDescription>
                {isPremium
                  ? `Active until ${subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString() : 'N/A'}`
                  : 'Upgrade for unlimited features'}
              </CardDescription>
            </CardHeader>
            {!isPremium && (
              <CardContent>
                <Button onClick={handleUpgrade} className="w-full gradient-primary" disabled={upgradePlan.isPending}>
                  <Crown className="mr-2 h-4 w-4" />
                  {upgradePlan.isPending ? 'Upgrading...' : 'Upgrade to Premium — ₹799/mo'}
                </Button>
              </CardContent>
            )}
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Usage This Month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {usageItems.map(({ label, icon: Icon, used, limit }) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span>{label}</span>
                    </div>
                    <span className="font-medium">{used} / {limit}</span>
                  </div>
                  {!isPremium && (
                    <Progress value={(used / Number(limit)) * 100} className="h-1.5" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <Card className="glass-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Toggle dark theme</p>
              </div>
              <Switch checked={isDark} onCheckedChange={toggleTheme} />
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex flex-col gap-3">
          <Button variant="outline" onClick={handleLogout} className="w-full">
            <LogOut className="mr-2 h-4 w-4" /> Log Out
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
