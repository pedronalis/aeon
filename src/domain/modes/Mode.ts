/**
 * Representa um modo/preset de Pomodoro
 * Pode ser um preset fixo ou um modo custom criado pelo usuário
 */
export interface Mode {
  id: string;
  name: string;
  isCustom: boolean;
  focusDuration: number; // em segundos
  shortBreakDuration: number; // em segundos
  longBreakDuration: number; // em segundos
  pomodorosUntilLongBreak: number;
  accentColor: string; // hex color
  disclaimer?: string; // texto do disclaimer
}

/**
 * Validação de um modo
 * Retorna array de erros, ou array vazio se válido
 */
export function validateMode(mode: Partial<Mode>): string[] {
  const errors: string[] = [];

  if (!mode.name || mode.name.trim().length === 0) {
    errors.push('Nome é obrigatório');
  }

  if (!mode.focusDuration || mode.focusDuration < 60) {
    errors.push('Duração de foco deve ser no mínimo 60 segundos (1 minuto)');
  }

  if (!mode.shortBreakDuration || mode.shortBreakDuration < 60) {
    errors.push('Duração de pausa curta deve ser no mínimo 60 segundos (1 minuto)');
  }

  if (!mode.longBreakDuration || mode.longBreakDuration < 60) {
    errors.push('Duração de pausa longa deve ser no mínimo 60 segundos (1 minuto)');
  }

  if (!mode.pomodorosUntilLongBreak || mode.pomodorosUntilLongBreak < 1) {
    errors.push('Pomodoros até pausa longa deve ser no mínimo 1');
  }

  if (!mode.accentColor || !/^#[0-9A-F]{6}$/i.test(mode.accentColor)) {
    errors.push('Cor de destaque deve ser um hex color válido (ex: #7aa2f7)');
  }

  return errors;
}

/**
 * Cria um modo custom com valores padrão
 */
export function createCustomMode(
  name: string,
  overrides: Partial<Omit<Mode, 'id' | 'name' | 'isCustom'>> = {}
): Mode {
  return {
    id: `custom_${Date.now()}`,
    name,
    isCustom: true,
    focusDuration: 25 * 60,
    shortBreakDuration: 5 * 60,
    longBreakDuration: 15 * 60,
    pomodorosUntilLongBreak: 4,
    accentColor: '#7aa2f7',
    disclaimer: 'Modo personalizado',
    ...overrides,
  };
}

/**
 * Formata duração em segundos para string legível
 * Ex: 1500 -> "25 min"
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}min`
    : `${hours}h`;
}
