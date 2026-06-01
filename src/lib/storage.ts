/**
 * Camada de persistência Web — IndexedDB via idb-keyval
 * Substitui o SQLite do Tauri com uma API similar e async-safe.
 */

import { get as idbGet, set as idbSet } from 'idb-keyval';

// Prefixo para evitar colisão com outras chaves na página
const PREFIX = 'aeon:';

function key(name: string): string {
  return PREFIX + name;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function dbGet<T = any>(name: string): Promise<T | undefined> {
  return idbGet(key(name)) as Promise<T | undefined>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function dbSet<T = any>(name: string, value: T): Promise<void> {
  return idbSet(key(name), value);
}

export async function dbGetOrDefault<T>(name: string, defaultValue: T): Promise<T> {
  const value = await dbGet<T>(name);
  if (value === undefined) return defaultValue;
  return value;
}

export async function tableGet<T = Record<string, unknown>>(tableName: string): Promise<T[]> {
  const rows = await dbGet<T[]>(tableName);
  return rows ?? [];
}

export async function tableSet<T = Record<string, unknown>>(tableName: string, rows: T[]): Promise<void> {
  return dbSet<T[]>(tableName, rows);
}

/** Insere um novo registro se não existir, pelo campo `id`. */
export async function tableInsert<T extends object & { id: string }>(
  tableName: string,
  record: T
): Promise<void> {
  const rows = await tableGet<T>(tableName);
  const exists = rows.some((r) => r.id === record.id);
  if (!exists) {
    rows.push(record);
    await tableSet(tableName, rows);
  }
}

/** Atualiza um registro existente pelo campo `id`. */
export async function tableUpdate<T extends object & { id: string }>(
  tableName: string,
  id: string,
  updates: Partial<T>
): Promise<void> {
  const rows = await tableGet<T>(tableName);
  const idx = rows.findIndex((r) => (r as { id: string }).id === id);
  if (idx !== -1) {
    rows[idx] = { ...rows[idx], ...updates } as T;
    await tableSet(tableName, rows);
  }
}

/** Remove um registro pelo campo `id`. */
export async function tableDelete<T extends object & { id: string }>(
  tableName: string,
  id: string
): Promise<void> {
  const rows = await tableGet<T>(tableName);
  const filtered = rows.filter((r) => (r as { id: string }).id !== id);
  await tableSet(tableName, filtered);
}

// ------------------------------------------------------------------ Chaves conhecidas (constants)
export const DB_KEYS = {
  version: 'db_version',
  settings: 'settings',
  modes: 'modes',
  tasks: 'tasks',
  subtasks: 'subtasks',
  dailyStats: 'daily_stats',
  achievements: 'achievements',
  userProgress: 'user_progress',
  userProfile: 'user_profile',
  dailyQuests: 'daily_quests',
  weeklyQuests: 'weekly_quests',
} as const;
