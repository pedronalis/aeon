/**
 * TaskEngine - Lógica de negócio do sistema de Pergaminhos
 * Gerencia cálculos de XP, penalidades, bônus de antecipação
 */

import {
  type Task,
  type Subtask,
  type TaskEffort,
  type CreateTaskInput,
  EFFORT_CONFIG,
} from './Task';
import { formatDate } from '@/domain/utils/dateUtils';

export class TaskEngine {
  /**
   * Gera um ID único para tarefa/subtarefa
   */
  static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Cria uma nova tarefa com os valores calculados
   */
  static createTask(input: CreateTaskInput): Task {
    const config = EFFORT_CONFIG[input.effort];

    return {
      id: this.generateId(),
      title: input.title,
      description: input.description,
      effort: input.effort,
      status: 'pending',
      xpReward: config.xpReward,
      xpPenalty: config.xpPenalty,
      xpEarned: 0,
      penaltyApplied: false,
      deadline: input.deadline,
      createdAt: formatDate(new Date()),
      completedAt: undefined,
      linkedPomodoros: 0,
      sortOrder: 0, // Será definido pelo store
    };
  }

  /**
   * Cria subtarefas para uma tarefa, distribuindo o XP proporcionalmente
   */
  static createSubtasks(taskId: string, titles: string[], totalXp: number): Subtask[] {
    if (titles.length === 0) return [];

    const xpPerSubtask = Math.floor(totalXp / titles.length);

    return titles.map((title, index) => ({
      id: this.generateId(),
      taskId,
      title,
      completed: false,
      xpReward: xpPerSubtask,
      completedAt: undefined,
      order: index,
    }));
  }

  /**
   * Recalcula XP das subtarefas quando a quantidade muda
   */
  static recalculateSubtaskXp(subtasks: Subtask[], totalXp: number): Subtask[] {
    if (subtasks.length === 0) return [];

    const xpPerSubtask = Math.floor(totalXp / subtasks.length);

    return subtasks.map((subtask) => ({
      ...subtask,
      xpReward: xpPerSubtask,
    }));
  }

  /**
   * Calcula dias restantes até o deadline
   * Retorna número negativo se passou do prazo
   * Deadline "hoje" significa que o usuário tem até o final do dia
   */
  static getDaysUntilDeadline(deadline: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parse da data como local (YYYY-MM-DD) para evitar problemas de timezone
    const [year, month, day] = deadline.split('-').map(Number);
    const deadlineDate = new Date(year, month - 1, day);
    deadlineDate.setHours(0, 0, 0, 0);

    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Verifica se a tarefa está atrasada
   */
  static isOverdue(task: Task): boolean {
    if (!task.deadline || task.status === 'completed') return false;
    return this.getDaysUntilDeadline(task.deadline) < 0;
  }

  /**
   * Calcula bônus de antecipação
   * +20% se completar 1+ dia antes
   * +50% se completar 3+ dias antes
   */
  static calculateEarlyBonus(task: Task, completionDate: Date): number {
    if (!task.deadline) return 0;

    const deadlineDate = new Date(task.deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    const completion = new Date(completionDate);
    completion.setHours(0, 0, 0, 0);

    const daysEarly = Math.floor(
      (deadlineDate.getTime() - completion.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysEarly >= 3) {
      return Math.floor(task.xpReward * 0.5); // +50%
    } else if (daysEarly >= 1) {
      return Math.floor(task.xpReward * 0.2); // +20%
    }

    return 0;
  }

  /**
   * Calcula XP total ao completar uma tarefa
   * Considera: XP base - XP já ganho (subtarefas) + bônus antecipação
   */
  static calculateCompletionXp(task: Task, completionDate: Date): number {
    // XP restante (base - já ganho via subtarefas)
    const remainingXp = Math.max(0, task.xpReward - task.xpEarned);

    // Bônus de antecipação
    const earlyBonus = this.calculateEarlyBonus(task, completionDate);

    return remainingXp + earlyBonus;
  }

  /**
   * Calcula progresso da tarefa baseado nas subtarefas
   */
  static calculateProgress(subtasks: Subtask[]): { completed: number; total: number; percentage: number } {
    if (subtasks.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const completed = subtasks.filter((s) => s.completed).length;
    const total = subtasks.length;
    const percentage = Math.round((completed / total) * 100);

    return { completed, total, percentage };
  }

  /**
   * Verifica se todas as subtarefas estão completas
   */
  static areAllSubtasksComplete(subtasks: Subtask[]): boolean {
    if (subtasks.length === 0) return true;
    return subtasks.every((s) => s.completed);
  }

  /**
   * Retorna configuração de esforço
   */
  static getEffortConfig(effort: TaskEffort) {
    return EFFORT_CONFIG[effort];
  }

  /**
   * Formata texto de deadline para exibição
   */
  static formatDeadlineText(deadline: string): string {
    const daysUntil = this.getDaysUntilDeadline(deadline);

    if (daysUntil < 0) {
      const daysOverdue = Math.abs(daysUntil);
      return daysOverdue === 1 ? 'Vencida ontem' : `Vencida há ${daysOverdue} dias`;
    } else if (daysUntil === 0) {
      return 'Hoje';
    } else if (daysUntil === 1) {
      return 'Amanhã';
    } else if (daysUntil <= 7) {
      return `Em ${daysUntil} dias`;
    } else {
      const date = new Date(deadline);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    }
  }

  /**
   * Retorna classe de cor baseada no status do deadline
   */
  static getDeadlineColorClass(task: Task): string {
    if (!task.deadline) return 'text-text-muted';
    if (task.status === 'completed') return 'text-success';

    const daysUntil = this.getDaysUntilDeadline(task.deadline);

    if (daysUntil < 0) return 'text-error';
    if (daysUntil === 0) return 'text-warning';
    if (daysUntil <= 2) return 'text-warning';
    return 'text-text-secondary';
  }

  /**
   * Filtra tarefas que devem receber penalidade
   * Retorna tarefas pendentes que passaram do deadline
   */
  static getTasksForPenalty(tasks: Task[]): Task[] {
    return tasks.filter(
      (task) =>
        (task.status === 'pending' || task.status === 'overdue') &&
        task.deadline &&
        this.getDaysUntilDeadline(task.deadline) < 0 &&
        !task.penaltyApplied
    );
  }

  /**
   * Ordena tarefas por prioridade
   * 1. Atrasadas (mais atrasadas primeiro)
   * 2. Com deadline (mais próximas primeiro)
   * 3. Sem deadline (mais recentes primeiro)
   * 4. Completadas (mais recentes primeiro)
   */
  static sortByPriority(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
      // Completadas vão para o final
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (b.status === 'completed' && a.status !== 'completed') return -1;

      // Ambas completadas: mais recentes primeiro
      if (a.status === 'completed' && b.status === 'completed') {
        return (b.completedAt || '').localeCompare(a.completedAt || '');
      }

      // Atrasadas primeiro
      const aOverdue = a.deadline ? this.getDaysUntilDeadline(a.deadline) < 0 : false;
      const bOverdue = b.deadline ? this.getDaysUntilDeadline(b.deadline) < 0 : false;

      if (aOverdue && !bOverdue) return -1;
      if (bOverdue && !aOverdue) return 1;

      // Ambas atrasadas: mais atrasada primeiro
      if (aOverdue && bOverdue) {
        return this.getDaysUntilDeadline(a.deadline!) - this.getDaysUntilDeadline(b.deadline!);
      }

      // Com deadline vs sem deadline
      if (a.deadline && !b.deadline) return -1;
      if (b.deadline && !a.deadline) return 1;

      // Ambas com deadline: mais próxima primeiro
      if (a.deadline && b.deadline) {
        return this.getDaysUntilDeadline(a.deadline) - this.getDaysUntilDeadline(b.deadline);
      }

      // Sem deadline: mais recentes primeiro
      return b.createdAt.localeCompare(a.createdAt);
    });
  }
}
