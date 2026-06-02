import { create } from 'zustand';
import { QuestEngine, type DailyQuest, type WeeklyQuest } from '@/domain/quests/QuestEngine';
import { formatDate } from '@/domain/utils/dateUtils';
import { useNotificationsStore } from './useNotificationsStore';
import { tableGet, tableSet, dbGet, dbSet, DB_KEYS } from '@/lib/storage';
import { getCurrentUserId, supaGetQuests, supaUpdateQuestProgress, supaInsertQuests } from '@/lib/supabaseStorage';

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
    title: isWeekly ? 'Missao semanal selada' : 'Missao diaria selada',
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
      const userId = await getCurrentUserId();
      const today = formatDate(new Date());
      const weekStart = QuestEngine.getWeekStart(new Date());

      let dailyQuests: DailyQuest[] = [];
      let weeklyQuests: WeeklyQuest[] = [];

      if (userId) {
        const { dailyQuests: storedDaily, weeklyQuests: storedWeekly } = await supaGetQuests(userId);
        const localDaily = storedDaily.filter((q) => q.date === today);
        const localWeekly = storedWeekly.filter((q) => q.weekStart === weekStart);

        if (localDaily.length === 0) {
          const newDaily = QuestEngine.generateDailyQuests(today);
          await supaInsertQuests(userId, newDaily);
          dailyQuests = newDaily;
        } else {
          dailyQuests = localDaily;
        }

        if (localWeekly.length === 0) {
          const newWeekly = QuestEngine.generateWeeklyQuests(weekStart);
          await supaInsertQuests(userId, newWeekly);
          weeklyQuests = newWeekly;
        } else {
          weeklyQuests = localWeekly;
        }
      } else {
        let storedDaily = await tableGet<DailyQuest>(DB_KEYS.dailyQuests);
        const dailyToday = storedDaily.filter((q) => q.date === today);
        if (dailyToday.length === 0) {
          const newDaily = QuestEngine.generateDailyQuests(today);
          storedDaily = [...storedDaily.filter((q) => q.date !== today), ...newDaily];
          await tableSet(DB_KEYS.dailyQuests, storedDaily);
          dailyQuests = newDaily;
        } else {
          dailyQuests = dailyToday;
        }

        let storedWeekly = await tableGet<WeeklyQuest>(DB_KEYS.weeklyQuests);
        const weeklyThisWeek = storedWeekly.filter((q) => q.weekStart === weekStart);
        if (weeklyThisWeek.length === 0) {
          const newWeekly = QuestEngine.generateWeeklyQuests(weekStart);
          storedWeekly = [...storedWeekly.filter((q) => q.weekStart !== weekStart), ...newWeekly];
          await tableSet(DB_KEYS.weeklyQuests, storedWeekly);
          weeklyQuests = newWeekly;
        } else {
          weeklyQuests = weeklyThisWeek;
        }
      }

      set({ dailyQuests, weeklyQuests, loading: false });
    } catch (error) {
      console.error('Error loading quests:', error);
      set({ loading: false });
    }
  },

  updateQuestProgress: async (questId: string, increment: number, isWeekly: boolean) => {
    try {
      const quests = isWeekly ? get().weeklyQuests : get().dailyQuests;
      const quest = quests.find((q) => q.id === questId);
      if (!quest) return;

      const newProgress = Math.min(quest.currentProgress + increment, quest.target);
      const completed = newProgress >= quest.target;

      const updated = quests.map((q) =>
        q.id === questId ? { ...q, currentProgress: newProgress, completed } : q
      );

      const userId = await getCurrentUserId();
      if (userId) {
        const cat = isWeekly ? 'weekly' as const : 'daily' as const;
        await supaUpdateQuestProgress(userId, {
          questId,
          category: cat,
          date: isWeekly ? null : (quest as DailyQuest).date,
          weekStart: isWeekly ? (quest as WeeklyQuest).weekStart : null,
          currentProgress: newProgress,
          completed,
        });
      } else {
        if (isWeekly) await tableSet(DB_KEYS.weeklyQuests, updated);
        else await tableSet(DB_KEYS.dailyQuests, updated);
      }

      if (completed && !quest.completed) {
        const progress = (await dbGet<{ totalXp: number }>(DB_KEYS.userProgress)) ?? { totalXp: 0 };
        progress.totalXp += quest.xpReward;
        if (userId) {
          await import('@/lib/supabase').then((m) => m.supabase.rpc('add_xp', { uid: userId, amount: quest.xpReward }));
        } else {
          await dbSet(DB_KEYS.userProgress, progress);
        }
        notifyQuestCompletion(quest, isWeekly);
      }

      await get().loadQuests();
    } catch (error) {
      console.error('Error updating quest progress:', error);
    }
  },

  completeQuest: async (questId: string, isWeekly: boolean) => {
    try {
      const quests = isWeekly ? get().weeklyQuests : get().dailyQuests;
      const quest = quests.find((q) => q.id === questId);
      if (!quest || quest.completed) return;

      const updated = quests.map((q) =>
        q.id === questId ? { ...q, completed: true, currentProgress: q.target } : q
      );

      const userId = await getCurrentUserId();
      if (userId) {
        const cat = isWeekly ? 'weekly' as const : 'daily' as const;
        await supaUpdateQuestProgress(userId, {
          questId,
          category: cat,
          date: isWeekly ? null : (quest as DailyQuest).date,
          weekStart: isWeekly ? (quest as WeeklyQuest).weekStart : null,
          currentProgress: quest.target,
          completed: true,
        });
      } else {
        if (isWeekly) await tableSet(DB_KEYS.weeklyQuests, updated);
        else await tableSet(DB_KEYS.dailyQuests, updated);
      }

      const progress = (await dbGet<{ totalXp: number }>(DB_KEYS.userProgress)) ?? { totalXp: 0 };
      progress.totalXp += quest.xpReward;
      if (userId) {
        const { data: row } = await import('@/lib/supabase').then((m) => m.supabase.from('user_progress').select('total_xp').eq('user_id', userId).single());
        await import('@/lib/supabase').then((m) =>
          m.supabase.from('user_progress').update({ total_xp: ((row?.total_xp ?? 0) + quest.xpReward) }).eq('user_id', userId)
        );
      } else {
        await dbSet(DB_KEYS.userProgress, progress);
      }

      notifyQuestCompletion(quest, isWeekly);
      await get().loadQuests();
    } catch (error) {
      console.error('Error completing quest:', error);
    }
  },

  updatePerfectWeekProgress: async () => {
    try {
      const weekStart = QuestEngine.getWeekStart(new Date());

      const userId = await getCurrentUserId();
      let statsRows: { date: string; pomodorosCompleted: number }[] = [];
      if (userId) {
        const { data, error } = await import('@/lib/supabase').then((m) =>
          m.supabase.from('daily_stats').select('date, pomodoros_completed').eq('user_id', userId)
        );
        if (error) throw error;
        statsRows = (data ?? []).map((r: Record<string, unknown>) => ({ date: r.date as string, pomodorosCompleted: r.pomodoros_completed as number }));
      } else {
        const dailyStats = await tableGet<{ date: string; pomodorosCompleted: number }>(DB_KEYS.dailyStats);
        statsRows = dailyStats;
      }

      const filtered = statsRows.filter((s) => s.date >= weekStart && s.pomodorosCompleted > 0);
      const uniqueDays = filtered.length;

      const quests = get().weeklyQuests;
      const quest = quests.find((q) => q.id === 'weekly_perfect_week');
      if (!quest) return;

      const completed = uniqueDays >= 7;
      const updated = quests.map((q) =>
        q.id === 'weekly_perfect_week'
          ? { ...q, currentProgress: Math.min(uniqueDays, 7), completed }
          : q
      );

      if (userId) {
        await supaUpdateQuestProgress(userId, {
          questId: 'weekly_perfect_week',
          category: 'weekly',
          date: null,
          weekStart,
          currentProgress: Math.min(uniqueDays, 7),
          completed,
        });
      } else {
        await tableSet(DB_KEYS.weeklyQuests, updated);
      }

      if (completed && !quest.completed) {
        const progress = (await dbGet<{ totalXp: number }>(DB_KEYS.userProgress)) ?? { totalXp: 0 };
        progress.totalXp += quest.xpReward;
        if (userId) {
          const { data } = await import('@/lib/supabase').then((m) => m.supabase.from('user_progress').select('total_xp').eq('user_id', userId).single());
          await import('@/lib/supabase').then((m) => m.supabase.from('user_progress').update({ total_xp: ((data?.total_xp ?? 0) + quest.xpReward) }).eq('user_id', userId));
        } else {
          await dbSet(DB_KEYS.userProgress, progress);
        }
        notifyQuestCompletion(quest, true);
      }

      await get().loadQuests();
    } catch (error) {
      console.error('Error updating perfect week progress:', error);
    }
  },

  resetDailyQuests: async () => {
    try {
      const userId = await getCurrentUserId();
      const today = formatDate(new Date());
      if (userId) {
        await import('@/lib/supabase').then((m) => m.supabase.from('quests').delete().eq('user_id', userId).eq('category', 'daily').lt('date', today));
      } else {
        const quests = await tableGet<DailyQuest>(DB_KEYS.dailyQuests);
        const filtered = quests.filter((q) => q.date >= today);
        await tableSet(DB_KEYS.dailyQuests, filtered);
      }
      await get().loadQuests();
    } catch (error) {
      console.error('Error resetting daily quests:', error);
    }
  },

  resetWeeklyQuests: async () => {
    try {
      const userId = await getCurrentUserId();
      const weekStart = QuestEngine.getWeekStart(new Date());
      if (userId) {
        await import('@/lib/supabase').then((m) => m.supabase.from('quests').delete().eq('user_id', userId).eq('category', 'weekly').lt('week_start', weekStart));
      } else {
        const quests = await tableGet<WeeklyQuest>(DB_KEYS.weeklyQuests);
        const filtered = quests.filter((q) => q.weekStart >= weekStart);
        await tableSet(DB_KEYS.weeklyQuests, filtered);
      }
      await get().loadQuests();
    } catch (error) {
      console.error('Error resetting weekly quests:', error);
    }
  },
}));
