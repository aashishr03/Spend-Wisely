import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Receipt, Target, Brain, TrendingUp, Settings, Menu, X, DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/transactions', icon: Receipt, label: 'Transactions' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/coach', icon: Brain, label: 'AI Coach' },
  { to: '/investments', icon: TrendingUp, label: 'Investments' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isActive = (to: string) =>
    location.pathname === to ||
    (to === '/transactions' && location.pathname.startsWith('/add-transaction')) ||
    (to === '/home' && location.pathname === '/dashboard');

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex md:w-64 flex-col border-r border-border bg-card p-4">
        <Link to="/home" className="mb-8 flex items-center gap-2 px-2">
          <div className="rounded-lg gradient-primary p-2">
            <DollarSign className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-lg font-bold leading-tight">Spend Wisely AI</span>
            <span className="text-[10px] text-muted-foreground -mt-0.5">Your AI Financial Coach</span>
          </div>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex md:hidden items-center justify-between border-b border-border bg-card px-4 py-3">
          <Link to="/home" className="flex items-center gap-2">
            <div className="rounded-lg gradient-primary p-1.5">
              <DollarSign className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-base font-bold">Spend Wisely AI</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </header>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden md:hidden border-b border-border bg-card"
            >
              <nav className="flex flex-col gap-1 p-2">
                {navItems.map(({ to, icon: Icon, label }) => {
                  const active = isActive(to);
                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-8">{children}</main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border bg-card/95 backdrop-blur-lg">
          <div className="flex items-center justify-around py-2">
            {navItems.filter(n => n.to !== '/settings').map(({ to, icon: Icon, label }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[48px]',
                    active ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <Icon className={cn('h-5 w-5', active && 'text-primary')} />
                  <span className="text-[10px] font-medium">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};
