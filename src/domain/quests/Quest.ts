export interface Quest {
  id: string;
  name: string;
  description: string;
  target: number;
  currentProgress: number;
  completed: boolean;
  xpReward: number;
}

export interface DailyQuest extends Quest {
  date: string; // YYYY-MM-DD
}

export interface WeeklyQuest extends Quest {
  weekStart: string; // YYYY-MM-DD (segunda-feira)
}

// Dados retornados do banco (snake_case)
export interface DailyQuestRow {
  id: string;
  name: string;
  description: string;
  target: number;
  current_progress: number;
  completed: number; // SQLite BOOLEAN é 0 ou 1
  date: string;
  xp_reward: number;
}

export interface WeeklyQuestRow {
  id: string;
  name: string;
  description: string;
  target: number;
  current_progress: number;
  completed: number; // SQLite BOOLEAN é 0 ou 1
  week_start: string;
  xp_reward: number;
}

// Conversões SQL → TypeScript
export function dailyQuestFromRow(row: DailyQuestRow): DailyQuest {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    target: row.target,
    currentProgress: row.current_progress,
    completed: row.completed === 1,
    date: row.date,
    xpReward: row.xp_reward,
  };
}

export function weeklyQuestFromRow(row: WeeklyQuestRow): WeeklyQuest {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    target: row.target,
    currentProgress: row.current_progress,
    completed: row.completed === 1,
    weekStart: row.week_start,
    xpReward: row.xp_reward,
  };
}
