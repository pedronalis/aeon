import { create } from 'zustand';
import { QuestEngine, type DailyQuest, type WeeklyQuest } from '@/domain/quests/QuestEngine';
import { formatDate } from '@/domain/utils/dateUtils';
import { useNotificationsStore } from './useNotificationsStore';
import { tableGet, tableSet, dbGet, dbSet, DB_KEYS } from '@/lib/storage';

interface QuestsStore {
  dailyQuests: DailyQuest[];
  weeklyQuests: WeeklyQuest[];
  loading: boolean;

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

  loadQuests: async () => {
    try {
      set({ loading: true });
      const today = formatDate(new Date());
      const weekStart = QuestEngine.getWeekStart(new Date());

      // Daily quests
      let dailyQuests = await tableGet<DailyQuest>(DB_KEYS.dailyQuests);
      const dailyToday = dailyQuests.filter((q) => q.date === today);
      if (dailyToday.length === 0) {
        const newDaily = QuestEngine.generateDailyQuests(today);
        dailyQuests = [...dailyQuests.filter((q) => q.date !== today), ...newDaily];
        await tableSet(DB_KEYS.dailyQuests, dailyQuests);
      } else {
        dailyQuests = dailyToday;
      }

      // Weekly quests
      let weeklyQuests = await tableGet<WeeklyQuest>(DB_KEYS.weeklyQuests);
      const weeklyThisWeek = weeklyQuests.filter((q) => q.weekStart === weekStart);
      if (weeklyThisWeek.length === 0) {
        const newWeekly = QuestEngine.generateWeeklyQuests(weekStart);
        weeklyQuests = [...weeklyQuests.filter((q) => q.weekStart !== weekStart), ...newWeekly];
        await tableSet(DB_KEYS.weeklyQuests, weeklyQuests);
      } else {
        weeklyQuests = weeklyThisWeek;
      }

      set({ dailyQuests, weeklyQuests, loading: false });
    } catch (error) {
      console.error('Error loading quests:', error);
      set({ loading: false });
    }
  },

  updateQuestProgress: async (questId: string, increment: number, isWeekly: boolean) => {
    try {
      const quests = isWeekly
        ? await tableGet<WeeklyQuest>(DB_KEYS.weeklyQuests)
        : await tableGet<DailyQuest>(DB_KEYS.dailyQuests);

      const quest = quests.find((q) => q.id === questId);
      if (!quest) return;

      const newProgress = Math.min(quest.currentProgress + increment, quest.target);
      const completed = newProgress >= quest.target;

      const updated = quests.map((q) =>
        q.id === questId ? { ...q, currentProgress: newProgress, completed } : q
      );

      if (isWeekly) await tableSet(DB_KEYS.weeklyQuests, updated);
      else await tableSet(DB_KEYS.dailyQuests, updated);

      if (completed && !quest.completed) {
        const progress = (await dbGet<{ totalXp: number }>(DB_KEYS.userProgress)) ?? { totalXp: 0 };
        progress.totalXp += quest.xpReward;
        await dbSet(DB_KEYS.userProgress, progress);
        console.log(`Quest completed: ${quest.name} (+${quest.xpReward} XP)`);
        notifyQuestCompletion(quest, isWeekly);
      }

      await get().loadQuests();
    } catch (error) {
      console.error('Error updating quest progress:', error);
    }
  },

  completeQuest: async (questId: string, isWeekly: boolean) => {
    try {
      const quests = isWeekly
        ? await tableGet<WeeklyQuest>(DB_KEYS.weeklyQuests)
        : await tableGet<DailyQuest>(DB_KEYS.dailyQuests);

      const quest = quests.find((q) => q.id === questId);
      if (!quest || quest.completed) return;

      const updated = quests.map((q) =>
        q.id === questId ? { ...q, completed: true, currentProgress: q.target } : q
      );

      if (isWeekly) await tableSet(DB_KEYS.weeklyQuests, updated);
      else await tableSet(DB_KEYS.dailyQuests, updated);

      const progress = (await dbGet<{ totalXp: number }>(DB_KEYS.userProgress)) ?? { totalXp: 0 };
      progress.totalXp += quest.xpReward;
      await dbSet(DB_KEYS.userProgress, progress);

      notifyQuestCompletion(quest, isWeekly);
      await get().loadQuests();
    } catch (error) {
      console.error('Error completing quest:', error);
    }
  },

  updatePerfectWeekProgress: async () => {
    try {
      const weekStart = QuestEngine.getWeekStart(new Date());
      const dailyStats = await tableGet<{ date: string; pomodorosCompleted: number }>(DB_KEYS.dailyStats);
      const statsRows = dailyStats.filter((s) => s.date >= weekStart && s.pomodorosCompleted > 0);
      const uniqueDays = statsRows.length;

      const quests = await tableGet<WeeklyQuest>(DB_KEYS.weeklyQuests);
      const quest = quests.find((q) => q.id === 'weekly_perfect_week');
      if (!quest) return;

      const completed = uniqueDays >= 7;
      const updated = quests.map((q) =>
        q.id === 'weekly_perfect_week'
          ? { ...q, currentProgress: Math.min(uniqueDays, 7), completed }
          : q
      );
      await tableSet(DB_KEYS.weeklyQuests, updated);

      if (completed && !quest.completed) {
        const progress = (await dbGet<{ totalXp: number }>(DB_KEYS.userProgress)) ?? { totalXp: 0 };
        progress.totalXp += quest.xpReward;
        await dbSet(DB_KEYS.userProgress, progress);
        console.log(`Quest completed: ${quest.name} (+${quest.xpReward} XP)`);
        notifyQuestCompletion(quest, true);
      }

      await get().loadQuests();
    } catch (error) {
      console.error('Error updating perfect week progress:', error);
    }
  },

  resetDailyQuests: async () => {
    try {
      const today = formatDate(new Date());
      const quests = await tableGet<DailyQuest>(DB_KEYS.dailyQuests);
      const filtered = quests.filter((q) => q.date >= today);
      await tableSet(DB_KEYS.dailyQuests, filtered);
      await get().loadQuests();
    } catch (error) {
      console.error('Error resetting daily quests:', error);
    }
  },

  resetWeeklyQuests: async () => {
    try {
      const weekStart = QuestEngine.getWeekStart(new Date());
      const quests = await tableGet<WeeklyQuest>(DB_KEYS.weeklyQuests);
      const filtered = quests.filter((q) => q.weekStart >= weekStart);
      await tableSet(DB_KEYS.weeklyQuests, filtered);
      await get().loadQuests();
    } catch (error) {
      console.error('Error resetting weekly quests:', error);
    }
  },
}));
