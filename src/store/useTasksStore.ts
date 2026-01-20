import { create } from 'zustand';
import Database from '@tauri-apps/plugin-sql';
import {
  type Task,
  type Subtask,
  type TaskFilter,
  type TaskWithSubtasks,
  type CreateTaskInput,
  type TaskRow,
  type SubtaskRow,
  taskFromRow,
  subtaskFromRow,
} from '@/domain/tasks/Task';
import { TaskEngine } from '@/domain/tasks/TaskEngine';
import { formatDate } from '@/domain/utils/dateUtils';
import { useStatsStore } from './useStatsStore';

interface TasksStore {
  tasks: Task[];
  subtasks: Subtask[];
  filter: TaskFilter;
  loading: boolean;
  db: Database | null;
  activeTaskId: string | null;

  // Inicialização
  initDb: () => Promise<void>;
  loadTasks: () => Promise<void>;

  // CRUD Tasks
  createTask: (input: CreateTaskInput) => Promise<Task | null>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<number>; // Retorna XP ganho

  // Subtasks
  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (subtaskId: string) => Promise<number>; // Retorna XP ganho (ou 0)
  deleteSubtask: (subtaskId: string) => Promise<void>;
  reorderSubtasks: (taskId: string, subtaskIds: string[]) => Promise<void>;

  // Reordering
  reorderTasks: (taskIds: string[]) => Promise<void>;

  // Filtro e seleção
  setFilter: (filter: TaskFilter) => void;
  setActiveTask: (taskId: string | null) => void;

  // Helpers
  getTaskWithSubtasks: (taskId: string) => TaskWithSubtasks | null;
  getFilteredTasks: () => Task[];
  linkPomodoro: (taskId: string) => Promise<void>;

  // Penalidades
  applyOverduePenalties: () => Promise<number>; // Retorna total de XP perdido
}

export const useTasksStore = create<TasksStore>((set, get) => ({
  tasks: [],
  subtasks: [],
  filter: 'all',
  loading: false,
  db: null,
  activeTaskId: null,

  initDb: async () => {
    if (get().db) return;
    try {
      const db = await Database.load('sqlite:pomodore.db');
      set({ db });
    } catch (error) {
      console.error('[TasksStore] Error initializing database:', error);
      throw error;
    }
  },

  loadTasks: async () => {
    try {
      set({ loading: true });
      let { db } = get();

      if (!db) {
        await get().initDb();
        db = get().db;
        if (!db) {
          set({ loading: false });
          return;
        }
      }

      // Carregar todas as tasks (ordenadas por sort_order, depois por created_at)
      const taskRows = await db.select<TaskRow[]>(
        'SELECT * FROM tasks ORDER BY sort_order ASC, created_at DESC'
      );
      const tasks = taskRows.map(taskFromRow);

      // Carregar todas as subtasks
      const subtaskRows = await db.select<SubtaskRow[]>(
        'SELECT * FROM subtasks ORDER BY sort_order ASC'
      );
      const subtasks = subtaskRows.map(subtaskFromRow);

      // Verificar e marcar tasks atrasadas
      const updatedTasks = tasks.map((task) => {
        if (task.status === 'pending' && TaskEngine.isOverdue(task)) {
          return { ...task, status: 'overdue' as const };
        }
        return task;
      });

      // Atualizar status no banco para tasks marcadas como overdue
      for (const task of updatedTasks) {
        if (task.status === 'overdue') {
          const original = tasks.find((t) => t.id === task.id);
          if (original && original.status !== 'overdue') {
            await db.execute(
              'UPDATE tasks SET status = $1 WHERE id = $2',
              ['overdue', task.id]
            );
          }
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
      const { db, tasks } = get();
      if (!db) return null;

      // Criar a task
      const task = TaskEngine.createTask(input);

      // Calcular próximo sort_order (coloca no início da lista)
      const maxSortOrder = tasks.length > 0 ? Math.max(...tasks.map((t) => t.sortOrder)) + 1 : 0;

      // Inserir no banco
      await db.execute(
        `INSERT INTO tasks (id, title, description, effort, status, xp_reward, xp_penalty, xp_earned, deadline, created_at, linked_pomodoros, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          task.id,
          task.title,
          task.description ?? null,
          task.effort,
          task.status,
          task.xpReward,
          task.xpPenalty,
          task.xpEarned,
          task.deadline ?? null,
          task.createdAt,
          task.linkedPomodoros,
          maxSortOrder,
        ]
      );

      // Criar subtarefas se houver
      if (input.subtasks && input.subtasks.length > 0) {
        const subtasks = TaskEngine.createSubtasks(task.id, input.subtasks, task.xpReward);

        for (const subtask of subtasks) {
          await db.execute(
            `INSERT INTO subtasks (id, task_id, title, completed, xp_reward, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [subtask.id, subtask.taskId, subtask.title, 0, subtask.xpReward, subtask.order]
          );
        }
      }

      await get().loadTasks();
      return task;
    } catch (error) {
      console.error('[TasksStore] Error creating task:', error);
      return null;
    }
  },

  updateTask: async (taskId: string, updates: Partial<Task>) => {
    try {
      const { db } = get();
      if (!db) return;

      const fields: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      if (updates.title !== undefined) {
        fields.push(`title = $${paramIndex++}`);
        values.push(updates.title);
      }
      if (updates.description !== undefined) {
        fields.push(`description = $${paramIndex++}`);
        values.push(updates.description ?? null);
      }
      if (updates.effort !== undefined) {
        fields.push(`effort = $${paramIndex++}`);
        values.push(updates.effort);
        // Atualizar XP reward e penalty
        const config = TaskEngine.getEffortConfig(updates.effort);
        fields.push(`xp_reward = $${paramIndex++}`);
        values.push(config.xpReward);
        fields.push(`xp_penalty = $${paramIndex++}`);
        values.push(config.xpPenalty);
      }
      if (updates.deadline !== undefined) {
        fields.push(`deadline = $${paramIndex++}`);
        values.push(updates.deadline ?? null);
      }
      if (updates.status !== undefined) {
        fields.push(`status = $${paramIndex++}`);
        values.push(updates.status);
      }

      if (fields.length === 0) return;

      values.push(taskId);
      await db.execute(
        `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
        values
      );

      await get().loadTasks();
    } catch (error) {
      console.error('[TasksStore] Error updating task:', error);
    }
  },

  deleteTask: async (taskId: string) => {
    try {
      const { db, activeTaskId } = get();
      if (!db) return;

      // Deletar subtarefas primeiro (cascade deveria fazer isso, mas garantimos)
      await db.execute('DELETE FROM subtasks WHERE task_id = $1', [taskId]);

      // Deletar task
      await db.execute('DELETE FROM tasks WHERE id = $1', [taskId]);

      // Se era a task ativa, limpar
      if (activeTaskId === taskId) {
        set({ activeTaskId: null });
      }

      await get().loadTasks();
    } catch (error) {
      console.error('[TasksStore] Error deleting task:', error);
    }
  },

  completeTask: async (taskId: string) => {
    try {
      const { db, tasks, subtasks, activeTaskId } = get();
      if (!db) return 0;

      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.status === 'completed') return 0;

      const now = new Date();
      const completedAt = formatDate(now);

      // Calcular XP a ganhar
      const xpGained = TaskEngine.calculateCompletionXp(task, now);

      // Atualizar task
      await db.execute(
        'UPDATE tasks SET status = $1, completed_at = $2, xp_earned = xp_reward WHERE id = $3',
        ['completed', completedAt, taskId]
      );

      // Marcar todas as subtarefas como completas
      const taskSubtasks = subtasks.filter((s) => s.taskId === taskId);
      for (const subtask of taskSubtasks) {
        if (!subtask.completed) {
          await db.execute(
            'UPDATE subtasks SET completed = 1, completed_at = $1 WHERE id = $2',
            [completedAt, subtask.id]
          );
        }
      }

      // Adicionar XP ao usuário
      if (xpGained > 0) {
        await db.execute(
          'UPDATE user_progress SET total_xp = total_xp + $1 WHERE id = 1',
          [xpGained]
        );
      }

      // Se era a task ativa, limpar
      if (activeTaskId === taskId) {
        set({ activeTaskId: null });
      }

      await get().loadTasks();

      // Verificar achievements de tarefas
      await checkTaskAchievements(db, task, now);

      return xpGained;
    } catch (error) {
      console.error('[TasksStore] Error completing task:', error);
      return 0;
    }
  },

  addSubtask: async (taskId: string, title: string) => {
    try {
      const { db, tasks, subtasks } = get();
      if (!db) return;

      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      // Contar subtarefas existentes para determinar ordem
      const existingSubtasks = subtasks.filter((s) => s.taskId === taskId);
      const order = existingSubtasks.length;

      // Recalcular XP por subtarefa
      const totalSubtasks = existingSubtasks.length + 1;
      const xpPerSubtask = Math.floor(task.xpReward / totalSubtasks);

      // Criar nova subtarefa
      const newSubtask: Subtask = {
        id: TaskEngine.generateId(),
        taskId,
        title,
        completed: false,
        xpReward: xpPerSubtask,
        order,
      };

      await db.execute(
        `INSERT INTO subtasks (id, task_id, title, completed, xp_reward, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [newSubtask.id, newSubtask.taskId, newSubtask.title, 0, newSubtask.xpReward, newSubtask.order]
      );

      // Atualizar XP das subtarefas existentes
      for (const subtask of existingSubtasks) {
        await db.execute(
          'UPDATE subtasks SET xp_reward = $1 WHERE id = $2',
          [xpPerSubtask, subtask.id]
        );
      }

      await get().loadTasks();
    } catch (error) {
      console.error('[TasksStore] Error adding subtask:', error);
    }
  },

  toggleSubtask: async (subtaskId: string) => {
    try {
      const { db, subtasks, tasks } = get();
      if (!db) return 0;

      const subtask = subtasks.find((s) => s.id === subtaskId);
      if (!subtask) return 0;

      const task = tasks.find((t) => t.id === subtask.taskId);
      if (!task || task.status === 'completed') return 0;

      const newCompleted = !subtask.completed;
      const now = formatDate(new Date());

      // Update otimista do estado local PRIMEIRO (evita re-render completo)
      const updatedSubtasks = subtasks.map((s) =>
        s.id === subtaskId
          ? { ...s, completed: newCompleted, completedAt: newCompleted ? now : undefined }
          : s
      );

      const xpChange = newCompleted ? subtask.xpReward : -subtask.xpReward;

      const updatedTasks = tasks.map((t) =>
        t.id === subtask.taskId
          ? { ...t, xpEarned: Math.max(0, t.xpEarned + xpChange) }
          : t
      );

      set({ subtasks: updatedSubtasks, tasks: updatedTasks });

      // Persistir no banco em background
      await db.execute(
        'UPDATE subtasks SET completed = $1, completed_at = $2 WHERE id = $3',
        [newCompleted ? 1 : 0, newCompleted ? now : null, subtaskId]
      );

      if (newCompleted) {
        await db.execute(
          'UPDATE tasks SET xp_earned = xp_earned + $1 WHERE id = $2',
          [subtask.xpReward, subtask.taskId]
        );
        await db.execute(
          'UPDATE user_progress SET total_xp = total_xp + $1 WHERE id = 1',
          [subtask.xpReward]
        );
      } else {
        await db.execute(
          'UPDATE tasks SET xp_earned = MAX(0, xp_earned - $1) WHERE id = $2',
          [subtask.xpReward, subtask.taskId]
        );
        await db.execute(
          'UPDATE user_progress SET total_xp = MAX(0, total_xp - $1) WHERE id = 1',
          [subtask.xpReward]
        );
      }

      // Atualizar XP no stats store para refletir na UI
      await useStatsStore.getState().loadStats();

      return xpChange;
    } catch (error) {
      console.error('[TasksStore] Error toggling subtask:', error);
      return 0;
    }
  },

  deleteSubtask: async (subtaskId: string) => {
    try {
      const { db, subtasks, tasks } = get();
      if (!db) return;

      const subtask = subtasks.find((s) => s.id === subtaskId);
      if (!subtask) return;

      const task = tasks.find((t) => t.id === subtask.taskId);
      if (!task) return;

      // Se a subtarefa estava completa, remover o XP earned da task
      if (subtask.completed) {
        await db.execute(
          'UPDATE tasks SET xp_earned = MAX(0, xp_earned - $1) WHERE id = $2',
          [subtask.xpReward, subtask.taskId]
        );
      }

      // Deletar subtarefa
      await db.execute('DELETE FROM subtasks WHERE id = $1', [subtaskId]);

      // Recalcular XP das subtarefas restantes
      const remainingSubtasks = subtasks.filter(
        (s) => s.taskId === subtask.taskId && s.id !== subtaskId
      );

      if (remainingSubtasks.length > 0) {
        const xpPerSubtask = Math.floor(task.xpReward / remainingSubtasks.length);
        for (const s of remainingSubtasks) {
          await db.execute(
            'UPDATE subtasks SET xp_reward = $1 WHERE id = $2',
            [xpPerSubtask, s.id]
          );
        }
      }

      await get().loadTasks();
    } catch (error) {
      console.error('[TasksStore] Error deleting subtask:', error);
    }
  },

  setFilter: (filter: TaskFilter) => {
    set({ filter });
  },

  setActiveTask: (taskId: string | null) => {
    set({ activeTaskId: taskId });
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

    // Ordenar por sortOrder (ordem manual do drag and drop)
    return [...filtered].sort((a, b) => a.sortOrder - b.sortOrder);
  },

  linkPomodoro: async (taskId: string) => {
    try {
      const { db } = get();
      if (!db) return;

      await db.execute(
        'UPDATE tasks SET linked_pomodoros = linked_pomodoros + 1 WHERE id = $1',
        [taskId]
      );

      await get().loadTasks();
    } catch (error) {
      console.error('[TasksStore] Error linking pomodoro:', error);
    }
  },

  applyOverduePenalties: async () => {
    try {
      const { db, tasks } = get();
      if (!db) return 0;

      const overdueTasks = TaskEngine.getTasksForPenalty(tasks);
      let totalPenalty = 0;

      for (const task of overdueTasks) {
        // Marcar como overdue
        await db.execute(
          'UPDATE tasks SET status = $1 WHERE id = $2',
          ['overdue', task.id]
        );

        // Aplicar penalidade de XP (não deixar negativo)
        await db.execute(
          'UPDATE user_progress SET total_xp = MAX(0, total_xp - $1) WHERE id = 1',
          [task.xpPenalty]
        );

        totalPenalty += task.xpPenalty;
        console.log(`[TasksStore] Penalty applied to task "${task.title}": -${task.xpPenalty} XP`);
      }

      if (totalPenalty > 0) {
        await get().loadTasks();
      }

      return totalPenalty;
    } catch (error) {
      console.error('[TasksStore] Error applying penalties:', error);
      return 0;
    }
  },

  reorderTasks: async (taskIds: string[]) => {
    try {
      const { db, tasks } = get();
      if (!db) return;

      // Update otimista do estado local PRIMEIRO
      const updatedTasks = tasks.map((t) => {
        const newOrder = taskIds.indexOf(t.id);
        return newOrder >= 0 ? { ...t, sortOrder: newOrder } : t;
      });

      set({ tasks: updatedTasks });

      // Persistir no banco em background
      for (let i = 0; i < taskIds.length; i++) {
        await db.execute(
          'UPDATE tasks SET sort_order = $1 WHERE id = $2',
          [i, taskIds[i]]
        );
      }
    } catch (error) {
      console.error('[TasksStore] Error reordering tasks:', error);
    }
  },

  reorderSubtasks: async (taskId: string, subtaskIds: string[]) => {
    try {
      const { db, subtasks } = get();
      if (!db) return;

      // Update otimista do estado local PRIMEIRO
      const updatedSubtasks = subtasks.map((s) => {
        if (s.taskId !== taskId) return s;
        const newOrder = subtaskIds.indexOf(s.id);
        return newOrder >= 0 ? { ...s, order: newOrder } : s;
      });

      set({ subtasks: updatedSubtasks });

      // Persistir no banco em background
      for (let i = 0; i < subtaskIds.length; i++) {
        await db.execute(
          'UPDATE subtasks SET sort_order = $1 WHERE id = $2 AND task_id = $3',
          [i, subtaskIds[i], taskId]
        );
      }
    } catch (error) {
      console.error('[TasksStore] Error reordering subtasks:', error);
    }
  },
}));

/**
 * Verifica e desbloqueia achievements de tarefas
 */
async function checkTaskAchievements(
  db: Database,
  completedTask: Task,
  _completionDate: Date
): Promise<void> {
  const statsStore = useStatsStore.getState();
  const achievements = statsStore.achievements;

  // Buscar todas as tarefas completadas
  const completedTasks = await db.select<TaskRow[]>(
    'SELECT * FROM tasks WHERE status = $1',
    ['completed']
  );

  const totalCompleted = completedTasks.length;

  // Achievement: first_task - Primeiro Pergaminho
  if (!achievements.includes('first_task') && totalCompleted >= 1) {
    await statsStore.unlockAchievement('first_task', 'tasks', 10);
    console.log('[TasksStore] Achievement unlocked: first_task');
  }

  // Achievement: task_streak_5 - 5 tarefas sem atraso
  // Contar tarefas com deadline que foram completadas no prazo
  const tasksWithDeadline = completedTasks.filter((t) => t.deadline && t.completed_at);
  const onTimeTasks = tasksWithDeadline.filter((t) => {
    if (!t.deadline || !t.completed_at) return false;
    return t.completed_at <= t.deadline;
  });

  if (!achievements.includes('task_streak_5') && onTimeTasks.length >= 5) {
    await statsStore.unlockAchievement('task_streak_5', 'tasks', 30);
    console.log('[TasksStore] Achievement unlocked: task_streak_5');
  }

  // Achievement: task_early - 3 tarefas antes do prazo
  const earlyTasks = tasksWithDeadline.filter((t) => {
    if (!t.deadline || !t.completed_at) return false;
    const deadline = new Date(t.deadline);
    const completed = new Date(t.completed_at);
    // Completada pelo menos 1 dia antes
    return completed.getTime() < deadline.getTime() - 24 * 60 * 60 * 1000;
  });

  if (!achievements.includes('task_early') && earlyTasks.length >= 3) {
    await statsStore.unlockAchievement('task_early', 'tasks', 40);
    console.log('[TasksStore] Achievement unlocked: task_early');
  }

  // Achievement: task_epic - 10 tarefas épicas
  const epicTasks = completedTasks.filter((t) => t.effort === 'epic' || t.effort === 'legendary');

  if (!achievements.includes('task_epic') && epicTasks.length >= 10) {
    await statsStore.unlockAchievement('task_epic', 'tasks', 50);
    console.log('[TasksStore] Achievement unlocked: task_epic');
  }

  // Achievement: task_linked - 10 pomodoros em uma única tarefa
  if (!achievements.includes('task_linked') && completedTask.linkedPomodoros >= 10) {
    await statsStore.unlockAchievement('task_linked', 'tasks', 25);
    console.log('[TasksStore] Achievement unlocked: task_linked');
  }

  // Reload stats to update XP bar
  await statsStore.loadStats();
}
