-- Mentor challenges tracking
CREATE TABLE public.mentor_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_savings NUMERIC NOT NULL DEFAULT 0,
  saved_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- active | completed
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentor_challenges TO authenticated;
GRANT ALL ON public.mentor_challenges TO service_role;
ALTER TABLE public.mentor_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_challenges" ON public.mentor_challenges FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Student / placement savings goals
CREATE TABLE public.savings_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon_key TEXT NOT NULL DEFAULT 'target',
  target_amount NUMERIC NOT NULL DEFAULT 0,
  saved_amount NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'placement', -- placement | certification | education | device | other
  target_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.savings_goals TO authenticated;
GRANT ALL ON public.savings_goals TO service_role;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_savings_goals" ON public.savings_goals FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at trigger reuse
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_mentor_challenges_updated BEFORE UPDATE ON public.mentor_challenges
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_savings_goals_updated BEFORE UPDATE ON public.savings_goals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();