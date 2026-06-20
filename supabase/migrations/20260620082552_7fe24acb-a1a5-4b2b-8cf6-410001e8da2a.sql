
-- 1. Categories: require auth
DROP POLICY IF EXISTS "Users can view system and own categories" ON public.categories;
CREATE POLICY "Users can view system and own categories"
ON public.categories FOR SELECT
TO authenticated
USING ((is_system = true) OR (auth.uid() = user_id));

-- 2. Profiles: prevent plan_type self-escalation via restrictive policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.prevent_profile_plan_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.plan_type IS DISTINCT FROM OLD.plan_type
     OR NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at
     OR NEW.trial_started_at IS DISTINCT FROM OLD.trial_started_at THEN
    RAISE EXCEPTION 'Plan and trial fields cannot be modified by users';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_plan_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS prevent_profile_plan_change_trg ON public.profiles;
CREATE TRIGGER prevent_profile_plan_change_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
WHEN (current_setting('role', true) <> 'service_role')
EXECUTE FUNCTION public.prevent_profile_plan_change();

-- 3. Subscriptions: read-only for users
DROP POLICY IF EXISTS "Users can CRUD own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions"
ON public.subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.subscriptions FROM authenticated, anon;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

-- 4. Usage limits: read-only for users
DROP POLICY IF EXISTS "Users can CRUD own usage limits" ON public.usage_limits;
CREATE POLICY "Users can view own usage limits"
ON public.usage_limits FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.usage_limits FROM authenticated, anon;
GRANT SELECT ON public.usage_limits TO authenticated;
GRANT ALL ON public.usage_limits TO service_role;

-- 5. Lock down SECURITY DEFINER trigger function
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
