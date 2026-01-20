import { create } from 'zustand';
import Database from '@tauri-apps/plugin-sql';
import { save } from '@tauri-apps/plugin-dialog';
import type { DailyStats, UserProgress } from '@/domain/scoring/ScoreEngine';
import { calculateStreaks } from '@/domain/utils/dateUtils';

interface DailyStatsRow {
  date: string;
  mode_id: string;
  pomodoros_completed: number;
  total_focus_minutes: number;
}

interface AchievementRow {
  id: string;
  unlocked_at: string;
  category: string;
}

interface ProgressRow {
  total_xp: number;
  current_streak: number;
  best_streak: number;
  last_activity_date: string | null;
}

interface StatsStore {
  dailyStats: DailyStats[];
  achievements: string[];
  progress: UserProgress;
  loading: boolean;
  db: Database | null;

  initDb: () => Promise<void>;
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
  db: null,

  initDb: async () => {
    try {
      const db = await Database.load('sqlite:pomodore.db');
      set({ db });
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  },

  loadStats: async () => {
    try {
      set({ loading: true });
      let { db } = get();
      if (!db) {
        await get().initDb();
        db = get().db;
        if (!db) {
          console.error('Failed to initialize database');
          set({ loading: false });
          return;
        }
      }

      // Load daily stats
      const dailyStatsRows = await db.select<DailyStatsRow[]>(
        'SELECT * FROM daily_stats ORDER BY date DESC'
      );

      const dailyStats: DailyStats[] = dailyStatsRows.map((row) => ({
        date: row.date,
        modeId: row.mode_id,
        pomodorosCompleted: row.pomodoros_completed,
        totalFocusMinutes: row.total_focus_minutes,
      }));

      // Load achievements
      const achievementRows = await db.select<AchievementRow[]>(
        'SELECT * FROM achievements'
      );

      const achievements = achievementRows.map((a) => a.id);

      // Load progress
      const progressRows = await db.select<ProgressRow[]>(
        'SELECT * FROM user_progress WHERE id = 1'
      );

      // Calcular streaks inline para evitar loop infinito
      const dates = dailyStats.map((s) => s.date);
      const { current, best } = calculateStreaks(dates);

      const progress: UserProgress = progressRows[0]
        ? {
            totalXp: progressRows[0].total_xp,
            currentStreak: current,
            bestStreak: Math.max(best, progressRows[0].best_streak),
            lastActivityDate: progressRows[0].last_activity_date,
          }
        : {
            totalXp: 0,
            currentStreak: current,
            bestStreak: best,
            lastActivityDate: null,
          };

      set({
        dailyStats,
        achievements,
        progress,
        loading: false,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      set({ loading: false });
    }
  },

  unlockAchievement: async (achievementId, category, xp) => {
    try {
      const { db, achievements: currentAchievements } = get();
      if (!db) return;

      // Verificar se já foi desbloqueado
      if (currentAchievements.includes(achievementId)) {
        return;
      }

      const now = new Date().toISOString();

      await db.execute(
        'INSERT OR IGNORE INTO achievements (id, unlocked_at, category) VALUES ($1, $2, $3)',
        [achievementId, now, category]
      );

      // Update XP
      await db.execute(
        'UPDATE user_progress SET total_xp = total_xp + $1 WHERE id = 1',
        [xp]
      );

      // Atualizar state incrementalmente sem recarregar tudo
      set((state) => ({
        achievements: [...state.achievements, achievementId],
        progress: {
          ...state.progress,
          totalXp: state.progress.totalXp + xp,
        },
      }));
    } catch (error) {
      console.error('Error unlocking achievement:', error);
    }
  },

  updateStreaks: async () => {
    try {
      const { dailyStats, db } = get();
      if (!db) return;

      const dates = dailyStats.map((s) => s.date);
      const { current, best } = calculateStreaks(dates);

      await db.execute(
        'UPDATE user_progress SET current_streak = $1, best_streak = $2 WHERE id = 1',
        [current, best]
      );

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
      const path = await save({
        filters: [
          {
            name: 'CSV',
            extensions: ['csv'],
          },
        ],
        defaultPath: 'pomodore-stats.csv',
      });

      if (path) {
        const { dailyStats } = get();

        // Generate CSV content
        const headers = 'Date,Mode,Pomodoros,Focus Minutes\n';
        const rows = dailyStats
          .map(
            (stat) =>
              `${stat.date},${stat.modeId},${stat.pomodorosCompleted},${stat.totalFocusMinutes}`
          )
          .join('\n');

        const csvContent = headers + rows;

        // Write to file using fs (would need tauri-plugin-fs or similar)
        // For now, we'll use the browser API as fallback
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pomodore-stats.csv';
        a.click();
        URL.revokeObjectURL(url);

        // Desbloquear achievement de export se ainda não foi
        const { achievements } = get();
        if (!achievements.includes('export_data')) {
          await get().unlockAchievement('export_data', 'special', 15);
        }
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      throw error;
    }
  },

  resetData: async () => {
    try {
      const { db } = get();
      if (!db) return;

      await db.execute('DELETE FROM daily_stats');
      await db.execute('DELETE FROM achievements');
      await db.execute(
        'UPDATE user_progress SET total_xp = 0, current_streak = 0, best_streak = 0, last_activity_date = NULL WHERE id = 1'
      );

      await get().loadStats();
    } catch (error) {
      console.error('Error resetting data:', error);
      throw error;
    }
  },
}));
