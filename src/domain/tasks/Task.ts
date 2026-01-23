/**
 * Sistema de Tarefas "Pergaminhos" do Aeon
 * Cada tarefa é um pergaminho com recompensa XP e penalidade por atraso
 */

/** Nível de esforço da tarefa */
export type TaskEffort = 'trivial' | 'common' | 'challenging' | 'heroic' | 'epic' | 'legendary';

/** Status da tarefa */
export type TaskStatus = 'pending' | 'completed' | 'overdue';

/** Configuração de XP por nível de esforço */
export interface EffortConfig {
  icon: string;
  xpReward: number;
  xpPenalty: number;
  label: string;
}

/** Mapeamento de esforço para configurações */
export const EFFORT_CONFIG: Record<TaskEffort, EffortConfig> = {
  trivial: { icon: '📜', xpReward: 5, xpPenalty: 2, label: 'Trivial' },
  common: { icon: '⚔️', xpReward: 15, xpPenalty: 5, label: 'Comum' },
  challenging: { icon: '🛡️', xpReward: 22, xpPenalty: 8, label: 'Desafiador' },
  heroic: { icon: '🦁', xpReward: 30, xpPenalty: 12, label: 'Heroico' },
  epic: { icon: '👑', xpReward: 40, xpPenalty: 16, label: 'Épico' },
  legendary: { icon: '🏆', xpReward: 50, xpPenalty: 20, label: 'Lendário' },
};

export const EFFORT_ORDER: TaskEffort[] = [
  'trivial',
  'common',
  'challenging',
  'heroic',
  'epic',
  'legendary',
];

/** Interface principal de Tarefa */
export interface Task {
  id: string;
  title: string;
  description?: string;
  effort: TaskEffort;
  status: TaskStatus;
  xpReward: number;      // XP base da tarefa
  xpPenalty: number;     // Penalidade se atrasar
  xpEarned: number;      // XP já ganho (subtarefas)
  penaltyApplied: boolean;
  deadline?: string;     // YYYY-MM-DD ou undefined
  createdAt: string;
  completedAt?: string;
  linkedPomodoros: number;
  sortOrder: number;     // Ordem de exibição manual
}

/** Interface de Subtarefa */
export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  xpReward: number;
  completedAt?: string;
  order: number;
}

/** Row type para conversão do banco de dados - Task */
export interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  effort: string;
  status: string;
  xp_reward: number;
  xp_penalty: number;
  xp_earned: number;
  penalty_applied?: number;
  deadline: string | null;
  created_at: string;
  completed_at: string | null;
  linked_pomodoros: number;
  sort_order: number;
}

/** Row type para conversão do banco de dados - Subtask */
export interface SubtaskRow {
  id: string;
  task_id: string;
  title: string;
  completed: number;
  xp_reward: number;
  completed_at: string | null;
  sort_order: number;
}

/** Converte TaskRow para Task */
export function taskFromRow(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    effort: row.effort as TaskEffort,
    status: row.status as TaskStatus,
    xpReward: row.xp_reward,
    xpPenalty: row.xp_penalty,
    xpEarned: row.xp_earned,
    penaltyApplied: row.penalty_applied === 1,
    deadline: row.deadline ?? undefined,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
    linkedPomodoros: row.linked_pomodoros,
    sortOrder: row.sort_order ?? 0,
  };
}

/** Converte SubtaskRow para Subtask */
export function subtaskFromRow(row: SubtaskRow): Subtask {
  return {
    id: row.id,
    taskId: row.task_id,
    title: row.title,
    completed: row.completed === 1,
    xpReward: row.xp_reward,
    completedAt: row.completed_at ?? undefined,
    order: row.sort_order,
  };
}

/** Tipo de filtro para a lista de tarefas */
export type TaskFilter = 'all' | 'pending' | 'completed' | 'overdue';

/** Task com subtasks incluídas */
export interface TaskWithSubtasks extends Task {
  subtasks: Subtask[];
}

/** Input para criar nova tarefa */
export interface CreateTaskInput {
  title: string;
  description?: string;
  effort: TaskEffort;
  deadline?: string;
  subtasks?: string[]; // títulos das subtarefas
}

/** Input para criar nova subtarefa */
export interface CreateSubtaskInput {
  taskId: string;
  title: string;
  order: number;
}
