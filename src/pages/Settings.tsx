import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useFinance';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Crown, LogOut, Trash2, User, GraduationCap, RotateCcw, Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: profile } = useProfile();

  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [fullName, setFullName] = useState('');

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      const root = document.documentElement;
      if (next) { root.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
      else { root.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
      return next;
    });
  };

  const handleUpdateName = async () => {
    if (!fullName.trim()) return;
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user!.id);
    if (error) toast.error('Failed to update');
    else { toast.success('Name updated'); qc.invalidateQueries({ queryKey: ['profile'] }); }
  };

  const handleLogout = async () => { await signOut(); navigate('/auth'); };
  const handleDelete = async () => { await signOut(); navigate('/auth'); toast.success('Signed out'); };

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="font-heading text-2xl font-bold">Settings</h1>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5" /> Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <div className="flex gap-2">
                  <Input placeholder={profile?.full_name || 'Your name'} value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  <Button variant="outline" onClick={handleUpdateName}>Save</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Persona */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" /> Persona</CardTitle>
            <CardDescription>
              Currently: <Badge variant="outline" className="ml-1">{profile?.student_mode ? 'Student' : 'Working Professional'}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Persona controls your dashboard suggestions, goal templates, AI coaching tone, and investment recommendations.
              Re-run onboarding to switch personas — changes apply immediately across the app.
            </p>
            <Button variant="outline" className="w-full" onClick={() => navigate('/onboarding')}>
              <RotateCcw className="h-4 w-4 mr-2" /> Change Persona — re-run onboarding
            </Button>
          </CardContent>
        </Card>

        {/* Premium — coming soon (no fake purchase) */}
        <Card className="glass-card border-dashed">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-warning" /> Premium — Coming Soon
            </CardTitle>
            <CardDescription>Real payments aren't enabled yet. Here's what's planned:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm text-muted-foreground">
            <p className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-primary" /> Unlimited AI Coach queries</p>
            <p className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-primary" /> Unlimited voice & receipt entries</p>
            <p className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-primary" /> Advanced wealth projections</p>
            <p className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-primary" /> Multi-account & shared family budgets</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Dark Mode</p>
              <p className="text-xs text-muted-foreground">Toggle dark theme</p>
            </div>
            <Switch checked={isDark} onCheckedChange={toggleTheme} />
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
                <AlertDialogDescription>This signs you out. To fully purge your data, contact support.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
