
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS student_mode boolean NOT NULL DEFAULT false;

INSERT INTO public.categories (name, type, icon, color, is_system, user_id) VALUES
  ('College Fees', 'expense', '🎓', '#8B5CF6', true, NULL),
  ('Books', 'expense', '📚', '#F59E0B', true, NULL),
  ('Certifications', 'expense', '🏅', '#10B981', true, NULL),
  ('Hostel/PG', 'expense', '🏠', '#EF4444', true, NULL),
  ('Personal Expenses', 'expense', '👤', '#06B6D4', true, NULL)
ON CONFLICT DO NOTHING;
