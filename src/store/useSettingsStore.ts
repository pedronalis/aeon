import { create } from 'zustand';
import Database from '@tauri-apps/plugin-sql';
import type { Mode } from '@/domain/modes/Mode';
import { PRESET_MODES } from '@/domain/modes/presets';

interface Settings {
  activeMode: string;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  uiZoom: number; // 80, 90, 100, 110, 120, 130
  lowFx: boolean;
}

interface SettingsRow {
  active_mode: string;
  notifications_enabled: number;
  sound_enabled: number;
}

interface ModeRow {
  id: string;
  name: string;
  is_custom: number;
  focus_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  pomodoros_until_long_break: number;
  accent_color: string;
  disclaimer: string | null;
}

interface SettingsStore {
  settings: Settings;
  modes: Mode[];
  loading: boolean;
  db: Database | null;

  initDb: () => Promise<void>;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  loadModes: () => Promise<void>;
  createMode: (mode: Mode) => Promise<void>;
  updateMode: (mode: Mode) => Promise<void>;
  deleteMode: (id: string) => Promise<void>;
}

const readUiZoom = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return 100;
  }
  return parseInt(localStorage.getItem('aeon-ui-zoom') || '100', 10);
};

const readLowFx = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }
  const stored = localStorage.getItem('aeon-low-fx');
  if (stored !== null) {
    return stored === '1';
  }
  if (import.meta.env.VITE_AEON_LOW_FX === '1') {
    return true;
  }
  if (typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
};

const applyVisualSettings = (uiZoom: number, lowFx: boolean) => {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.style.fontSize = `${uiZoom}%`;
  document.documentElement.dataset.fx = lowFx ? 'low' : 'full';
};

const initialUiZoom = readUiZoom();
const initialLowFx = readLowFx();
applyVisualSettings(initialUiZoom, initialLowFx);

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: {
    activeMode: 'traditional',
    notificationsEnabled: true,
    soundEnabled: true,
    uiZoom: initialUiZoom,
    lowFx: initialLowFx,
  },
  modes: PRESET_MODES,
  loading: false,
  db: null,

  initDb: async () => {
    if (get().db) return; // Já inicializado
    try {
      const db = await Database.load('sqlite:pomodore.db');
      set({ db });
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error; // Propagar erro para evitar loop infinito
    }
  },

  loadSettings: async () => {
    try {
      set({ loading: true });
      let { db } = get();
      if (!db) {
        await get().initDb();
        db = get().db;
        if (!db) {
          set({ loading: false });
          return; // Não conseguiu conectar, sai sem loop
        }
      }

      const rows = await db.select<SettingsRow[]>(
        'SELECT active_mode, notifications_enabled, sound_enabled FROM settings WHERE id = 1'
      );

      const uiZoom = readUiZoom();
      const lowFx = readLowFx();

      if (rows[0]) {
        const settings: Settings = {
          activeMode: rows[0].active_mode,
          notificationsEnabled: rows[0].notifications_enabled === 1,
          soundEnabled: rows[0].sound_enabled === 1,
          uiZoom,
          lowFx,
        };
        // Aplicar zoom ao carregar
        applyVisualSettings(uiZoom, lowFx);
        set({ settings, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      set({ loading: false });
    }
  },

  updateSettings: async (newSettings) => {
    try {
      const updated = { ...get().settings, ...newSettings };

      // Salvar zoom em localStorage e aplicar ao documento
      if (newSettings.uiZoom !== undefined) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('aeon-ui-zoom', String(newSettings.uiZoom));
        }
      }

      if (newSettings.lowFx !== undefined) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('aeon-low-fx', newSettings.lowFx ? '1' : '0');
        }
      }

      if (newSettings.uiZoom !== undefined || newSettings.lowFx !== undefined) {
        applyVisualSettings(updated.uiZoom, updated.lowFx);
      }

      const { db } = get();
      if (!db) {
        set({ settings: updated });
        return;
      }

      // Salvar outras configurações no banco de dados
      await db.execute(
        'UPDATE settings SET active_mode = $1, notifications_enabled = $2, sound_enabled = $3 WHERE id = 1',
        [
          updated.activeMode,
          updated.notificationsEnabled ? 1 : 0,
          updated.soundEnabled ? 1 : 0,
        ]
      );

      set({ settings: updated });
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  loadModes: async () => {
    try {
      let { db } = get();
      if (!db) {
        await get().initDb();
        db = get().db;
        if (!db) {
          return; // Não conseguiu conectar, sai sem loop
        }
      }

      const rows = await db.select<ModeRow[]>('SELECT * FROM modes');

      const modes: Mode[] = rows.map((row) => ({
        id: row.id,
        name: row.name,
        isCustom: row.is_custom === 1,
        focusDuration: row.focus_duration,
        shortBreakDuration: row.short_break_duration,
        longBreakDuration: row.long_break_duration,
        pomodorosUntilLongBreak: row.pomodoros_until_long_break,
        accentColor: row.accent_color,
        disclaimer: row.disclaimer || undefined,
      }));

      set({ modes });
    } catch (error) {
      console.error('Error loading modes:', error);
      set({ modes: PRESET_MODES });
    }
  },

  createMode: async (mode) => {
    try {
      const { db } = get();
      if (!db) return;

      await db.execute(
        'INSERT INTO modes (id, name, is_custom, focus_duration, short_break_duration, long_break_duration, pomodoros_until_long_break, accent_color, disclaimer) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [
          mode.id,
          mode.name,
          mode.isCustom ? 1 : 0,
          mode.focusDuration,
          mode.shortBreakDuration,
          mode.longBreakDuration,
          mode.pomodorosUntilLongBreak,
          mode.accentColor,
          mode.disclaimer || null,
        ]
      );

      await get().loadModes();
    } catch (error) {
      console.error('Error creating mode:', error);
      throw error;
    }
  },

  updateMode: async (mode) => {
    try {
      const { db } = get();
      if (!db) return;

      await db.execute(
        'UPDATE modes SET name = $1, focus_duration = $2, short_break_duration = $3, long_break_duration = $4, pomodoros_until_long_break = $5, accent_color = $6, disclaimer = $7 WHERE id = $8',
        [
          mode.name,
          mode.focusDuration,
          mode.shortBreakDuration,
          mode.longBreakDuration,
          mode.pomodorosUntilLongBreak,
          mode.accentColor,
          mode.disclaimer || null,
          mode.id,
        ]
      );

      await get().loadModes();
    } catch (error) {
      console.error('Error updating mode:', error);
      throw error;
    }
  },

  deleteMode: async (id) => {
    try {
      const { db } = get();
      if (!db) return;

      await db.execute('DELETE FROM modes WHERE id = $1 AND is_custom = 1', [
        id,
      ]);

      await get().loadModes();
    } catch (error) {
      console.error('Error deleting mode:', error);
      throw error;
    }
  },
}));
