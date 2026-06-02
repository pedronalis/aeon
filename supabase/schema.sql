-- Schema Supabase para Aeon
-- Execute via SQL Editor do Supabase (New Query)

-- ==========================================================
-- Profiles (estende auth.users com dados medievais)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    username TEXT NOT NULL DEFAULT 'Aventureiro',
    avatar_id TEXT NOT NULL DEFAULT 'knight',
    bio TEXT DEFAULT '',
    display_title TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- Settings
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    active_mode TEXT NOT NULL DEFAULT 'traditional',
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    sound_enabled BOOLEAN NOT NULL DEFAULT true
);

-- ==========================================================
-- Modes (presets + custom)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.modes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    mode_id TEXT NOT NULL,
    name TEXT NOT NULL,
    focus_duration INTEGER NOT NULL,
    short_break INTEGER NOT NULL,
    long_break INTEGER NOT NULL,
    intervals INTEGER NOT NULL,
    icon TEXT DEFAULT '',
    color TEXT DEFAULT '',
    is_custom BOOLEAN NOT NULL DEFAULT false,
    is_preset BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, mode_id)
);

-- ==========================================================
-- Tasks (Pergaminhos)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    task_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    effort TEXT NOT NULL DEFAULT 'low',
    xp_reward INTEGER NOT NULL DEFAULT 0,
    xp_penalty INTEGER NOT NULL DEFAULT 0,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    deadline TEXT DEFAULT NULL,
    completed_at TEXT DEFAULT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    linked_pomodoros INTEGER NOT NULL DEFAULT 0,
    penalty_applied BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, task_id)
);

-- ==========================================================
-- Subtasks
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    subtask_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT false,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    task_order INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT DEFAULT NULL,
    UNIQUE (user_id, subtask_id)
);

-- ==========================================================
-- Daily stats
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    date TEXT NOT NULL,
    mode_id TEXT NOT NULL,
    pomodoros_completed INTEGER NOT NULL DEFAULT 0,
    total_focus_minutes INTEGER NOT NULL DEFAULT 0,
    UNIQUE (user_id, date, mode_id)
);

-- ==========================================================
-- Achievements
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    unlocked_at TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'special',
    UNIQUE (user_id, achievement_id)
);

-- ==========================================================
-- User progress
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.user_progress (
    user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    total_xp INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date TEXT DEFAULT NULL
);

-- ==========================================================
-- Quests (diárias + semanais, unified table)
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    quest_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'daily',
    target INTEGER NOT NULL DEFAULT 1,
    current_progress INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT false,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    date TEXT DEFAULT NULL,          -- date for daily
    week_start TEXT DEFAULT NULL,    -- week start for weekly
    UNIQUE (user_id, quest_id, date, week_start)
);

-- ==========================================================
-- Row Level Security (RLS)
-- ==========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_profiles ON public.profiles FOR ALL USING (id = auth.uid());
CREATE POLICY user_settings ON public.settings FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_modes ON public.modes FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_tasks ON public.tasks FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_subtasks ON public.subtasks FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_daily_stats ON public.daily_stats FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_achievements ON public.achievements FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_user_progress ON public.user_progress FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_quests ON public.quests FOR ALL USING (user_id = auth.uid());

-- ==========================================================
-- Trigger: criar profile padrão ao registrar usuário
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, avatar_id, bio, display_title)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'Aventureiro'), 'knight', '', '');

    INSERT INTO public.user_progress (user_id, total_xp, current_streak, best_streak)
    VALUES (NEW.id, 0, 0, 0);

    INSERT INTO public.settings (user_id, active_mode, notifications_enabled, sound_enabled)
    VALUES (NEW.id, 'traditional', true, true);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
