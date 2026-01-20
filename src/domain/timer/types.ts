import type { Mode } from '../modes/Mode';

/**
 * Estados possíveis do timer
 */
export type TimerState = 'IDLE' | 'RUNNING' | 'PAUSED' | 'FINISHED';

/**
 * Fases do ciclo Pomodoro
 */
export type TimerPhase = 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';

/**
 * Snapshot do estado atual do timer
 * Usado para comunicar o estado para a UI e stores
 */
export interface TimerSnapshot {
  state: TimerState;
  phase: TimerPhase;
  remainingSeconds: number;
  completedPomodoros: number;
  mode: Mode;
  isLastMinute: boolean;
}

/**
 * Ações disponíveis no timer
 */
export type TimerAction =
  | 'START'
  | 'PAUSE'
  | 'RESUME'
  | 'SKIP'
  | 'RESET'
  | 'ADD_MINUTE'
  | 'SUBTRACT_MINUTE'
  | 'SET_MODE'
  | 'TICK';
