import type { Mode } from '../modes/Mode';
import { ACHIEVEMENTS, type Achievement } from './achievements';
import { calculateStreaks, formatDate, parseDate, getWeekRange } from '../utils/dateUtils';

/**
 * Estatísticas diárias
 */
export interface DailyStats {
  date: string; // YYYY-MM-DD
  modeId: string;
  pomodorosCompleted: number;
  totalFocusMinutes: number;
}

/**
 * Progresso do usuário
 */
export interface UserProgress {
  totalXp: number;
  currentStreak: number;
  bestStreak: number;
  lastActivityDate: string | null;
}

/**
 * Contexto para detecção de achievements
 */
export interface AchievementContext {
  dailyStats: DailyStats[];
  unlockedAchievementIds: string[];
  totalPomodoros: number;
  modesUsed: Set<string>;
  hasCustomMode: boolean;
  completionTime?: Date; // Hora em que o foco foi completado
}

/**
 * Score Engine - Lógica de XP, achievements e estatísticas
 */
export class ScoreEngine {
  /**
   * Calcula XP dinâmico baseado em:
   * 1. Duração do foco (1 XP por 2.5 minutos)
   * 2. Multiplicador de streak
   */
  static calculateXpForFocus(mode: Mode, currentStreak: number): number {
    // XP base: 1 XP por 2.5 minutos
    const focusMinutes = mode.focusDuration / 60;
    const baseXP = Math.floor(focusMinutes / 2.5);

    // Multiplicador de streak
    const streakMultiplier = this.getStreakMultiplier(currentStreak);

    // XP final arredondado
    return Math.floor(baseXP * streakMultiplier);
  }

  /**
   * Retorna multiplicador de XP baseado em streak
   */
  static getStreakMultiplier(streakDays: number): number {
    if (streakDays >= 30) return 2.0;      // +100%
    if (streakDays >= 14) return 1.5;      // +50%
    if (streakDays >= 7) return 1.25;      // +25%
    if (streakDays >= 3) return 1.10;      // +10%
    return 1.0;                             // Sem bônus
  }

  /**
   * Checa quais achievements foram desbloqueados
   * Retorna array de achievements recém-desbloqueados
   */
  static checkAchievements(context: AchievementContext): Achievement[] {
    const newUnlocks: Achievement[] = [];
    const { dailyStats, unlockedAchievementIds, totalPomodoros, modesUsed, hasCustomMode, completionTime } = context;

    // Helper para verificar se já foi desbloqueado
    const isUnlocked = (id: string) => unlockedAchievementIds.includes(id);
    const dailyTotals = dailyStats.reduce((acc, stat) => {
      acc.set(stat.date, (acc.get(stat.date) ?? 0) + stat.pomodorosCompleted);
      return acc;
    }, new Map<string, number>());

    // Beginner achievements
    if (!isUnlocked('first_focus') && totalPomodoros >= 1) {
      newUnlocks.push(ACHIEVEMENTS.find((a) => a.id === 'first_focus')!);
    }

    if (!isUnlocked('five_focuses')) {
      const today = formatDate(new Date());
      const todayTotal = dailyTotals.get(today) ?? 0;
      if (todayTotal >= 5) {
        newUnlocks.push(ACHIEVEMENTS.find((a) => a.id === 'five_focuses')!);
      }
    }

    // Consistency achievements
    const allDates = dailyStats.map((s) => s.date);
    const { current: streak } = calculateStreaks(allDates);

    if (!isUnlocked('streak_3') && streak >= 3) {
      newUnlocks.push(ACHIEVEMENTS.find((a) => a.id === 'streak_3')!);
    }

    if (!isUnlocked('streak_7') && streak >= 7) {
      newUnlocks.push(ACHIEVEMENTS.find((a) => a.id === 'streak_7')!);
    }

    if (!isUnlocked('streak_14') && streak >= 14) {
      newUnlocks.push(ACHIEVEMENTS.find((a) => a.id === 'streak_14')!);
    }

    if (!isUnlocked('streak_30') && streak >= 30) {
      newUnlocks.push(ACHIEVEMENTS.find((a) => a.id === 'streak_30')!);
    }

    if (!isUnlocked('streak_60') && streak >= 60) {
      newUnlocks.push(ACHIEVEMENTS.find((a) => a.id === 'streak_60')!);
    }

    // Quantity achievements
    if (!isUnlocked('total_25') && totalPomodoros >= 25) {
      newUnlocks.push(ACHIEVEMENTS.find((a) => a.id === 'total_25')!);
    }

    if (!isUnlocked('total_100') && totalPomodoros >= 100) {
      newUnlocks.push(ACHIEVEMENTS.find((a) => a.id === 'total_100')!);
    }

    if (!isUnlocked('total_250') && totalPomodoros >= 250) {
      newUnlocks.push(ACHIEVEMENTS.find((a) => a.id === 'total_250')!);
    }

    if (!isUnlocked('total_500') && totalPomodoros >= 500) {
      newUnlocks.push(ACHIEVEMENTS.find((a) => a.id === 'total_500')!);
    }

    if (!isUnlocked('total_1000') && totalPomodoros >= 1000) {
      newUnlocks.push(ACHIEVEMENTS.find((a) => a.id === 'total_1000')!);
    }

    // Modes achievements
    // Os 4 presets são: traditional, sustainable, animedoro, mangadoro
    const presetIds = ['traditional', 'sustainable', 'animedoro', 'mangadoro'];
    const hasAllPresets = presetIds.every((id) => modesUsed.has(id));

    if (!isUnlocked('try_all_modes') && hasAllPresets) {
      newUnlocks.push(ACHIEVEMENTS.find((a) => a.id === 'try_all_modes')!);
    }

    if (!isUnlocked('custom_mode') && hasCustomMode) {
      newUnlocks.push(ACHIEVEMENTS.find((a) => a.id === 'custom_mode')!);
    }

    if (!isUnlocked('mode_loyalist')) {
      const modeTotals = dailyStats.reduce((acc, stat) => {
        acc.set(stat.modeId, (acc.get(stat.modeId) ?? 0) + stat.pomodorosCompleted);
        return acc;
      }, new Map<string, number>());
      const hasLoyalist = Array.from(modeTotals.values()).some((count) => count >= 50);
      if (hasLoyalist) {
        newUnlocks.push(ACHIEVEMENTS.find((a) => a.id === 'mode_loyalist')!);
      }
    }

    // Special achievements
    if (!isUnlocked('early_bird') && completionTime) {
      const hour = completionTime.getHours();
      if (hour < 7) {
        newUnlocks.push(ACHIEVEMENTS.find((a) => a.id === 'early_bird')!);
      }
    }

    if (!isUnlocked('night_owl') && completionTime) {
      const hour = completionTime.getHours();
      if (hour >= 23) {
        newUnlocks.push(ACHIEVEMENTS.find((a) => a.id === 'night_owl')!);
      }
    }

    if (!isUnlocked('weekend_warrior')) {
      // Verificar se algum sábado ou domingo tem >= 3 focos
      const hasWeekendWith3 = Array.from(dailyTotals.entries()).some(([dateStr, count]) => {
        const date = parseDate(dateStr);
        const day = date.getDay();
        return (day === 0 || day === 6) && count >= 3;
      });
      if (hasWeekendWith3) {
        newUnlocks.push(ACHIEVEMENTS.find((a) => a.id === 'weekend_warrior')!);
      }
    }

    if (!isUnlocked('daily_10')) {
      const today = formatDate(new Date());
      const todayTotal = dailyTotals.get(today) ?? 0;
      if (todayTotal >= 10) {
        newUnlocks.push(ACHIEVEMENTS.find((a) => a.id === 'daily_10')!);
      }
    }

    if (!isUnlocked('perfect_week') && completionTime) {
      const [weekStart, weekEnd] = getWeekRange(completionTime);
      const weekEndStr = formatDate(weekEnd);
      const completionDate = formatDate(completionTime);

      if (completionDate === weekEndStr) {
        let allHave2Plus = true;
        for (let i = 0; i < 7; i += 1) {
          const day = new Date(weekStart);
          day.setDate(weekStart.getDate() + i);
          const dayStr = formatDate(day);
          const count = dailyTotals.get(dayStr) ?? 0;
          if (count < 2) {
            allHave2Plus = false;
            break;
          }
        }

        if (allHave2Plus) {
          newUnlocks.push(ACHIEVEMENTS.find((a) => a.id === 'perfect_week')!);
        }
      }
    }

    // export_data é desbloqueado via ação manual, não aqui

    return newUnlocks;
  }

  /**
   * Agrega estatísticas por período
   */
  static aggregateStats(
    dailyStats: DailyStats[],
    period: 'today' | 'week' | 'all'
  ): {
    pomodoros: number;
    minutes: number;
  } {
    let filtered = dailyStats;

    if (period === 'today') {
      const today = formatDate(new Date());
      filtered = dailyStats.filter((s) => s.date === today);
    } else if (period === 'week') {
      const [weekStart, weekEnd] = getWeekRange(new Date());
      const weekStartStr = formatDate(weekStart);
      const weekEndStr = formatDate(weekEnd);
      filtered = dailyStats.filter((s) => s.date >= weekStartStr && s.date <= weekEndStr);
    }

    const pomodoros = filtered.reduce((sum, s) => sum + s.pomodorosCompleted, 0);
    const minutes = filtered.reduce((sum, s) => sum + s.totalFocusMinutes, 0);

    return { pomodoros, minutes };
  }

  /**
   * Agrega estatísticas por modo
   */
  static aggregateByMode(dailyStats: DailyStats[]): Map<string, { pomodoros: number; minutes: number }> {
    const byMode = new Map<string, { pomodoros: number; minutes: number }>();

    for (const stat of dailyStats) {
      const existing = byMode.get(stat.modeId) || { pomodoros: 0, minutes: 0 };
      byMode.set(stat.modeId, {
        pomodoros: existing.pomodoros + stat.pomodorosCompleted,
        minutes: existing.minutes + stat.totalFocusMinutes,
      });
    }

    return byMode;
  }
}
