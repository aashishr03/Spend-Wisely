import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Plus, Wallet, TrendingUp, Settings, Menu, X, DollarSign, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/add-transaction', icon: Plus, label: 'Add' },
  { to: '/budgets', icon: Wallet, label: 'Budgets' },
  { to: '/insights', icon: Sparkles, label: 'Insights' },
  { to: '/invest', icon: TrendingUp, label: 'Invest' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col border-r border-border bg-card p-4">
        <Link to="/dashboard" className="mb-8 flex items-center gap-2 px-2">
          <div className="rounded-lg gradient-primary p-2">
            <DollarSign className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold">Spend Wisely</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile top header */}
      <div className="flex flex-1 flex-col">
        <header className="flex md:hidden items-center justify-between border-b border-border bg-card px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="rounded-lg gradient-primary p-1.5">
              <DollarSign className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold">Spend Wisely</span>
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
                  const active = location.pathname === to;
                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        active
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
          {children}
        </main>

        {/* Mobile bottom navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border bg-card/95 backdrop-blur-lg">
          <div className="flex items-center justify-around py-2">
            {navItems.filter(n => n.to !== '/settings').map(({ to, icon: Icon, label }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[48px]',
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground'
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
