import { supabase } from './supabase';
import type { Mode } from '@/domain/modes/Mode';
import type { Task, Subtask } from '@/domain/tasks/Task';
import type { DailyStats, UserProgress } from '@/domain/scoring/ScoreEngine';
import type { DailyQuest, WeeklyQuest } from '@/domain/quests/QuestEngine';
import { formatDate } from '@/domain/utils/dateUtils';

// ------------------------------------------------------------------ Helpers

export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ------------------------------------------------------------------ Profiles

export async function supaGetProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function supaUpdateProfile(userId: string, updates: Record<string, unknown>) {
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
  if (error) throw error;
}

// ------------------------------------------------------------------ Settings

export type SupaSettings = {
  active_mode: string;
  notifications_enabled: boolean;
  sound_enabled: boolean;
};

export async function supaGetSettings(userId: string): Promise<SupaSettings | null> {
  const { data, error } = await supabase.from('settings').select('*').eq('user_id', userId).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

export async function supaUpsertSettings(userId: string, values: Partial<SupaSettings>) {
  const { error } = await supabase.from('settings').upsert({ user_id: userId, ...values });
  if (error) throw error;
}

// ------------------------------------------------------------------ Modes

export async function supaGetModes(userId: string): Promise<Mode[]> {
  const { data, error } = await supabase.from('modes').select('*').eq('user_id', userId).eq('is_custom', true);
  if (error) throw error;
  if (!data) return [];
  return data.map((row) => ({
    id: row.mode_id,
    name: row.name,
    focusDuration: row.focus_duration,
    shortBreakDuration: row.short_break,
    longBreakDuration: row.long_break,
    pomodorosUntilLongBreak: row.intervals,
    accentColor: row.color ?? '#7aa2f7',
    isCustom: true,
  }));
}

export async function supaUpsertModes(userId: string, modes: Mode[]) {
  const customModes = modes.filter((m) => m.isCustom);
  const rows = customModes.map((m) => ({
    user_id: userId,
    mode_id: m.id,
    name: m.name,
    focus_duration: m.focusDuration,
    short_break: m.shortBreakDuration,
    long_break: m.longBreakDuration,
    intervals: m.pomodorosUntilLongBreak,
    icon: m.id ?? '',
    color: m.accentColor ?? '',
    is_custom: true,
    is_preset: false,
  }));
  const { error: delErr } = await supabase.from('modes').delete().eq('user_id', userId).eq('is_custom', true);
  if (delErr) throw delErr;
  if (rows.length > 0) {
    const { error: insErr } = await supabase.from('modes').insert(rows);
    if (insErr) throw insErr;
  }
}

// ------------------------------------------------------------------ Tasks

export async function supaGetTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase.from('tasks').select('*').eq('user_id', userId);
  if (error) throw error;
  if (!data) return [];
  return data.map((row) => ({
    id: row.task_id,
    title: row.title,
    description: row.description,
    status: row.status,
    effort: row.effort,
    xpReward: row.xp_reward,
    xpPenalty: row.xp_penalty,
    xpEarned: row.xp_earned,
    deadline: row.deadline,
    completedAt: row.completed_at,
    sortOrder: row.sort_order,
    linkedPomodoros: row.linked_pomodoros,
    penaltyApplied: row.penalty_applied,
    createdAt: row.created_at ?? formatDate(new Date()),
  }));
}

export async function supaSetTasks(userId: string, tasks: Task[]) {
  const rows = tasks.map((t) => ({
    user_id: userId,
    task_id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    effort: t.effort,
    xp_reward: t.xpReward,
    xp_penalty: t.xpPenalty,
    xp_earned: t.xpEarned,
    deadline: t.deadline,
    completed_at: t.completedAt,
    sort_order: t.sortOrder,
    linked_pomodoros: t.linkedPomodoros,
    penalty_applied: t.penaltyApplied,
  }));
  const { error: delErr } = await supabase.from('tasks').delete().eq('user_id', userId);
  if (delErr) throw delErr;
  if (rows.length > 0) {
    const { error: insErr } = await supabase.from('tasks').insert(rows);
    if (insErr) throw insErr;
  }
}

// ------------------------------------------------------------------ Subtasks

export async function supaGetSubtasks(userId: string): Promise<Subtask[]> {
  const { data, error } = await supabase.from('subtasks').select('*').eq('user_id', userId);
  if (error) throw error;
  if (!data) return [];
  return data.map((row) => ({
    id: row.subtask_id,
    taskId: row.task_id,
    title: row.title,
    completed: row.completed,
    xpReward: row.xp_reward,
    order: row.task_order,
    completedAt: row.completed_at,
  }));
}

export async function supaSetSubtasks(userId: string, subtasks: Subtask[]) {
  const rows = subtasks.map((s) => ({
    user_id: userId,
    subtask_id: s.id,
    task_id: s.taskId,
    title: s.title,
    completed: s.completed,
    xp_reward: s.xpReward,
    task_order: s.order,
    completed_at: s.completedAt,
  }));
  const { error: delErr } = await supabase.from('subtasks').delete().eq('user_id', userId);
  if (delErr) throw delErr;
  if (rows.length > 0) {
    const { error: insErr } = await supabase.from('subtasks').insert(rows);
    if (insErr) throw insErr;
  }
}

// ------------------------------------------------------------------ Daily Stats

export async function supaGetDailyStats(userId: string): Promise<DailyStats[]> {
  const { data, error } = await supabase.from('daily_stats').select('*').eq('user_id', userId);
  if (error) throw error;
  if (!data) return [];
  return data.map((row) => ({
    date: row.date,
    modeId: row.mode_id,
    pomodorosCompleted: row.pomodoros_completed,
    totalFocusMinutes: row.total_focus_minutes,
  }));
}

export async function supaUpsertDailyStats(userId: string, stats: DailyStats[]) {
  for (const s of stats) {
    const { error } = await supabase.from('daily_stats').upsert({
      user_id: userId,
      date: s.date,
      mode_id: s.modeId,
      pomodoros_completed: s.pomodorosCompleted,
      total_focus_minutes: s.totalFocusMinutes,
    }, { onConflict: 'user_id,date,mode_id' });
    if (error) throw error;
  }
}

// ------------------------------------------------------------------ Achievements

export interface SupaAchievement {
  achievement_id: string;
  unlocked_at: string;
  category: string;
}

export async function supaGetAchievements(userId: string): Promise<SupaAchievement[]> {
  const { data, error } = await supabase.from('achievements').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    achievement_id: row.achievement_id,
    unlocked_at: row.unlocked_at,
    category: row.category,
  }));
}

export async function supaInsertAchievement(userId: string, record: SupaAchievement) {
  const { error } = await supabase.from('achievements').insert({
    user_id: userId,
    achievement_id: record.achievement_id,
    unlocked_at: record.unlocked_at,
    category: record.category,
  });
  if (error) throw error;
}

// ------------------------------------------------------------------ User Progress

export async function supaGetUserProgress(userId: string): Promise<UserProgress | null> {
  const { data, error } = await supabase.from('user_progress').select('*').eq('user_id', userId).single();
  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  return {
    totalXp: data.total_xp,
    currentStreak: data.current_streak,
    bestStreak: data.best_streak,
    lastActivityDate: data.last_activity_date,
  };
}

export async function supaUpdateUserProgress(userId: string, values: Partial<UserProgress>) {
  const mapped: Record<string, unknown> = {};
  if (values.totalXp !== undefined) mapped.total_xp = values.totalXp;
  if (values.currentStreak !== undefined) mapped.current_streak = values.currentStreak;
  if (values.bestStreak !== undefined) mapped.best_streak = values.bestStreak;
  if (values.lastActivityDate !== undefined) mapped.last_activity_date = values.lastActivityDate;
  const { error } = await supabase.from('user_progress').update(mapped).eq('user_id', userId);
  if (error) throw error;
}

export async function supaUpsertUserProgress(userId: string, values: UserProgress) {
  const { error } = await supabase.from('user_progress').upsert({
    user_id: userId,
    total_xp: values.totalXp,
    current_streak: values.currentStreak,
    best_streak: values.bestStreak,
    last_activity_date: values.lastActivityDate,
  });
  if (error) throw error;
}

// ------------------------------------------------------------------ Quests

export async function supaGetQuests(userId: string): Promise<{
  dailyQuests: DailyQuest[];
  weeklyQuests: WeeklyQuest[];
}> {
  const { data, error } = await supabase.from('quests').select('*').eq('user_id', userId);
  if (error) throw error;
  const dailyQuests: DailyQuest[] = [];
  const weeklyQuests: WeeklyQuest[] = [];
  (data ?? []).forEach((row) => {
    const base = {
      id: row.quest_id,
      name: row.name,
      description: row.description,
      category: row.category as 'daily' | 'weekly',
      target: row.target,
      currentProgress: row.current_progress,
      completed: row.completed,
      xpReward: row.xp_reward,
    };
    if (row.category === 'daily') {
      dailyQuests.push({ ...base, date: row.date });
    } else {
      weeklyQuests.push({ ...base, weekStart: row.week_start });
    }
  });
  return { dailyQuests, weeklyQuests };
}

export async function supaSetQuests(userId: string, dailyQuests: DailyQuest[], weeklyQuests: WeeklyQuest[]) {
  const { error: delErr } = await supabase.from('quests').delete().eq('user_id', userId);
  if (delErr) throw delErr;
  const rows: Record<string, unknown>[] = [];
  for (const q of dailyQuests) {
    rows.push({
      user_id: userId,
      quest_id: q.id,
      name: q.name,
      description: q.description,
      category: 'daily',
      target: q.target,
      current_progress: q.currentProgress,
      completed: q.completed,
      xp_reward: q.xpReward,
      date: q.date,
      week_start: null,
    });
  }
  for (const q of weeklyQuests) {
    rows.push({
      user_id: userId,
      quest_id: q.id,
      name: q.name,
      description: q.description,
      category: 'weekly',
      target: q.target,
      current_progress: q.currentProgress,
      completed: q.completed,
      xp_reward: q.xpReward,
      date: null,
      week_start: q.weekStart,
    });
  }
  if (rows.length > 0) {
    const { error: insErr } = await supabase.from('quests').insert(rows);
    if (insErr) throw insErr;
  }
}

export async function supaUpdateQuestProgress(
  userId: string,
  quest: { questId: string; category: 'daily' | 'weekly'; date: string | null; weekStart: string | null; currentProgress: number; completed: boolean }
) {
  const { error } = await supabase.from('quests').update({
    current_progress: quest.currentProgress,
    completed: quest.completed,
  }).eq('user_id', userId).eq('quest_id', quest.questId).eq('category', quest.category);
  if (error) throw error;
}

export async function supaInsertQuests(userId: string, newQuests: DailyQuest[] | WeeklyQuest[]) {
  const rows: Record<string, unknown>[] = [];
  const isDaily = (newQuests[0] as DailyQuest)?.date !== undefined;
  for (const q of newQuests) {
    if (isDaily) {
      const d = q as DailyQuest;
      rows.push({
        user_id: userId,
        quest_id: d.id,
        name: d.name,
        description: d.description,
        category: 'daily',
        target: d.target,
        current_progress: d.currentProgress,
        completed: d.completed,
        xp_reward: d.xpReward,
        date: d.date,
        week_start: null,
      });
    } else {
      const w = q as WeeklyQuest;
      rows.push({
        user_id: userId,
        quest_id: w.id,
        name: w.name,
        description: w.description,
        category: 'weekly',
        target: w.target,
        current_progress: w.currentProgress,
        completed: w.completed,
        xp_reward: w.xpReward,
        date: null,
        week_start: w.weekStart,
      });
    }
  }
  if (rows.length > 0) {
    const { error: insErr } = await supabase.from('quests').insert(rows);
    if (insErr) throw insErr;
  }
}
