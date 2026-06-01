/**
 * Migrações de banco — IndexedDB
 * Carrega defaults e garante schema mínimo quando app inicia.
 */

import { dbGet, dbSet, DB_KEYS } from './storage';
import { PRESET_MODES } from '@/domain/modes/presets';

export const DB_VERSION = 1;

export interface UserProgress {
  totalXp: number;
  currentStreak: number;
  bestStreak: number;
  lastActivityDate: string | null;
}

export interface SettingsSaved {
  activeMode: string;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
}

const defaultSettings: SettingsSaved = {
  activeMode: 'traditional',
  notificationsEnabled: true,
  soundEnabled: true,
};

const defaultProgress: UserProgress = {
  totalXp: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastActivityDate: null,
};

/**
 * Executa migrações na primeira abertura ou quando version aumenta.
 * Retorna true se migrou.
 */
export async function runMigrations(): Promise<boolean> {
  const storedVersion = (await dbGet<number>(DB_KEYS.version)) ?? 0;

  if (storedVersion >= DB_VERSION) return false;

  // ---- Versão 1: dados iniciais ----
  const existingSettings = await dbGet<SettingsSaved>(DB_KEYS.settings);
  if (!existingSettings) {
    await dbSet(DB_KEYS.settings, defaultSettings);
  }

  const existingModes = await dbGet(DB_KEYS.modes);
  if (!existingModes) {
    await dbSet(DB_KEYS.modes, PRESET_MODES);
  }

  const existingUserProgress = await dbGet(DB_KEYS.userProgress);
  if (!existingUserProgress) {
    await dbSet(DB_KEYS.userProgress, defaultProgress);
  }

  const existingProfile = await dbGet(DB_KEYS.userProfile);
  if (!existingProfile) {
    await dbSet(DB_KEYS.userProfile, {
      id: '1',
      username: 'Aventureiro',
      avatarId: 'knight',
      bio: '',
      displayTitle: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Tabelas vazias se não existirem
  const tables = [
    DB_KEYS.tasks,
    DB_KEYS.subtasks,
    DB_KEYS.dailyStats,
    DB_KEYS.achievements,
    DB_KEYS.dailyQuests,
    DB_KEYS.weeklyQuests,
  ];

  for (const table of tables) {
    const data = await dbGet(table);
    if (!data) await dbSet(table, []);
  }

  // Marca versão
  await dbSet(DB_KEYS.version, DB_VERSION);
  console.log('[db-migrations] Ran to version', DB_VERSION);
  return true;
}
