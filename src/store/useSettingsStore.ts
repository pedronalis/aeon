import { create } from 'zustand';
import type { Mode } from '@/domain/modes/Mode';
import { PRESET_MODES } from '@/domain/modes/presets';
import { dbGet, dbSet, tableGet, tableSet } from '@/lib/storage';
import { DB_KEYS } from '@/lib/storage';
import { runMigrations } from '@/lib/db-migrations';

interface Settings {
  activeMode: string;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  uiZoom: number;
  lowFx: boolean;
}

interface SettingsSaved {
  activeMode: string;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
}

interface SettingsStore {
  settings: Settings;
  modes: Mode[];
  loading: boolean;

  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  loadModes: () => Promise<void>;
  createMode: (mode: Mode) => Promise<void>;
  updateMode: (mode: Mode) => Promise<void>;
  deleteMode: (id: string) => Promise<void>;
}

const readUiZoom = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return 100;
  return parseInt(localStorage.getItem('aeon-ui-zoom') || '100', 10);
};

const readLowFx = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
  const stored = localStorage.getItem('aeon-low-fx');
  if (stored !== null) return stored === '1';
  if (import.meta.env.VITE_AEON_LOW_FX === '1') return true;
  if (typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
};

const applyVisualSettings = (uiZoom: number, lowFx: boolean) => {
  if (typeof document === 'undefined') return;
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

  loadSettings: async () => {
    try {
      set({ loading: true });
      await runMigrations();
      const saved = await dbGet<SettingsSaved>(DB_KEYS.settings);
      const uiZoom = readUiZoom();
      const lowFx = readLowFx();
      if (saved) {
        const settings: Settings = {
          ...saved,
          uiZoom,
          lowFx,
        };
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
      if (newSettings.uiZoom !== undefined && typeof localStorage !== 'undefined') {
        localStorage.setItem('aeon-ui-zoom', String(newSettings.uiZoom));
      }
      if (newSettings.lowFx !== undefined && typeof localStorage !== 'undefined') {
        localStorage.setItem('aeon-low-fx', newSettings.lowFx ? '1' : '0');
      }
      if (newSettings.uiZoom !== undefined || newSettings.lowFx !== undefined) {
        applyVisualSettings(updated.uiZoom, updated.lowFx);
      }
      // Salvar apenas os campos persistidos
      const toSave: SettingsSaved = {
        activeMode: updated.activeMode,
        notificationsEnabled: updated.notificationsEnabled,
        soundEnabled: updated.soundEnabled,
      };
      await dbSet(DB_KEYS.settings, toSave);
      set({ settings: updated });
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  loadModes: async () => {
    try {
      const modes = await tableGet<Mode>(DB_KEYS.modes);
      if (modes.length > 0) {
        set({ modes });
      }
    } catch (error) {
      console.error('Error loading modes:', error);
    }
  },

  createMode: async (mode) => {
    try {
      const modes = await tableGet<Mode>(DB_KEYS.modes);
      modes.push(mode);
      await tableSet(DB_KEYS.modes, modes);
      await get().loadModes();
    } catch (error) {
      console.error('Error creating mode:', error);
      throw error;
    }
  },

  updateMode: async (mode) => {
    try {
      const modes = await tableGet<Mode>(DB_KEYS.modes);
      const idx = modes.findIndex((m) => m.id === mode.id);
      if (idx !== -1) {
        modes[idx] = mode;
        await tableSet(DB_KEYS.modes, modes);
      }
      await get().loadModes();
    } catch (error) {
      console.error('Error updating mode:', error);
      throw error;
    }
  },

  deleteMode: async (id) => {
    try {
      let modes = await tableGet<Mode>(DB_KEYS.modes);
      modes = modes.filter((m) => m.id !== id || !m.isCustom);
      await tableSet(DB_KEYS.modes, modes);
      await get().loadModes();
    } catch (error) {
      console.error('Error deleting mode:', error);
      throw error;
    }
  },
}));
