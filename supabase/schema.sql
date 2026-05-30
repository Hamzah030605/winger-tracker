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

-- Auto-create profile on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

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

-- ─── devops_topics ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.devops_topics (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_slug        TEXT NOT NULL,
  confidence        INTEGER NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 5),
  notes             TEXT,
  completed_modules INTEGER NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, topic_slug)
);

CREATE INDEX IF NOT EXISTS devops_topics_user_id_idx ON public.devops_topics(user_id);

ALTER TABLE public.devops_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "devops_topics: own rows" ON public.devops_topics
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── devops_logs ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.devops_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_slug       TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  notes            TEXT,
  logged_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS devops_logs_user_id_idx ON public.devops_logs(user_id);
CREATE INDEX IF NOT EXISTS devops_logs_logged_at_idx ON public.devops_logs(logged_at);

ALTER TABLE public.devops_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "devops_logs: own rows" ON public.devops_logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── devops_tasks ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.devops_tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_key     TEXT NOT NULL,
  task_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, task_key, task_date)
);

CREATE INDEX IF NOT EXISTS devops_tasks_user_date_idx ON public.devops_tasks(user_id, task_date);

ALTER TABLE public.devops_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "devops_tasks: own rows" ON public.devops_tasks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
