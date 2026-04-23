import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

const EmailVerified = () => {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <Card className="glass-card border-0 shadow-[var(--shadow-xl)]">
          <CardContent className="pt-10 pb-10 text-center space-y-5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-20 h-20 rounded-full bg-success/10 flex items-center justify-center"
            >
              <CheckCircle2 className="h-10 w-10 text-success" />
            </motion.div>
            <h1 className="font-heading text-2xl font-bold">Email Verified Successfully</h1>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Your Spend Wisely account is now active. You can sign in and start tracking your finances.
            </p>
            <Link to="/auth">
              <Button className="gradient-primary mt-2 w-full">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default EmailVerified;
