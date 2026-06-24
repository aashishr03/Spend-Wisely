ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS persona_age integer,
  ADD COLUMN IF NOT EXISTS monthly_income numeric(12,2),
  ADD COLUMN IF NOT EXISTS risk_appetite integer CHECK (risk_appetite BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS investment_experience text CHECK (investment_experience IN ('none','beginner','intermediate','advanced')),
  ADD COLUMN IF NOT EXISTS goal_horizon text CHECK (goal_horizon IN ('short','medium','long'));

-- Update prevent_profile_plan_change trigger function still blocks plan fields but allows new onboarding fields (already does — only checks plan_type/trial fields).
