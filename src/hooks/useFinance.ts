import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useProfile = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useAccounts = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
};

export const useTransactions = (dateFrom?: string, dateTo?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['transactions', user?.id, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select('*, categories(*)')
        .eq('user_id', user!.id)
        .order('date', { ascending: false });
      if (dateFrom) query = query.gte('date', dateFrom);
      if (dateTo) query = query.lte('date', dateTo);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useAddTransaction = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (tx: {
      account_id: string;
      category_id: string;
      amount: number;
      type: 'income' | 'expense';
      description?: string;
      notes?: string;
      date: string;
    }) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...tx, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useDeleteTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useBudgets = (month: number, year: number) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['budgets', user?.id, month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*, categories(*)')
        .eq('user_id', user!.id)
        .eq('month', month)
        .eq('year', year);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useUpsertBudget = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (budget: {
      category_id: string;
      monthly_limit: number;
      month: number;
      year: number;
    }) => {
      const { data, error } = await supabase
        .from('budgets')
        .upsert({ ...budget, user_id: user!.id }, { onConflict: 'user_id,category_id,month,year' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
};

export const useInvestmentProfile = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['investment_profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('investment_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useUpsertInvestmentProfile = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (profile: {
      risk_level: 'low' | 'medium' | 'high';
      monthly_investment_amount: number;
      goals?: string;
    }) => {
      const { data, error } = await supabase
        .from('investment_profiles')
        .upsert({ ...profile, user_id: user!.id }, { onConflict: 'user_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investment_profile'] });
    },
  });
};

export const useUsageLimits = () => {
  const { user } = useAuth();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return useQuery({
    queryKey: ['usage_limits', user?.id, month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usage_limits')
        .select('*')
        .eq('user_id', user!.id)
        .eq('month', month)
        .eq('year', year)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useIncrementUsage = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (field: 'voice_entries_used' | 'receipt_scans_used' | 'ai_premium_queries_used') => {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      // Get or create usage limit record
      let { data } = await supabase
        .from('usage_limits')
        .select('*')
        .eq('user_id', user!.id)
        .eq('month', month)
        .eq('year', year)
        .maybeSingle();

      if (!data) {
        const { data: newData, error } = await supabase
          .from('usage_limits')
          .insert({ user_id: user!.id, month, year })
          .select()
          .single();
        if (error) throw error;
        data = newData;
      }

      const { error } = await supabase
        .from('usage_limits')
        .update({ [field]: ((data as any)[field] as number) + 1 })
        .eq('id', data!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usage_limits'] });
    },
  });
};

export const useSubscription = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useUpgradePlan = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      // Update profile
      await supabase
        .from('profiles')
        .update({ plan_type: 'premium' as const })
        .eq('id', user!.id);
      // Update/insert subscription
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user!.id,
          plan_type: 'premium' as const,
          is_trial: false,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
};
