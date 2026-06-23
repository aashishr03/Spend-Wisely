import { Link } from 'react-router-dom';
import { Brain, ChevronRight, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMentor } from '@/hooks/useMentor';

const formatINR = (v: number) =>
  `₹${Math.abs(Math.round(v)).toLocaleString('en-IN')}`;

export const MentorPredictionsCard = () => {
  const { data, isLoading } = useMentor();
  if (isLoading || !data) return null;

  const over = data.categoryPredictions.find(c => c.overBy > 0);
  const willSave = data.projectedSavings;

  return (
    <Link to="/mentor" className="block group">
      <Card className="glass-card border-primary/30 hover:border-primary/60 transition-colors">
        <CardContent className="p-4 md:p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg gradient-primary p-2 shrink-0">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-heading text-base font-semibold">AI Predictions</h3>
                <Badge variant="outline" className="text-xs">
                  Health Score {data.score}/100 • {data.status}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {over ? (
                  <div className="flex items-start gap-2 text-amber-500">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>You may exceed your <b>{over.category}</b> budget by {formatINR(over.overBy)}.</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-emerald-500">
                    <TrendingUp className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>You're on track with all your budgets this month.</span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-muted-foreground">
                  <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span>
                    {willSave >= 0
                      ? <>You're likely to save <b className="text-foreground">{formatINR(willSave)}</b> this month.</>
                      : <>You may overspend by <b className="text-foreground">{formatINR(willSave)}</b> this month.</>}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-1 group-hover:text-primary">
                Open Financial Mentor →
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
