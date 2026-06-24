import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { HealthBreakdown } from '@/lib/healthScore';

const tone = (s: HealthBreakdown['status']) =>
  s === 'Excellent' ? 'text-emerald-500'
  : s === 'Good' ? 'text-primary'
  : s === 'Average' ? 'text-amber-500'
  : 'text-destructive';

export const HealthScoreCard = ({ data }: { data: HealthBreakdown }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="glass-card overflow-hidden">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-warning" /> Financial Health Score
          </CardTitle>
          <CardDescription>
            Transparent 100-point breakdown — hover any row to see how it's calculated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative h-32 w-32 shrink-0">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted/30" />
                <circle
                  cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="8" fill="none"
                  strokeDasharray={`${(data.total / 100) * 276.46} 276.46`}
                  className={tone(data.status)} strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${tone(data.status)}`}>{data.total}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-2">
              <Badge variant="outline" className={tone(data.status)}>{data.status}</Badge>
              <TooltipProvider>
                <div className="space-y-2 mt-2">
                  {data.parts.map(p => (
                    <div key={p.key}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 font-medium">
                          {p.label}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[220px] text-xs">
                              {p.why}
                            </TooltipContent>
                          </Tooltip>
                        </span>
                        <span className="text-muted-foreground tabular-nums">
                          {p.earned}/{p.max}
                        </span>
                      </div>
                      <Progress value={(p.earned / p.max) * 100} className="h-1 mt-1" />
                    </div>
                  ))}
                </div>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
