import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useGoals = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['savings-goals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('savings_goals').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

export const useChallenges = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['mentor-challenges', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mentor_challenges').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

export const useAddGoal = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (g: { name: string; target_amount: number; category?: string; icon_key?: string; target_date?: string | null }) => {
      const { error } = await supabase.from('savings_goals').insert({
        user_id: user!.id,
        name: g.name,
        target_amount: g.target_amount,
        category: g.category || 'general',
        icon_key: g.icon_key || 'target',
        target_date: g.target_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['savings-goals'] }),
  });
};

export const useUpdateGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, saved_amount }: { id: string; saved_amount: number }) => {
      const { error } = await supabase.from('savings_goals').update({ saved_amount }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['savings-goals'] }),
  });
};

export const useDeleteGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('savings_goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['savings-goals'] }),
  });
};
