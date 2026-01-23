import { create } from 'zustand';
import Database from '@tauri-apps/plugin-sql';
import { QuestEngine, type DailyQuest, type WeeklyQuest } from '@/domain/quests/QuestEngine';
import { formatDate } from '@/domain/utils/dateUtils';
import { useNotificationsStore } from './useNotificationsStore';

interface DailyQuestRow {
  id: string;
  name: string;
  description: string;
  target: number;
  current_progress: number;
  completed: number;
  date: string;
  xp_reward: number;
}

interface WeeklyQuestRow {
  id: string;
  name: string;
  description: string;
  target: number;
  current_progress: number;
  completed: number;
  week_start: string;
  xp_reward: number;
}

interface QuestsStore {
  dailyQuests: DailyQuest[];
  weeklyQuests: WeeklyQuest[];
  loading: boolean;
  db: Database | null;

  initDb: () => Promise<void>;
  loadQuests: () => Promise<void>;
  updateQuestProgress: (questId: string, increment: number, isWeekly: boolean) => Promise<void>;
  updatePerfectWeekProgress: () => Promise<void>;
  resetDailyQuests: () => Promise<void>;
  resetWeeklyQuests: () => Promise<void>;
  completeQuest: (questId: string, isWeekly: boolean) => Promise<void>;
}

function notifyQuestCompletion(quest: DailyQuest | WeeklyQuest, isWeekly: boolean) {
  useNotificationsStore.getState().pushToast({
    kind: 'quest',
    title: isWeekly ? 'Missão semanal selada' : 'Missão diária selada',
    description: quest.name,
    xp: quest.xpReward,
    icon: '📜',
  });
}

export const useQuestsStore = create<QuestsStore>((set, get) => ({
  dailyQuests: [],
  weeklyQuests: [],
  loading: false,
  db: null,

  initDb: async () => {
    if (get().db) return;
    try {
      const db = await Database.load('sqlite:pomodore.db');
      set({ db });
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  },

  loadQuests: async () => {
    try {
      set({ loading: true });
      let { db } = get();
      if (!db) {
        await get().initDb();
        db = get().db;
        if (!db) {
          set({ loading: false });
          return; // Não conseguiu conectar, sai sem loop
        }
      }

      const today = formatDate(new Date());
      const weekStart = QuestEngine.getWeekStart(new Date());

      // Load or generate daily quests
      const dailyRows = await db.select<DailyQuestRow[]>(
        'SELECT * FROM daily_quests WHERE date = $1',
        [today]
      );

      let dailyQuests: DailyQuest[];
      if (dailyRows.length === 0) {
        // Generate new daily quests
        dailyQuests = QuestEngine.generateDailyQuests(today);
        
        // Save to database
        for (const quest of dailyQuests) {
          await db.execute(
            'INSERT OR IGNORE INTO daily_quests (id, name, description, target, current_progress, completed, date, xp_reward) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [quest.id, quest.name, quest.description, quest.target, 0, 0, quest.date, quest.xpReward]
          );
        }
      } else {
        dailyQuests = dailyRows.map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          target: row.target,
          currentProgress: row.current_progress,
          completed: row.completed === 1,
          date: row.date,
          xpReward: row.xp_reward,
        }));
      }

      // Load or generate weekly quests
      const weeklyRows = await db.select<WeeklyQuestRow[]>(
        'SELECT * FROM weekly_quests WHERE week_start = $1',
        [weekStart]
      );

      let weeklyQuests: WeeklyQuest[];
      if (weeklyRows.length === 0) {
        // Generate new weekly quests
        weeklyQuests = QuestEngine.generateWeeklyQuests(weekStart);
        
        // Save to database
        for (const quest of weeklyQuests) {
          await db.execute(
            'INSERT OR IGNORE INTO weekly_quests (id, name, description, target, current_progress, completed, week_start, xp_reward) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [quest.id, quest.name, quest.description, quest.target, 0, 0, quest.weekStart, quest.xpReward]
          );
        }
      } else {
        weeklyQuests = weeklyRows.map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          target: row.target,
          currentProgress: row.current_progress,
          completed: row.completed === 1,
          weekStart: row.week_start,
          xpReward: row.xp_reward,
        }));
      }

      set({ dailyQuests, weeklyQuests, loading: false });
    } catch (error) {
      console.error('Error loading quests:', error);
      set({ loading: false });
    }
  },

  updateQuestProgress: async (questId: string, increment: number, isWeekly: boolean) => {
    try {
      const { db } = get();
      if (!db) return;

      const table = isWeekly ? 'weekly_quests' : 'daily_quests';
      const quests = isWeekly ? get().weeklyQuests : get().dailyQuests;
      
      const quest = quests.find((q) => q.id === questId);
      if (!quest) return;

      // Update progress
      const newProgress = Math.min(quest.currentProgress + increment, quest.target);
      const completed = newProgress >= quest.target;

      const dateKey = isWeekly ? (quest as WeeklyQuest).weekStart : (quest as DailyQuest).date;
      const dateColumn = isWeekly ? 'week_start' : 'date';
      await db.execute(
        `UPDATE ${table} SET current_progress = $1, completed = $2 WHERE id = $3 AND ${dateColumn} = $4`,
        [newProgress, completed ? 1 : 0, questId, dateKey]
      );

      // If quest was just completed, award XP
      if (completed && !quest.completed) {
        await db.execute(
          'UPDATE user_progress SET total_xp = total_xp + $1 WHERE id = 1',
          [quest.xpReward]
        );

        console.log(`Quest completed: ${quest.name} (+${quest.xpReward} XP)`);
        notifyQuestCompletion(quest, isWeekly);
      }

      // Reload quests to reflect changes
      await get().loadQuests();
    } catch (error) {
      console.error('Error updating quest progress:', error);
    }
  },

  completeQuest: async (questId: string, isWeekly: boolean) => {
    try {
      const { db } = get();
      if (!db) return;

      const table = isWeekly ? 'weekly_quests' : 'daily_quests';
      const quests = isWeekly ? get().weeklyQuests : get().dailyQuests;
      
      const quest = quests.find((q) => q.id === questId);
      if (!quest || quest.completed) return;

      const dateKey = isWeekly ? (quest as WeeklyQuest).weekStart : (quest as DailyQuest).date;
      const dateColumn = isWeekly ? 'week_start' : 'date';
      await db.execute(
        `UPDATE ${table} SET completed = 1, current_progress = target WHERE id = $1 AND ${dateColumn} = $2`,
        [questId, dateKey]
      );

      // Award XP
      await db.execute(
        'UPDATE user_progress SET total_xp = total_xp + $1 WHERE id = 1',
        [quest.xpReward]
      );

      notifyQuestCompletion(quest, isWeekly);

      await get().loadQuests();
    } catch (error) {
      console.error('Error completing quest:', error);
    }
  },

  updatePerfectWeekProgress: async () => {
    try {
      const { db } = get();
      if (!db) return;

      const weekStart = QuestEngine.getWeekStart(new Date());

      // Get all daily stats for this week
      const statsRows = await db.select<Array<{ date: string }>>(
        'SELECT DISTINCT date FROM daily_stats WHERE date >= $1 AND pomodoros_completed > 0 ORDER BY date',
        [weekStart]
      );

      // Count unique days with at least 1 pomodoro
      const uniqueDays = statsRows.length;

      // Update perfect week quest progress
      const quest = get().weeklyQuests.find((q) => q.id === 'weekly_perfect_week');
      if (!quest) return;

      const completed = uniqueDays >= 7;

      await db.execute(
        'UPDATE weekly_quests SET current_progress = $1, completed = $2 WHERE id = $3 AND week_start = $4',
        [uniqueDays, completed ? 1 : 0, 'weekly_perfect_week', quest.weekStart]
      );

      // If quest was just completed, award XP
      if (completed && !quest.completed) {
        await db.execute(
          'UPDATE user_progress SET total_xp = total_xp + $1 WHERE id = 1',
          [quest.xpReward]
        );

        console.log(`Quest completed: ${quest.name} (+${quest.xpReward} XP)`);
        notifyQuestCompletion(quest, true);
      }

      // Reload quests to reflect changes
      await get().loadQuests();
    } catch (error) {
      console.error('Error updating perfect week progress:', error);
    }
  },

  resetDailyQuests: async () => {
    try {
      const { db } = get();
      if (!db) return;

      const today = formatDate(new Date());

      // Delete old daily quests
      await db.execute('DELETE FROM daily_quests WHERE date < $1', [today]);

      // Reload to generate new quests for today
      await get().loadQuests();
    } catch (error) {
      console.error('Error resetting daily quests:', error);
    }
  },

  resetWeeklyQuests: async () => {
    try {
      const { db } = get();
      if (!db) return;

      const weekStart = QuestEngine.getWeekStart(new Date());

      // Delete old weekly quests
      await db.execute('DELETE FROM weekly_quests WHERE week_start < $1', [weekStart]);

      // Reload to generate new quests for this week
      await get().loadQuests();
    } catch (error) {
      console.error('Error resetting weekly quests:', error);
    }
  },
}));
