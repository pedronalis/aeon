import { create } from 'zustand';
import {
  type Task,
  type Subtask,
  type TaskFilter,
  type TaskWithSubtasks,
  type CreateTaskInput,
  type TaskUpdateInput,
} from '@/domain/tasks/Task';
import { TaskEngine } from '@/domain/tasks/TaskEngine';
import { formatDate } from '@/domain/utils/dateUtils';
import { useStatsStore } from './useStatsStore';
import { useNotificationsStore } from './useNotificationsStore';
import { tableGet, tableSet, dbGet, dbSet, DB_KEYS } from '@/lib/storage';
import { type UserProgress } from '@/domain/scoring/ScoreEngine';
import { getCurrentUserId, supaGetTasks, supaSetTasks, supaGetSubtasks, supaSetSubtasks, supaGetUserProgress, supaUpdateUserProgress } from '@/lib/supabaseStorage';

interface TasksStore {
  tasks: Task[];
  subtasks: Subtask[];
  filter: TaskFilter;
  loading: boolean;
  activeTaskId: string | null;

  loadTasks: (options?: { silent?: boolean }) => Promise<void>;

  createTask: (input: CreateTaskInput) => Promise<Task | null>;
  updateTask: (taskId: string, updates: TaskUpdateInput) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<number>;

  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (subtaskId: string) => Promise<number>;
  deleteSubtask: (subtaskId: string) => Promise<void>;
  updateSubtask: (subtaskId: string, title: string) => Promise<void>;
  reorderSubtasks: (taskId: string, subtaskIds: string[]) => Promise<void>;

  reorderTasks: (taskIds: string[]) => Promise<void>;

  setFilter: (filter: TaskFilter) => void;
  setActiveTask: (taskId: string | null) => void;

  getTaskWithSubtasks: (taskId: string) => TaskWithSubtasks | null;
  getFilteredTasks: () => Task[];
  linkPomodoro: (taskId: string) => Promise<void>;

  applyOverduePenalties: () => Promise<number>;
}

async function dbGetUserProgress(): Promise<UserProgress> {
  return (await dbGet<UserProgress>(DB_KEYS.userProgress)) ?? {
    totalXp: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastActivityDate: null,
  };
}

async function dbSetUserProgress(progress: UserProgress) {
  await dbSet(DB_KEYS.userProgress, progress);
}

export const useTasksStore = create<TasksStore>((set, get) => ({
  tasks: [],
  subtasks: [],
  filter: 'all',
  loading: false,
  activeTaskId: null,

  loadTasks: async (options) => {
    try {
      const silent = options?.silent ?? false;
      if (!silent) set({ loading: true });

      const userId = await getCurrentUserId();
      let tasks: Task[];
      let subtasks: Subtask[];

      if (userId) {
        tasks = await supaGetTasks(userId);
        subtasks = await supaGetSubtasks(userId);
      } else {
        tasks = await tableGet<Task>(DB_KEYS.tasks);
        subtasks = await tableGet<Subtask>(DB_KEYS.subtasks);
      }

      const updatedTasks = tasks.map((task) => {
        if (task.status === 'pending' && TaskEngine.isOverdue(task)) {
          return { ...task, status: 'overdue' as const };
        }
        return task;
      });

      if (JSON.stringify(tasks) !== JSON.stringify(updatedTasks)) {
        if (userId) {
          await supaSetTasks(userId, updatedTasks);
        } else {
          await tableSet(DB_KEYS.tasks, updatedTasks);
        }
      }

      set({ tasks: updatedTasks, subtasks, loading: false });
    } catch (error) {
      console.error('[TasksStore] Error loading tasks:', error);
      set({ loading: false });
    }
  },

  createTask: async (input: CreateTaskInput) => {
    try {
      const { tasks } = get();
      const task = TaskEngine.createTask(input);
      const maxSortOrder = tasks.length > 0 ? Math.max(...tasks.map((t) => t.sortOrder)) + 1 : 0;
      const newTask = { ...task, sortOrder: maxSortOrder };
      const newTasks = [...tasks, newTask];

      const userId = await getCurrentUserId();
      if (userId) {
        await supaSetTasks(userId, newTasks);
      } else {
        await tableSet(DB_KEYS.tasks, newTasks);
      }

      if (input.subtasks && input.subtasks.length > 0) {
        const createdSubs = TaskEngine.createSubtasks(task.id, input.subtasks, task.xpReward);
        const newSubtasks = [...get().subtasks, ...createdSubs];
        if (userId) {
          await supaSetSubtasks(userId, newSubtasks);
        } else {
          await tableSet(DB_KEYS.subtasks, newSubtasks);
        }
      }

      await get().loadTasks();
      return task;
    } catch (error) {
      console.error('[TasksStore] Error creating task:', error);
      return null;
    }
  },

  updateTask: async (taskId: string, updates: TaskUpdateInput) => {
    try {
      const { tasks, subtasks } = get();
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      let updatedTasks: Task[] = tasks.map((t) => (t.id === taskId ? { ...t, ...updates } as Task : t));

      if (updates.effort !== undefined && updates.effort !== task.effort) {
        const config = TaskEngine.getEffortConfig(updates.effort);
        updatedTasks = updatedTasks.map((t) => (t.id === taskId ? { ...t, xpReward: config.xpReward, xpPenalty: config.xpPenalty } : t));

        const taskSubtasks = subtasks.filter((s) => s.taskId === taskId);
        if (taskSubtasks.length > 0) {
          const xpPerSubtask = Math.floor(config.xpReward / taskSubtasks.length);
          const completedSubtasks = taskSubtasks.filter((s) => s.completed);
          const completedXpAfter = completedSubtasks.length * xpPerSubtask;
          const xpDelta = completedXpAfter - task.xpEarned;

          const updatedSubs = get().subtasks.map((s) => (s.taskId === taskId ? { ...s, xpReward: xpPerSubtask } : s));
          const userId = await getCurrentUserId();
          if (userId) {
            await supaSetSubtasks(userId, updatedSubs);
          } else {
            await tableSet(DB_KEYS.subtasks, updatedSubs);
          }

          updatedTasks = updatedTasks.map((t) =>
            t.id === taskId ? { ...t, xpEarned: Math.max(0, completedXpAfter) } : t
          );

          if (xpDelta !== 0) {
            if (userId) {
              const progress = (await supaGetUserProgress(userId)) ?? { totalXp: 0, currentStreak: 0, bestStreak: 0, lastActivityDate: null };
              await supaUpdateUserProgress(userId, { totalXp: Math.max(0, progress.totalXp + xpDelta) });
            } else {
              const progress = await dbGetUserProgress();
              progress.totalXp = Math.max(0, progress.totalXp + xpDelta);
              await dbSetUserProgress(progress);
            }
            await useStatsStore.getState().loadStats();
          }
        }
      }

      const userId = await getCurrentUserId();
      if (userId) {
        await supaSetTasks(userId, updatedTasks);
      } else {
        await tableSet(DB_KEYS.tasks, updatedTasks);
      }
      await get().loadTasks({ silent: true });
    } catch (error) {
      console.error('[TasksStore] Error updating task:', error);
    }
  },

  deleteTask: async (taskId: string) => {
    try {
      const { activeTaskId } = get();
      const tasks = get().tasks;
      const filteredTasks = tasks.filter((t) => t.id !== taskId);
      const filteredSubs = get().subtasks.filter((s) => s.taskId !== taskId);

      const userId = await getCurrentUserId();
      if (userId) {
        await supaSetTasks(userId, filteredTasks);
        await supaSetSubtasks(userId, filteredSubs);
      } else {
        await tableSet(DB_KEYS.tasks, filteredTasks);
        await tableSet(DB_KEYS.subtasks, filteredSubs);
      }

      if (activeTaskId === taskId) set({ activeTaskId: null });
      await get().loadTasks();
    } catch (error) {
      console.error('[TasksStore] Error deleting task:', error);
    }
  },

  completeTask: async (taskId: string) => {
    try {
      const { tasks, activeTaskId } = get();
      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.status === 'completed') return 0;

      const now = new Date();
      const completedAt = formatDate(now);
      const xpGained = TaskEngine.calculateCompletionXp(task, now);

      const updatedTasks = tasks.map((t) =>
        t.id === taskId
          ? { ...t, status: 'completed' as const, completedAt, xpEarned: t.xpReward + t.xpEarned }
          : t
      );

      const updatedSubs = get().subtasks.map((s) =>
        s.taskId === taskId && !s.completed ? { ...s, completed: true, completedAt } : s
      );

      const userId = await getCurrentUserId();
      if (userId) {
        await supaSetTasks(userId, updatedTasks);
        await supaSetSubtasks(userId, updatedSubs);
      } else {
        await tableSet(DB_KEYS.tasks, updatedTasks);
        await tableSet(DB_KEYS.subtasks, updatedSubs);
      }

      const totalXPEarned = xpGained + task.xpEarned + task.xpReward;
      if (totalXPEarned > 0) {
        if (userId) {
          const progress = (await supaGetUserProgress(userId)) ?? { totalXp: 0, currentStreak: 0, bestStreak: 0, lastActivityDate: null };
          await supaUpdateUserProgress(userId, { totalXp: progress.totalXp + totalXPEarned });
        } else {
          const progress = await dbGetUserProgress();
          progress.totalXp += totalXPEarned;
          await dbSetUserProgress(progress);
        }
      }

      if (activeTaskId === taskId) set({ activeTaskId: null });
      await get().loadTasks();
      await checkTaskAchievements(tasks);
      return totalXPEarned;
    } catch (error) {
      console.error('[TasksStore] Error completing task:', error);
      return 0;
    }
  },

  addSubtask: async (taskId: string, title: string) => {
    try {
      const { tasks, subtasks } = get();
      const trimmedTitle = title.trim();
      if (!trimmedTitle) return;

      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.status === 'completed') return;

      const existingSubtasks = subtasks.filter((s) => s.taskId === taskId);
      if (existingSubtasks.length >= 10) return;
      const order = existingSubtasks.length;

      const totalSubtasks = existingSubtasks.length + 1;
      const xpPerSubtask = Math.floor(task.xpReward / totalSubtasks);
      const completedSubtasks = existingSubtasks.filter((s) => s.completed);
      const completedXpAfter = completedSubtasks.length * xpPerSubtask;
      const xpDelta = completedXpAfter - task.xpEarned;

      const newSubtask: Subtask = {
        id: TaskEngine.generateId(),
        taskId,
        title: trimmedTitle,
        completed: false,
        xpReward: xpPerSubtask,
        order,
      };

      const updatedSubs = get().subtasks.map((s) => (s.taskId === taskId ? { ...s, xpReward: xpPerSubtask } : s));
      const newSubtasks = [...updatedSubs, newSubtask];
      const newTasks = tasks.map((t) => (t.id === taskId ? { ...t, xpEarned: Math.max(0, completedXpAfter) } : t));

      const userId = await getCurrentUserId();
      if (userId) {
        await supaSetTasks(userId, newTasks);
        await supaSetSubtasks(userId, newSubtasks);
      } else {
        await tableSet(DB_KEYS.tasks, newTasks);
        await tableSet(DB_KEYS.subtasks, newSubtasks);
      }

      if (xpDelta !== 0) {
        if (userId) {
          const progress = (await supaGetUserProgress(userId)) ?? { totalXp: 0, currentStreak: 0, bestStreak: 0, lastActivityDate: null };
          await supaUpdateUserProgress(userId, { totalXp: Math.max(0, progress.totalXp + xpDelta) });
        } else {
          const progress = await dbGetUserProgress();
          progress.totalXp = Math.max(0, progress.totalXp + xpDelta);
          await dbSetUserProgress(progress);
        }
        await useStatsStore.getState().loadStats();
      }

      await get().loadTasks({ silent: true });
    } catch (error) {
      console.error('[TasksStore] Error adding subtask:', error);
    }
  },

  toggleSubtask: async (subtaskId: string) => {
    try {
      const { subtasks, tasks } = get();
      const subtask = subtasks.find((s) => s.id === subtaskId);
      if (!subtask) return 0;

      const task = tasks.find((t) => t.id === subtask.taskId);
      if (!task || task.status === 'completed') return 0;

      const newCompleted = !subtask.completed;
      const now = formatDate(new Date());
      const xpChange = newCompleted ? subtask.xpReward : -subtask.xpReward;

      const updatedSubtasks = subtasks.map((s) =>
        s.id === subtaskId
          ? { ...s, completed: newCompleted, completedAt: newCompleted ? now : undefined }
          : s
      );

      const updatedTasks = tasks.map((t) =>
        t.id === subtask.taskId ? { ...t, xpEarned: Math.max(0, t.xpEarned + xpChange) } : t
      );

      const userId = await getCurrentUserId();
      if (userId) {
        await supaSetSubtasks(userId, updatedSubtasks);
        await supaSetTasks(userId, updatedTasks);
      } else {
        await tableSet(DB_KEYS.subtasks, updatedSubtasks);
        await tableSet(DB_KEYS.tasks, updatedTasks);
      }

      if (xpChange !== 0) {
        if (userId) {
          const progress = (await supaGetUserProgress(userId)) ?? { totalXp: 0, currentStreak: 0, bestStreak: 0, lastActivityDate: null };
          await supaUpdateUserProgress(userId, { totalXp: Math.max(0, progress.totalXp + xpChange) });
        } else {
          const progress = await dbGetUserProgress();
          progress.totalXp = Math.max(0, progress.totalXp + xpChange);
          await dbSetUserProgress(progress);
        }
        await useStatsStore.getState().loadStats();
      }

      return xpChange;
    } catch (error) {
      console.error('[TasksStore] Error toggling subtask:', error);
      return 0;
    }
  },

  deleteSubtask: async (subtaskId: string) => {
    try {
      const { subtasks, tasks } = get();
      const subtask = subtasks.find((s) => s.id === subtaskId);
      if (!subtask) return;

      const task = tasks.find((t) => t.id === subtask.taskId);
      if (!task || task.status === 'completed') return;

      const taskSubtasks = subtasks.filter((s) => s.taskId === subtask.taskId);
      const remainingSubtasks = taskSubtasks.filter((s) => s.id !== subtaskId);
      const completedXpBefore = taskSubtasks.filter((s) => s.completed).reduce((sum, s) => sum + s.xpReward, 0);

      const userId = await getCurrentUserId();

      if (remainingSubtasks.length > 0) {
        const xpPerSubtask = Math.floor(task.xpReward / remainingSubtasks.length);
        const completedXpAfter = remainingSubtasks.filter((s) => s.completed).length * xpPerSubtask;
        const xpDelta = completedXpAfter - completedXpBefore;

        const updatedSubs = get().subtasks
          .filter((s) => s.id !== subtaskId)
          .map((s) => (s.taskId === subtask.taskId ? { ...s, xpReward: xpPerSubtask } : s));
        const updatedTasks = tasks.map((t) =>
          t.id === subtask.taskId ? { ...t, xpEarned: Math.max(0, completedXpAfter) } : t
        );

        if (userId) {
          await supaSetSubtasks(userId, updatedSubs);
          await supaSetTasks(userId, updatedTasks);
        } else {
          await tableSet(DB_KEYS.subtasks, updatedSubs);
          await tableSet(DB_KEYS.tasks, updatedTasks);
        }

        if (xpDelta !== 0) {
          if (userId) {
            const progress = (await supaGetUserProgress(userId)) ?? { totalXp: 0, currentStreak: 0, bestStreak: 0, lastActivityDate: null };
            await supaUpdateUserProgress(userId, { totalXp: Math.max(0, progress.totalXp + xpDelta) });
          } else {
            const progress = await dbGetUserProgress();
            progress.totalXp = Math.max(0, progress.totalXp + xpDelta);
            await dbSetUserProgress(progress);
          }
          await useStatsStore.getState().loadStats();
        }
      } else {
        const xpDelta = -completedXpBefore;
        const updatedSubs = get().subtasks.filter((s) => s.id !== subtaskId);
        const updatedTasks = tasks.map((t) => (t.id === subtask.taskId ? { ...t, xpEarned: 0 } : t));

        if (userId) {
          await supaSetSubtasks(userId, updatedSubs);
          await supaSetTasks(userId, updatedTasks);
        } else {
          await tableSet(DB_KEYS.subtasks, updatedSubs);
          await tableSet(DB_KEYS.tasks, updatedTasks);
        }

        if (xpDelta !== 0) {
          if (userId) {
            const progress = (await supaGetUserProgress(userId)) ?? { totalXp: 0, currentStreak: 0, bestStreak: 0, lastActivityDate: null };
            await supaUpdateUserProgress(userId, { totalXp: Math.max(0, progress.totalXp + xpDelta) });
          } else {
            const progress = await dbGetUserProgress();
            progress.totalXp = Math.max(0, progress.totalXp + xpDelta);
            await dbSetUserProgress(progress);
          }
          await useStatsStore.getState().loadStats();
        }
      }

      await get().loadTasks({ silent: true });
    } catch (error) {
      console.error('[TasksStore] Error deleting subtask:', error);
    }
  },

  updateSubtask: async (subtaskId: string, title: string) => {
    try {
      const { subtasks, tasks } = get();
      const trimmedTitle = title.trim();
      if (!trimmedTitle) return;

      const subtask = subtasks.find((s) => s.id === subtaskId);
      if (!subtask) return;

      const task = tasks.find((t) => t.id === subtask.taskId);
      if (!task || task.status === 'completed') return;
      if (subtask.title === trimmedTitle) return;

      const updatedSubtasks = subtasks.map((s) =>
        s.id === subtaskId ? { ...s, title: trimmedTitle } : s
      );
      const userId = await getCurrentUserId();
      if (userId) {
        await supaSetSubtasks(userId, updatedSubtasks);
      } else {
        await tableSet(DB_KEYS.subtasks, updatedSubtasks);
      }
      set({ subtasks: updatedSubtasks });
    } catch (error) {
      console.error('[TasksStore] Error updating subtask:', error);
    }
  },

  setFilter: (filter: TaskFilter) => {
    set({ filter });
  },

  setActiveTask: (taskId: string | null) => {
    const { activeTaskId, tasks } = get();
    if (activeTaskId === taskId) return;
    set({ activeTaskId: taskId });

    const notifications = useNotificationsStore.getState();
    if (taskId) {
      const task = tasks.find((t) => t.id === taskId);
      notifications.pushToast({
        kind: 'timer',
        title: activeTaskId ? 'Pergaminho trocado' : 'Pergaminho vinculado',
        description: task?.title ?? undefined,
        icon: '📜',
      });
    } else if (activeTaskId) {
      const previous = tasks.find((t) => t.id === activeTaskId);
      notifications.pushToast({
        kind: 'timer',
        title: 'Pergaminho desvinculado',
        description: previous?.title ?? 'Sem pergaminho ativo',
        icon: '🕯️',
      });
    }
  },

  getTaskWithSubtasks: (taskId: string) => {
    const { tasks, subtasks } = get();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return null;

    return {
      ...task,
      subtasks: subtasks
        .filter((s) => s.taskId === taskId)
        .sort((a, b) => a.order - b.order),
    };
  },

  getFilteredTasks: () => {
    const { tasks, filter } = get();
    let filtered: Task[];

    switch (filter) {
      case 'pending':
        filtered = tasks.filter((t) => t.status === 'pending');
        break;
      case 'completed':
        filtered = tasks.filter((t) => t.status === 'completed');
        break;
      case 'overdue':
        filtered = tasks.filter((t) => t.status === 'overdue');
        break;
      default:
        filtered = tasks;
    }

    const sorted = [...filtered].sort((a, b) => a.sortOrder - b.sortOrder);

    if (filter === 'all') {
      const statusRank = (task: Task) => {
        if (task.status === 'overdue') return 0;
        if (task.status === 'pending') return 1;
        return 2;
      };

      return [...sorted].sort((a, b) => {
        const rankDiff = statusRank(a) - statusRank(b);
        if (rankDiff !== 0) return rankDiff;
        return a.sortOrder - b.sortOrder;
      });
    }

    return sorted;
  },

  linkPomodoro: async (taskId: string) => {
    try {
      const tasks = get().tasks;
      const updated = tasks.map((t) => (t.id === taskId ? { ...t, linkedPomodoros: t.linkedPomodoros + 1 } : t));
      const userId = await getCurrentUserId();
      if (userId) {
        await supaSetTasks(userId, updated);
      } else {
        await tableSet(DB_KEYS.tasks, updated);
      }
      await get().loadTasks();
    } catch (error) {
      console.error('[TasksStore] Error linking pomodoro:', error);
    }
  },

  applyOverduePenalties: async () => {
    try {
      const { tasks } = get();
      const overdueTasks = TaskEngine.getTasksForPenalty(tasks);
      if (overdueTasks.length === 0) return 0;

      let totalPenalty = 0;
      const updatedTasks = tasks.map((t) => {
        const overdue = overdueTasks.find((o) => o.id === t.id);
        if (overdue) {
          totalPenalty += t.xpPenalty;
          return { ...t, status: 'overdue' as const, penaltyApplied: true };
        }
        return t;
      });

      const userId = await getCurrentUserId();
      if (userId) {
        await supaSetTasks(userId, updatedTasks);
      } else {
        await tableSet(DB_KEYS.tasks, updatedTasks);
      }

      if (totalPenalty > 0) {
        if (userId) {
          const progress = (await supaGetUserProgress(userId)) ?? { totalXp: 0, currentStreak: 0, bestStreak: 0, lastActivityDate: null };
          await supaUpdateUserProgress(userId, { totalXp: Math.max(0, progress.totalXp - totalPenalty) });
        } else {
          const progress = await dbGetUserProgress();
          progress.totalXp = Math.max(0, progress.totalXp - totalPenalty);
          await dbSetUserProgress(progress);
        }
        await get().loadTasks({ silent: true });
        await useStatsStore.getState().loadStats();
        useNotificationsStore.getState().pushToast({
          kind: 'xp',
          title: 'Penalidade aplicada',
          description: `${overdueTasks.length} pergaminho(s) vencido(s) • -${totalPenalty} XP`,
          icon: '⚖️',
        });
      }

      return totalPenalty;
    } catch (error) {
      console.error('[TasksStore] Error applying penalties:', error);
      return 0;
    }
  },

  reorderTasks: async (taskIds: string[]) => {
    try {
      const { tasks } = get();
      const updatedTasks = tasks.map((t) => {
        const newOrder = taskIds.indexOf(t.id);
        return newOrder >= 0 ? { ...t, sortOrder: newOrder } : t;
      });
      const userId = await getCurrentUserId();
      if (userId) {
        await supaSetTasks(userId, updatedTasks);
      } else {
        await tableSet(DB_KEYS.tasks, updatedTasks);
      }
      set({ tasks: updatedTasks });
    } catch (error) {
      console.error('[TasksStore] Error reordering tasks:', error);
    }
  },

  reorderSubtasks: async (taskId: string, subtaskIds: string[]) => {
    try {
      const { subtasks } = get();
      const updatedSubtasks = subtasks.map((s) => {
        if (s.taskId !== taskId) return s;
        const newOrder = subtaskIds.indexOf(s.id);
        return newOrder >= 0 ? { ...s, order: newOrder } : s;
      });
      const userId = await getCurrentUserId();
      if (userId) {
        await supaSetSubtasks(userId, updatedSubtasks);
      } else {
        await tableSet(DB_KEYS.subtasks, updatedSubtasks);
      }
      set({ subtasks: updatedSubtasks });
    } catch (error) {
      console.error('[TasksStore] Error reordering subtasks:', error);
    }
  },
}));

async function checkTaskAchievements(tasks: Task[]) {
  const statsStore = useStatsStore.getState();
  const achievements = statsStore.achievements;

  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const totalCompleted = completedTasks.length;

  if (!achievements.includes('first_task') && totalCompleted >= 1) {
    await statsStore.unlockAchievement('first_task', 'tasks', 10);
  }

  if (!achievements.includes('task_total_25') && totalCompleted >= 25) {
    await statsStore.unlockAchievement('task_total_25', 'tasks', 40);
  }

  if (!achievements.includes('task_total_100') && totalCompleted >= 100) {
    await statsStore.unlockAchievement('task_total_100', 'tasks', 120);
  }

  const onTimeTasks = completedTasks.filter((t) => {
    if (!t.deadline || !t.completedAt) return false;
    return t.completedAt <= t.deadline;
  });

  if (!achievements.includes('task_streak_5') && onTimeTasks.length >= 5) {
    await statsStore.unlockAchievement('task_streak_5', 'tasks', 30);
  }

  if (!achievements.includes('task_streak_10') && onTimeTasks.length >= 10) {
    await statsStore.unlockAchievement('task_streak_10', 'tasks', 60);
  }

  const earlyTasks = completedTasks.filter((t) => {
    if (!t.deadline || !t.completedAt) return false;
    const deadline = new Date(t.deadline);
    const completed = new Date(t.completedAt);
    return completed.getTime() < deadline.getTime() - 24 * 60 * 60 * 1000;
  });

  if (!achievements.includes('task_early') && earlyTasks.length >= 3) {
    await statsStore.unlockAchievement('task_early', 'tasks', 40);
  }

  const epicTasks = completedTasks.filter((t) => t.effort === 'epic' || t.effort === 'legendary');

  if (!achievements.includes('task_epic') && epicTasks.length >= 10) {
    await statsStore.unlockAchievement('task_epic', 'tasks', 50);
  }

  const recentlyCompleted = completedTasks[completedTasks.length - 1];
  if (recentlyCompleted) {
    if (!achievements.includes('task_linked') && recentlyCompleted.linkedPomodoros >= 10) {
      await statsStore.unlockAchievement('task_linked', 'tasks', 25);
    }
    if (!achievements.includes('task_linked_25') && recentlyCompleted.linkedPomodoros >= 25) {
      await statsStore.unlockAchievement('task_linked_25', 'tasks', 60);
    }
  }

  await statsStore.loadStats();
}
