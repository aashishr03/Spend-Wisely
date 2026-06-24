import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ChevronRight } from 'lucide-react';

export type AIAction = {
  id: string;
  title: string;
  why: string;
  cta?: { label: string; to: string };
};

export const AIActionCenter = ({ actions }: { actions: AIAction[] }) => {
  const top = actions.slice(0, 3); // max 3
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
      <Card className="glass-card border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> AI Action Center
          </CardTitle>
          <CardDescription>Your top {top.length || 0} action{top.length === 1 ? '' : 's'} this week — each one explains why.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {top.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Add a few transactions — your AI Coach will surface actions here.
            </p>
          ) : top.map(a => (
            <div key={a.id} className="rounded-lg border border-border bg-card/40 p-3 space-y-2">
              <p className="text-sm font-medium leading-snug">{a.title}</p>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground/80">Why:</span> {a.why}
              </p>
              {a.cta && (
                <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                  <Link to={a.cta.to}>
                    {a.cta.label} <ChevronRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
};
