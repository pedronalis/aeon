import type { Mode } from '../modes/Mode';
import type { TimerSnapshot, TimerState, TimerPhase } from './types';

/**
 * Timer Engine com anti-drift
 *
 * Implementa um timer preciso usando timestamps reais (Date.now())
 * ao invés de confiar apenas em setInterval, que pode ter drift devido a
 * throttling do browser, garbage collection, etc.
 *
 * Engine é desacoplada da UI - a integração com React/Zustand é feita em useTimerStore
 */
export class TimerEngine {
  private state: TimerState = 'IDLE';
  private phase: TimerPhase = 'FOCUS';
  private remainingSeconds: number;
  private startTimestamp: number | null = null;
  private pausedAt: number | null = null;
  private completedPomodoros: number = 0;
  private mode: Mode;

  constructor(mode: Mode) {
    this.mode = mode;
    this.remainingSeconds = mode.focusDuration;
  }

  /**
   * Inicia o timer
   */
  start(): TimerSnapshot {
    if (this.state === 'IDLE' || this.state === 'FINISHED') {
      this.state = 'RUNNING';
      this.startTimestamp = Date.now();
    }
    return this.snapshot();
  }

  /**
   * Pausa o timer
   */
  pause(): TimerSnapshot {
    if (this.state === 'RUNNING') {
      this.state = 'PAUSED';
      this.pausedAt = Date.now();

      // Calcular tempo decorrido desde o start e atualizar remainingSeconds
      if (this.startTimestamp) {
        const elapsed = Math.floor((this.pausedAt - this.startTimestamp) / 1000);
        this.remainingSeconds = Math.max(0, this.remainingSeconds - elapsed);
      }

      this.startTimestamp = null;
    }
    return this.snapshot();
  }

  /**
   * Resume o timer após pausar
   */
  resume(): TimerSnapshot {
    if (this.state === 'PAUSED') {
      this.state = 'RUNNING';
      this.startTimestamp = Date.now();
      this.pausedAt = null;
    }
    return this.snapshot();
  }

  /**
   * Skip para a próxima fase
   */
  skip(): TimerSnapshot {
    if (this.state === 'RUNNING' || this.state === 'PAUSED') {
      // Se estamos em FOCUS, incrementar pomodoros completados
      if (this.phase === 'FOCUS') {
        this.completedPomodoros++;
      }

      this.moveToNextPhase();
      this.state = 'FINISHED';
      this.startTimestamp = null;
      this.pausedAt = null;
    }
    return this.snapshot();
  }

  /**
   * Reset do timer para início da fase atual
   */
  reset(): TimerSnapshot {
    this.state = 'IDLE';
    this.startTimestamp = null;
    this.pausedAt = null;
    this.remainingSeconds = this.getDurationForPhase(this.phase);
    return this.snapshot();
  }

  /**
   * Adiciona 1 minuto ao tempo restante
   */
  addMinute(): TimerSnapshot {
    this.remainingSeconds += 60;
    return this.snapshot();
  }

  /**
   * Subtrai 1 minuto do tempo restante (mínimo 60 segundos)
   */
  subtractMinute(): TimerSnapshot {
    this.remainingSeconds = Math.max(60, this.remainingSeconds - 60);
    return this.snapshot();
  }

  /**
   * Troca o modo (preset ou custom)
   * Reset completo do timer
   */
  setMode(mode: Mode): TimerSnapshot {
    this.mode = mode;
    this.state = 'IDLE';
    this.phase = 'FOCUS';
    this.completedPomodoros = 0;
    this.remainingSeconds = mode.focusDuration;
    this.startTimestamp = null;
    this.pausedAt = null;
    return this.snapshot();
  }

  /**
   * Tick do timer - deve ser chamado a cada ~1 segundo
   * Implementa anti-drift calculando elapsed time baseado em timestamps reais
   */
  tick(): TimerSnapshot {
    if (this.state !== 'RUNNING' || !this.startTimestamp) {
      return this.snapshot();
    }

    // Anti-drift: calcular elapsed baseado em timestamp real
    const now = Date.now();
    const elapsed = Math.floor((now - this.startTimestamp) / 1000);
    this.remainingSeconds = Math.max(0, this.remainingSeconds - elapsed);

    // Reset startTimestamp para o próximo tick
    // Isso garante que sempre calculamos apenas o delta desde o último tick
    this.startTimestamp = now;

    // Verificar se fase completou
    if (this.remainingSeconds === 0) {
      this.handlePhaseComplete();
    }

    return this.snapshot();
  }

  /**
   * Retorna snapshot do estado atual
   */
  snapshot(): TimerSnapshot {
    return {
      state: this.state,
      phase: this.phase,
      remainingSeconds: this.remainingSeconds,
      completedPomodoros: this.completedPomodoros,
      mode: this.mode,
      isLastMinute: this.remainingSeconds > 0 && this.remainingSeconds <= 60,
    };
  }

  /**
   * Handler quando uma fase é completada
   * - Se FOCUS: incrementar pomodoros e mover para SHORT ou LONG break
   * - Se BREAK: mover para FOCUS
   */
  private handlePhaseComplete(): void {
    if (this.phase === 'FOCUS') {
      this.completedPomodoros++;

      // Determinar se próxima pausa é LONG ou SHORT
      const shouldLongBreak =
        this.completedPomodoros % this.mode.pomodorosUntilLongBreak === 0;

      this.phase = shouldLongBreak ? 'LONG_BREAK' : 'SHORT_BREAK';
    } else {
      // Após qualquer break, voltar para FOCUS
      this.phase = 'FOCUS';
    }

    this.state = 'FINISHED';
    this.remainingSeconds = this.getDurationForPhase(this.phase);
    this.startTimestamp = null;
  }

  /**
   * Move para a próxima fase sem completar a atual
   * Usado pelo skip()
   */
  private moveToNextPhase(): void {
    if (this.phase === 'FOCUS') {
      const shouldLongBreak =
        this.completedPomodoros % this.mode.pomodorosUntilLongBreak === 0;
      this.phase = shouldLongBreak ? 'LONG_BREAK' : 'SHORT_BREAK';
    } else {
      this.phase = 'FOCUS';
    }

    this.remainingSeconds = this.getDurationForPhase(this.phase);
  }

  /**
   * Retorna duração em segundos para uma fase específica
   */
  private getDurationForPhase(phase: TimerPhase): number {
    switch (phase) {
      case 'FOCUS':
        return this.mode.focusDuration;
      case 'SHORT_BREAK':
        return this.mode.shortBreakDuration;
      case 'LONG_BREAK':
        return this.mode.longBreakDuration;
    }
  }

  // Getters para facilitar testes e debug
  getState(): TimerState {
    return this.state;
  }

  getPhase(): TimerPhase {
    return this.phase;
  }

  getRemainingSeconds(): number {
    return this.remainingSeconds;
  }

  getCompletedPomodoros(): number {
    return this.completedPomodoros;
  }

  getMode(): Mode {
    return this.mode;
  }
}
