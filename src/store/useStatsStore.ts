import { create } from 'zustand';
import type { DailyStats, UserProgress } from '@/domain/scoring/ScoreEngine';
import { getAchievementById } from '@/domain/scoring/achievements';
import { getAchievementFlavorText } from '@/domain/lore/messages';
import { calculateStreaks } from '@/domain/utils/dateUtils';
import { useNotificationsStore } from './useNotificationsStore';
import { dbGet, dbSet, tableGet, tableSet, DB_KEYS } from '@/lib/storage';
import { getCurrentUserId, supaGetDailyStats, supaGetAchievements, supaInsertAchievement, supaGetUserProgress, supaUpdateUserProgress } from '@/lib/supabaseStorage';

interface AchievementRecord {
  id: string;
  unlockedAt: string;
  category: string;
}

interface StatsStore {
  dailyStats: DailyStats[];
  achievements: string[];
  progress: UserProgress;
  loading: boolean;

  loadStats: () => Promise<void>;
  unlockAchievement: (achievementId: string, category: string, xp: number) => Promise<void>;
  updateStreaks: () => Promise<void>;
  exportCSV: () => Promise<void>;
  resetData: () => Promise<void>;
}

export const useStatsStore = create<StatsStore>((set, get) => ({
  dailyStats: [],
  achievements: [],
  progress: {
    totalXp: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastActivityDate: null,
  },
  loading: false,

  loadStats: async () => {
    try {
      set({ loading: true });
      const userId = await getCurrentUserId();

      let dailyStats: DailyStats[] = [];
      let achievementsRecords: AchievementRecord[] = [];
      let progress: UserProgress | null = null;

      if (userId) {
        dailyStats = await supaGetDailyStats(userId);
        const achs = await supaGetAchievements(userId);
        achievementsRecords = achs.map((a) => ({ id: a.achievement_id, unlockedAt: a.unlocked_at, category: a.category }));
        progress = (await supaGetUserProgress(userId)) ?? null;
      } else {
        dailyStats = await tableGet<DailyStats>(DB_KEYS.dailyStats);
        achievementsRecords = await tableGet<AchievementRecord>(DB_KEYS.achievements);
        progress = (await dbGet<UserProgress>(DB_KEYS.userProgress)) ?? null;
      }

      const dates = dailyStats.map((s) => s.date);
      const { current, best } = calculateStreaks(dates);

      set({
        dailyStats,
        achievements: achievementsRecords.map((a) => a.id),
        progress: progress ?? {
          totalXp: 0,
          currentStreak: current,
          bestStreak: best,
          lastActivityDate: null,
        },
        loading: false,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      set({ loading: false });
    }
  },

  unlockAchievement: async (achievementId, category, xp) => {
    try {
      const currentAchievements = get().achievements;
      if (currentAchievements.includes(achievementId)) return;

      const now = new Date().toISOString();
      const userId = await getCurrentUserId();

      if (userId) {
        await supaInsertAchievement(userId, { achievement_id: achievementId, unlocked_at: now, category });
        const progress = (await supaGetUserProgress(userId)) ?? { totalXp: 0, currentStreak: 0, bestStreak: 0, lastActivityDate: null };
        await supaUpdateUserProgress(userId, { totalXp: progress.totalXp + xp });
      } else {
        const records = await tableGet<AchievementRecord>(DB_KEYS.achievements);
        records.push({ id: achievementId, unlockedAt: now, category });
        await tableSet(DB_KEYS.achievements, records);
        const progress = (await dbGet<UserProgress>(DB_KEYS.userProgress)) ?? { totalXp: 0, currentStreak: 0, bestStreak: 0, lastActivityDate: null };
        progress.totalXp += xp;
        await dbSet(DB_KEYS.userProgress, progress);
      }

      set((state) => ({
        achievements: [...state.achievements, achievementId],
        progress: {
          ...state.progress,
          totalXp: state.progress.totalXp + xp,
        },
      }));

      const achievement = getAchievementById(achievementId);
      if (achievement) {
        useNotificationsStore.getState().pushToast({
          kind: 'achievement',
          title: achievement.name,
          description: achievement.description,
          detail: getAchievementFlavorText(achievementId),
          xp: achievement.xp,
          icon: achievement.icon,
        });
      }
    } catch (error) {
      console.error('Error unlocking achievement:', error);
    }
  },

  updateStreaks: async () => {
    try {
      const dailyStats = get().dailyStats;
      const dates = dailyStats.map((s) => s.date);
      const { current, best } = calculateStreaks(dates);
      const userId = await getCurrentUserId();

      if (userId) {
        await supaUpdateUserProgress(userId, { currentStreak: current, bestStreak: best });
      } else {
        const progress = (await dbGet<UserProgress>(DB_KEYS.userProgress)) ?? { totalXp: 0, currentStreak: 0, bestStreak: 0, lastActivityDate: null };
        progress.currentStreak = current;
        progress.bestStreak = best;
        await dbSet(DB_KEYS.userProgress, progress);
      }

      set((state) => ({
        progress: {
          ...state.progress,
          currentStreak: current,
          bestStreak: best,
        },
      }));
    } catch (error) {
      console.error('Error updating streaks:', error);
    }
  },

  exportCSV: async () => {
    try {
      const { dailyStats } = get();
      const headers = 'Date,Mode,Pomodoros,Focus Minutes\n';
      const rows = dailyStats
        .map((stat) => `${stat.date},${stat.modeId},${stat.pomodorosCompleted},${stat.totalFocusMinutes}`)
        .join('\n');
      const csvContent = headers + rows;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pomodore-stats.csv';
      a.click();
      URL.revokeObjectURL(url);

      const { achievements } = get();
      if (!achievements.includes('export_data')) {
        await get().unlockAchievement('export_data', 'special', 15);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      throw error;
    }
  },

  resetData: async () => {
    try {
      const userId = await getCurrentUserId();
      if (userId) {
        const { error: dsErr } = await import('@/lib/supabase').then((m) =>
          m.supabase.from('daily_stats').delete().eq('user_id', userId)
        );
        if (dsErr) throw dsErr;
        const { error: aErr } = await import('@/lib/supabase').then((m) =>
          m.supabase.from('achievements').delete().eq('user_id', userId)
        );
        if (aErr) throw aErr;
        await supaUpdateUserProgress(userId, { totalXp: 0, currentStreak: 0, bestStreak: 0, lastActivityDate: null });
      } else {
        await dbSet(DB_KEYS.dailyStats, []);
        await dbSet(DB_KEYS.achievements, []);
        const progress = (await dbGet<UserProgress>(DB_KEYS.userProgress)) ?? { totalXp: 0, currentStreak: 0, bestStreak: 0, lastActivityDate: null };
        progress.totalXp = 0;
        progress.currentStreak = 0;
        progress.bestStreak = 0;
        progress.lastActivityDate = null;
        await dbSet(DB_KEYS.userProgress, progress);
      }
      await get().loadStats();
    } catch (error) {
      console.error('Error resetting data:', error);
      throw error;
    }
  },
}));
