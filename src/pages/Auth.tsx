import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, PieChart, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Screen = 'auth' | 'check-email' | 'forgot';

const AuthPage = () => {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState<Screen>('auth');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup fields
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');

  // Forgot password
  const [resetEmail, setResetEmail] = useState('');

  if (user) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  /* ── Login ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(loginEmail, loginPassword);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.message || 'Login failed';
      if (msg.includes('Email not confirmed')) {
        toast.error('Please verify your email first. Check your inbox for the verification link.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Signup → send verification link ── */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await signUp(signupEmail, signupPassword, signupName);
      setScreen('check-email');
      toast.success('Verification email sent! Check your inbox.');
    } catch (err: any) {
      const msg = err.message || 'Signup failed';
      if (msg.includes('User already registered') || msg.includes('already been registered') || msg.includes('already exists')) {
        toast.error('An account with this email already exists. Please sign in instead.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Forgot password ── */
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast.success('Password reset link sent! Check your email.');
      setScreen('auth');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  /* ══════════════════════════════════════
     CHECK EMAIL SCREEN
  ══════════════════════════════════════ */
  if (screen === 'check-email') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-background">
        <motion.div
          key="check-email"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="glass-card border-0 shadow-[var(--shadow-xl)]">
            <CardContent className="pt-8 pb-8 space-y-6">
              {/* Icon */}
              <div className="text-center space-y-3">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="font-heading text-2xl font-bold">Check Your Email</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    We sent a verification link to
                  </p>
                  <p className="font-semibold text-foreground text-sm">{signupEmail}</p>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-3 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>Click the link in the email to verify</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Didn't receive it? Check your spam folder or try signing up again.
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => { setScreen('auth'); }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  /* ══════════════════════════════════════
     FORGOT PASSWORD SCREEN
  ══════════════════════════════════════ */
  if (screen === 'forgot') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-background">
        <motion.div
          key="forgot"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="glass-card border-0 shadow-[var(--shadow-xl)]">
            <CardHeader className="text-center">
              <CardTitle className="font-heading text-2xl">Reset Password</CardTitle>
              <CardDescription>Enter your email to receive a reset link</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setScreen('auth')}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  /* ══════════════════════════════════════
     MAIN AUTH SCREEN
  ══════════════════════════════════════ */
  return (
    <div className="flex min-h-screen">
      {/* Left panel – branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md text-center"
        >
          <div className="mb-8 flex justify-center">
            <div className="rounded-2xl bg-primary-foreground/10 p-4 backdrop-blur-sm">
              <DollarSign className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="mb-4 font-heading text-4xl font-bold text-primary-foreground">Spend Wisely</h1>
          <p className="mb-8 text-lg text-primary-foreground/80">AI-powered personal finance & investment tracking</p>
          <div className="flex justify-center gap-8">
            {[
              { icon: TrendingUp, label: 'Smart Investing' },
              { icon: PieChart, label: 'Budget Tracking' },
              { icon: DollarSign, label: 'AI Insights' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="rounded-xl bg-primary-foreground/10 p-3 backdrop-blur-sm">
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-sm text-primary-foreground/70">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel – auth form */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 lg:hidden text-center">
            <h1 className="font-heading text-3xl font-bold text-foreground">Spend Wisely</h1>
            <p className="text-muted-foreground">AI-powered finance tracking</p>
          </div>

          <Card className="glass-card border-0 shadow-[var(--shadow-xl)]">
            <CardHeader className="text-center">
              <CardTitle className="font-heading text-2xl">Welcome</CardTitle>
              <CardDescription>Sign in or create your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                {/* LOGIN */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input id="login-email" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="you@example.com" required />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <button type="button" onClick={() => setScreen('forgot')} className="text-xs text-primary hover:underline">
                          Forgot password?
                        </button>
                      </div>
                      <Input id="login-password" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" required />
                    </div>
                    <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>

                {/* SIGN UP */}
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input id="signup-name" value={signupName} onChange={e => setSignupName(e.target.value)} placeholder="John Doe" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input id="signup-email" type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} placeholder="you@example.com" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input id="signup-password" type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} placeholder="••••••••" minLength={6} required />
                    </div>
                    <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                      {loading ? 'Creating account...' : 'Create Account'}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      We'll send a verification link to your email
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
