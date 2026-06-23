import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type MentorData = {
  score: number;
  status: 'Poor' | 'Average' | 'Good' | 'Excellent';
  income: number;
  expense: number;
  projectedMonthExpense: number;
  projectedSavings: number;
  savingsRate: number;
  growth: number;
  categoryPredictions: {
    category: string;
    spent: number;
    projected: number;
    limit: number | null;
    overBy: number;
    changePct: number;
  }[];
  simulations: {
    current: { sixMonth: number; oneYear: number };
    increase20: { sixMonth: number; oneYear: number };
    save100Daily: { sixMonth: number; oneYear: number };
    invest: { sixMonth: number; oneYear: number };
  };
  recommendations: string[];
  challenges: { title: string; description: string; savings: number }[];
  mentorNarrative: string;
  studentMode: boolean;
};

export const useMentor = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['mentor', user?.id],
    queryFn: async (): Promise<MentorData> => {
      const { data, error } = await supabase.functions.invoke('financial-mentor', { body: {} });
      if (error) throw error;
      return data as MentorData;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
};
