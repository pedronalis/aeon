import { formatDate } from '../utils/dateUtils';

/**
 * Quest diária ou semanal
 */
export interface Quest {
  id: string;
  name: string;
  description: string;
  target: number;
  currentProgress: number;
  completed: boolean;
  xpReward: number;
}

/**
 * Quest diária com data
 */
export interface DailyQuest extends Quest {
  date: string; // YYYY-MM-DD
}

/**
 * Quest semanal com data de início da semana
 */
export interface WeeklyQuest extends Quest {
  weekStart: string; // YYYY-MM-DD (segunda-feira)
}

/**
 * Template para gerar quests
 */
interface QuestTemplate {
  id: string;
  name: string;
  description: string;
  target: number;
  xpReward: number;
}

/**
 * Quest Engine - Lógica de quests diárias e semanais
 */
export class QuestEngine {
  /**
   * Templates de quests diárias
   */
  static DAILY_QUEST_TEMPLATES: QuestTemplate[] = [
    {
      id: 'daily_3_focuses',
      name: 'Ritual Diário',
      description: 'Complete 3 focos hoje',
      target: 3,
      xpReward: 30,
    },
    {
      id: 'daily_100_minutes',
      name: 'Maratonista',
      description: 'Acumule 100 minutos de foco hoje',
      target: 100,
      xpReward: 40,
    },
    {
      id: 'daily_early_bird',
      name: 'Madrugador',
      description: 'Complete um foco antes das 9h',
      target: 1,
      xpReward: 25,
    },
  ];

  /**
   * Templates de quests semanais
   */
  static WEEKLY_QUEST_TEMPLATES: QuestTemplate[] = [
    {
      id: 'weekly_20_focuses',
      name: 'Guerreiro da Semana',
      description: 'Complete 20 focos esta semana',
      target: 20,
      xpReward: 100,
    },
    {
      id: 'weekly_perfect_week',
      name: 'Semana Perfeita',
      description: 'Complete pelo menos 1 foco em cada dia da semana',
      target: 7,
      xpReward: 150,
    },
  ];

  /**
   * Gera quests diárias para uma data específica
   */
  static generateDailyQuests(date: string): DailyQuest[] {
    return this.DAILY_QUEST_TEMPLATES.map((template) => ({
      ...template,
      date,
      currentProgress: 0,
      completed: false,
    }));
  }

  /**
   * Gera quests semanais para uma semana específica
   */
  static generateWeeklyQuests(weekStart: string): WeeklyQuest[] {
    return this.WEEKLY_QUEST_TEMPLATES.map((template) => ({
      ...template,
      weekStart,
      currentProgress: 0,
      completed: false,
    }));
  }

  /**
   * Calcula o início da semana (segunda-feira) para uma data
   */
  static getWeekStart(date: Date): string {
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Se domingo, volta 6 dias. Senão, volta até segunda
    const monday = new Date(date);
    monday.setDate(monday.getDate() + diff);
    return formatDate(monday);
  }

  /**
   * Verifica se um foco foi completado antes das 9h (early bird)
   */
  static isEarlyBirdFocus(completionTime: Date): boolean {
    return completionTime.getHours() < 9;
  }

  /**
   * Verifica se uma quest foi completada
   */
  static isQuestCompleted(quest: Quest): boolean {
    return quest.currentProgress >= quest.target;
  }

  /**
   * Atualiza progresso de uma quest
   */
  static updateQuestProgress(quest: Quest, increment: number): Quest {
    const newProgress = Math.min(quest.currentProgress + increment, quest.target);
    const completed = newProgress >= quest.target;

    return {
      ...quest,
      currentProgress: newProgress,
      completed,
    };
  }

  /**
   * Calcula XP total de quests completadas
   */
  static calculateTotalQuestXP(quests: Quest[]): number {
    return quests
      .filter((q) => q.completed)
      .reduce((sum, q) => sum + q.xpReward, 0);
  }
}
