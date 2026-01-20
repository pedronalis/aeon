import { Flame, Coffee, Moon } from 'lucide-react';

export const PHASE_ICONS = {
  FOCUS: Flame,       // Medieval flame for focus ritual
  SHORT_BREAK: Coffee,
  LONG_BREAK: Moon,
} as const;

export const PHASE_LABELS = {
  FOCUS: 'Ritual de Foco',
  SHORT_BREAK: 'Descanso Breve',
  LONG_BREAK: 'Descanso Longo',
} as const;

export type Phase = keyof typeof PHASE_ICONS;
