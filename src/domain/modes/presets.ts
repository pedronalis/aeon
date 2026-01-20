import type { Mode } from './Mode';

/**
 * Modos preset do Pomodore
 *
 * IMPORTANTE: Disclaimers usam linguagem cuidadosa, evitando afirmações
 * de "comprovado cientificamente" como verdade absoluta. Usamos termos como
 * "inspirado em", "baseado em heurísticas", "boas práticas", etc.
 */
export const PRESET_MODES: Mode[] = [
  {
    id: 'traditional',
    name: 'Tradicional',
    isCustom: false,
    focusDuration: 25 * 60, // 25 minutos
    shortBreakDuration: 5 * 60, // 5 minutos
    longBreakDuration: 15 * 60, // 15 minutos
    pomodorosUntilLongBreak: 4,
    accentColor: '#7aa2f7', // Azul Tokyo Night
    disclaimer: 'Preset clássico.',
  },
  {
    id: 'sustainable',
    name: 'Foco Sustentável',
    isCustom: false,
    focusDuration: 50 * 60, // 50 minutos
    shortBreakDuration: 10 * 60, // 10 minutos
    longBreakDuration: 30 * 60, // 30 minutos
    pomodorosUntilLongBreak: 3,
    accentColor: '#9ece6a', // Verde Success
    disclaimer:
      'Inspirado em heurísticas de produtividade sustentável.',
  },
  {
    id: 'animedoro',
    name: 'Animedoro',
    isCustom: false,
    focusDuration: 40 * 60, // 40 minutos
    shortBreakDuration: 20 * 60, // 20 minutos (1 episódio de anime)
    longBreakDuration: 60 * 60, // 60 minutos (2-3 episódios)
    pomodorosUntilLongBreak: 2,
    accentColor: '#bb9af7', // Roxo Accent
    disclaimer:
      'Inspirado em pausas com anime/séries curtas.',
  },
  {
    id: 'mangadoro',
    name: 'Mangadoro',
    isCustom: false,
    focusDuration: 45 * 60, // 45 minutos
    shortBreakDuration: 15 * 60, // 15 minutos (1-2 capítulos de mangá)
    longBreakDuration: 45 * 60, // 45 minutos (3-4 capítulos)
    pomodorosUntilLongBreak: 3,
    accentColor: '#e0af68', // Amarelo Warning
    disclaimer:
      'Inspirado em pausas com leitura de mangá/HQs.',
  },
];

/**
 * Encontra um preset pelo ID
 */
export function getPresetById(id: string): Mode | undefined {
  return PRESET_MODES.find((mode) => mode.id === id);
}

/**
 * Retorna o preset padrão (Tradicional)
 */
export function getDefaultPreset(): Mode {
  return PRESET_MODES[0];
}

/**
 * Verifica se um ID corresponde a um preset (não custom)
 */
export function isPresetMode(id: string): boolean {
  return PRESET_MODES.some((mode) => mode.id === id);
}
