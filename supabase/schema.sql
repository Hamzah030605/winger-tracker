-- ============================================================
-- Winger Tracker — Supabase Schema + RLS Policies
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ─── profiles ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT,
  current_week    INTEGER NOT NULL DEFAULT 1,
  plan_start_date DATE    NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: own row" ON public.profiles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── session_logs ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.session_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type     TEXT NOT NULL CHECK (plan_type IN ('gym', 'football')),
  session_name  TEXT NOT NULL,
  week_number   INTEGER NOT NULL,
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  overall_notes TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS session_logs_user_id_idx ON public.session_logs(user_id);
CREATE INDEX IF NOT EXISTS session_logs_completed_at_idx ON public.session_logs(completed_at);

ALTER TABLE public.session_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_logs: own rows" ON public.session_logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── exercise_logs ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exercise_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_log_id    UUID NOT NULL REFERENCES public.session_logs(id) ON DELETE CASCADE,
  exercise_name     TEXT NOT NULL,
  -- Gym fields
  sets              INTEGER,
  reps              INTEGER,
  weight            NUMERIC,
  rpe               NUMERIC CHECK (rpe >= 1 AND rpe <= 10),
  -- Football fields
  quality_rating    INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  confidence_rating INTEGER CHECK (confidence_rating BETWEEN 1 AND 5),
  weak_foot_notes   TEXT,
  -- Shared
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS exercise_logs_session_log_id_idx ON public.exercise_logs(session_log_id);

ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercise_logs: own rows" ON public.exercise_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.session_logs s
      WHERE s.id = session_log_id
        AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.session_logs s
      WHERE s.id = session_log_id
        AND s.user_id = auth.uid()
    )
  );

-- ─── habits ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.habits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('deen','football','physique','career','growth','discipline')),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS habits_user_id_idx ON public.habits(user_id);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "habits: own rows" ON public.habits
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── habit_logs ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id    UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(habit_id, logged_date)
);

CREATE INDEX IF NOT EXISTS habit_logs_user_id_date_idx ON public.habit_logs(user_id, logged_date);

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "habit_logs: own rows" ON public.habit_logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── seed default habits for new users ────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.habits (user_id, name, category, sort_order) VALUES
    (NEW.id, 'Fajr + Morning Dhikr',                    'deen',       0),
    (NEW.id, 'Quran 10–20 mins',                        'deen',       1),
    (NEW.id, 'Pray 5 Salah in the Mosque',              'deen',       2),
    (NEW.id, 'Daily Islamic Reminder / Reading',        'deen',       3),
    (NEW.id, 'Wake Up For Fajr + Train',                'football',   4),
    (NEW.id, 'Football Session / Ball Mastery',         'football',   5),
    (NEW.id, 'Mobility / Stretching',                   'football',   6),
    (NEW.id, 'Shower + Full Morning Grooming',          'physique',   7),
    (NEW.id, 'Post-Workout Protein Shake',              'physique',   8),
    (NEW.id, 'Night Skincare + Minoxidil',              'physique',   9),
    (NEW.id, '10k Steps + 2.5–3L Water',               'physique',  10),
    (NEW.id, 'No Junk / No Late-Night Eating',         'physique',  11),
    (NEW.id, 'DevOps Study 60+ mins',                   'career',    12),
    (NEW.id, 'Hands-On Lab',                            'career',    13),
    (NEW.id, 'Arabic Study',                            'growth',    14),
    (NEW.id, 'Read For 30–60 Minutes',                  'growth',    15),
    (NEW.id, 'Not In Bed After Fajr Until After Isha',  'discipline',16);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── seed_default_habits RPC ─────────────────────────────────
-- Called by the app on page load for existing users who signed up
-- before the trigger existed. SECURITY DEFINER bypasses RLS edge-cases.
-- Run this separately in the SQL editor after the tables above.
CREATE OR REPLACE FUNCTION public.seed_default_habits()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_count integer;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'not authenticated');
  END IF;

  SELECT COUNT(*) INTO v_count FROM public.habits WHERE user_id = v_uid;

  IF v_count = 0 THEN
    INSERT INTO public.habits (user_id, name, category, sort_order) VALUES
      (v_uid, 'Fajr + Morning Dhikr',                    'deen',        0),
      (v_uid, 'Quran 10–20 mins',                        'deen',        1),
      (v_uid, 'Pray 5 Salah in the Mosque',              'deen',        2),
      (v_uid, 'Daily Islamic Reminder / Reading',        'deen',        3),
      (v_uid, 'Wake Up For Fajr + Train',                'football',    4),
      (v_uid, 'Football Session / Ball Mastery',         'football',    5),
      (v_uid, 'Mobility / Stretching',                   'football',    6),
      (v_uid, 'Shower + Full Morning Grooming',          'physique',    7),
      (v_uid, 'Post-Workout Protein Shake',              'physique',    8),
      (v_uid, 'Night Skincare + Minoxidil',              'physique',    9),
      (v_uid, '10k Steps + 2.5–3L Water',               'physique',   10),
      (v_uid, 'No Junk / No Late-Night Eating',         'physique',   11),
      (v_uid, 'DevOps Study 60+ mins',                   'career',     12),
      (v_uid, 'Hands-On Lab',                            'career',     13),
      (v_uid, 'Arabic Study',                            'growth',     14),
      (v_uid, 'Read For 30–60 Minutes',                  'growth',     15),
      (v_uid, 'Not In Bed After Fajr Until After Isha',  'discipline', 16);
    RETURN jsonb_build_object('seeded', true, 'inserted', 17);
  ELSE
    RETURN jsonb_build_object('seeded', false, 'existing', v_count);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.seed_default_habits() TO authenticated;
GRANT EXECUTE ON FUNCTION public.seed_default_habits() TO anon;

-- ─── unique constraints (required for upsert onConflict) ─────
ALTER TABLE public.devops_topics
  ADD CONSTRAINT devops_topics_user_topic_unique UNIQUE (user_id, topic_slug);

ALTER TABLE public.devops_tasks
  ADD CONSTRAINT devops_tasks_user_key_date_unique UNIQUE (user_id, task_key, task_date);

-- ─── table grants ─────────────────────────────────────────────
-- Supabase enables RLS by default but still requires explicit grants
-- for the authenticated role to pass through to the RLS policy check.
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_logs   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_logs  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habits         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habit_logs     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.devops_topics  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.devops_logs    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.devops_tasks   TO authenticated;

-- ─── Migration 1: Fix plan_start_date to next Monday ─────────────────────────
-- Run once in Supabase SQL Editor after the table grants above.
-- Moves any plan_start_date that is <= today to the next upcoming Monday.
/*
UPDATE public.profiles
SET plan_start_date = CURRENT_DATE + (
  CASE EXTRACT(DOW FROM CURRENT_DATE)::int
    WHEN 0 THEN 1
    WHEN 1 THEN 0
    ELSE 8 - EXTRACT(DOW FROM CURRENT_DATE)::int
  END
) * INTERVAL '1 day'
WHERE plan_start_date <= CURRENT_DATE;
*/

-- ─── focus_sessions ──────────────────────────────────────────────────────────
-- Run Migration 2 in Supabase SQL Editor
/*
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type     TEXT NOT NULL CHECK (session_type IN ('devops','arabic','reading','deep_work','training')),
  duration_minutes INTEGER NOT NULL DEFAULT 25,
  started_at       TIMESTAMPTZ NOT NULL,
  completed_at     TIMESTAMPTZ,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS focus_sessions_user_id_idx    ON public.focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS focus_sessions_started_at_idx ON public.focus_sessions(started_at);
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "focus_sessions: own rows" ON public.focus_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.focus_sessions TO authenticated;
*/

-- ─── weekly_reviews ───────────────────────────────────────────────────────────
-- Run Migration 3 in Supabase SQL Editor
/*
CREATE TABLE IF NOT EXISTS public.weekly_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  went_well       TEXT,
  went_badly      TEXT,
  biggest_win     TEXT,
  biggest_lesson  TEXT,
  focus_next_week TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, week_start_date)
);
ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "weekly_reviews: own rows" ON public.weekly_reviews
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_reviews TO authenticated;
*/
