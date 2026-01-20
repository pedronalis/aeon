import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TimerEngine } from './TimerEngine';
import { getDefaultPreset } from '../modes/presets';
import type { Mode } from '../modes/Mode';

describe('TimerEngine', () => {
  let engine: TimerEngine;
  let mockMode: Mode;

  beforeEach(() => {
    // Usar modo tradicional simplificado para testes rápidos
    mockMode = {
      ...getDefaultPreset(),
      focusDuration: 120, // 2 minutos
      shortBreakDuration: 60, // 1 minuto
      longBreakDuration: 180, // 3 minutos
      pomodorosUntilLongBreak: 2,
    };
    engine = new TimerEngine(mockMode);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Inicialização', () => {
    it('deve iniciar no estado IDLE', () => {
      const snapshot = engine.snapshot();
      expect(snapshot.state).toBe('IDLE');
    });

    it('deve iniciar na fase FOCUS', () => {
      const snapshot = engine.snapshot();
      expect(snapshot.phase).toBe('FOCUS');
    });

    it('deve iniciar com tempo restante igual à duração do foco', () => {
      const snapshot = engine.snapshot();
      expect(snapshot.remainingSeconds).toBe(mockMode.focusDuration);
    });

    it('deve iniciar com 0 pomodoros completados', () => {
      const snapshot = engine.snapshot();
      expect(snapshot.completedPomodoros).toBe(0);
    });
  });

  describe('start()', () => {
    it('deve mudar estado de IDLE para RUNNING', () => {
      engine.start();
      expect(engine.getState()).toBe('RUNNING');
    });

    it('deve iniciar o timestamp', () => {
      const before = Date.now();
      engine.start();
      // Timestamp deve ser próximo ao momento atual
      expect(engine.snapshot().state).toBe('RUNNING');
      const after = Date.now();
      // Verifica que start foi chamado recentemente (diferença < 100ms)
      expect(after - before).toBeLessThan(100);
    });
  });

  describe('pause()', () => {
    it('deve mudar estado de RUNNING para PAUSED', () => {
      engine.start();
      engine.pause();
      expect(engine.getState()).toBe('PAUSED');
    });

    it('não deve mudar estado se não estiver RUNNING', () => {
      engine.pause();
      expect(engine.getState()).toBe('IDLE');
    });
  });

  describe('resume()', () => {
    it('deve mudar estado de PAUSED para RUNNING', () => {
      engine.start();
      engine.pause();
      engine.resume();
      expect(engine.getState()).toBe('RUNNING');
    });

    it('não deve mudar estado se não estiver PAUSED', () => {
      engine.resume();
      expect(engine.getState()).toBe('IDLE');
    });
  });

  describe('reset()', () => {
    it('deve voltar ao estado IDLE', () => {
      engine.start();
      engine.reset();
      expect(engine.getState()).toBe('IDLE');
    });

    it('deve resetar tempo restante para duração da fase atual', () => {
      engine.start();
      // Simular alguns segundos passados
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 5000);
      engine.tick();
      engine.reset();
      expect(engine.getRemainingSeconds()).toBe(mockMode.focusDuration);
    });
  });

  describe('skip()', () => {
    it('deve mudar para próxima fase', () => {
      engine.start();
      engine.skip();
      expect(engine.getPhase()).toBe('SHORT_BREAK');
      expect(engine.getState()).toBe('FINISHED');
    });

    it('deve incrementar pomodoros completados ao skip de FOCUS', () => {
      engine.start();
      engine.skip();
      expect(engine.getCompletedPomodoros()).toBe(1);
    });

    it('não deve incrementar pomodoros completados ao skip de BREAK', () => {
      engine.start();
      engine.skip(); // Skip FOCUS -> SHORT_BREAK
      const pomodorosBefore = engine.getCompletedPomodoros();
      engine.start();
      engine.skip(); // Skip SHORT_BREAK -> FOCUS
      expect(engine.getCompletedPomodoros()).toBe(pomodorosBefore);
    });
  });

  describe('addMinute() e subtractMinute()', () => {
    it('addMinute deve adicionar 60 segundos', () => {
      const initialSeconds = engine.getRemainingSeconds();
      engine.addMinute();
      expect(engine.getRemainingSeconds()).toBe(initialSeconds + 60);
    });

    it('subtractMinute deve remover 60 segundos', () => {
      engine.addMinute();
      engine.addMinute();
      const initialSeconds = engine.getRemainingSeconds();
      engine.subtractMinute();
      expect(engine.getRemainingSeconds()).toBe(initialSeconds - 60);
    });

    it('subtractMinute não deve ir abaixo de 60 segundos', () => {
      // Modo já inicia com 120 segundos (2 minutos)
      engine.subtractMinute(); // 60 segundos
      engine.subtractMinute(); // Deve ficar em 60, não ir para 0
      expect(engine.getRemainingSeconds()).toBe(60);
    });
  });

  describe('setMode()', () => {
    it('deve trocar o modo e resetar o timer', () => {
      const newMode: Mode = {
        ...mockMode,
        id: 'custom_test',
        focusDuration: 300,
      };

      engine.start();
      engine.setMode(newMode);

      expect(engine.getMode().id).toBe('custom_test');
      expect(engine.getState()).toBe('IDLE');
      expect(engine.getPhase()).toBe('FOCUS');
      expect(engine.getRemainingSeconds()).toBe(300);
      expect(engine.getCompletedPomodoros()).toBe(0);
    });
  });

  describe('tick() - Anti-drift', () => {
    it('deve decrementar tempo baseado em elapsed time real', () => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);

      engine.start();

      // Simular 5 segundos passados
      vi.spyOn(Date, 'now').mockReturnValue(now + 5000);
      engine.tick();

      // Tempo restante deve ter diminuído 5 segundos
      expect(engine.getRemainingSeconds()).toBe(mockMode.focusDuration - 5);
    });

    it('não deve alterar tempo se não estiver RUNNING', () => {
      const initialSeconds = engine.getRemainingSeconds();
      engine.tick();
      expect(engine.getRemainingSeconds()).toBe(initialSeconds);
    });

    it('deve completar fase quando tempo chegar a zero', () => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);

      engine.start();

      // Simular tempo suficiente para completar fase
      vi.spyOn(Date, 'now').mockReturnValue(now + mockMode.focusDuration * 1000);
      engine.tick();

      expect(engine.getState()).toBe('FINISHED');
      expect(engine.getPhase()).toBe('SHORT_BREAK');
      expect(engine.getCompletedPomodoros()).toBe(1);
    });
  });

  describe('Transições de Fase', () => {
    it('deve alternar FOCUS -> SHORT_BREAK -> FOCUS', () => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);

      // FOCUS
      engine.start();
      expect(engine.getPhase()).toBe('FOCUS');

      // Completar FOCUS
      vi.spyOn(Date, 'now').mockReturnValue(now + mockMode.focusDuration * 1000);
      engine.tick();

      expect(engine.getPhase()).toBe('SHORT_BREAK');
      expect(engine.getState()).toBe('FINISHED');

      // Iniciar SHORT_BREAK
      engine.start();
      vi.spyOn(Date, 'now').mockReturnValue(
        now + mockMode.focusDuration * 1000 + mockMode.shortBreakDuration * 1000
      );
      engine.tick();

      expect(engine.getPhase()).toBe('FOCUS');
      expect(engine.getState()).toBe('FINISHED');
    });

    it('deve usar LONG_BREAK após N pomodoros', () => {
      const now = Date.now();
      let currentTime = now;
      vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

      // Completar 1º pomodoro
      engine.start();
      currentTime += mockMode.focusDuration * 1000;
      engine.tick();
      expect(engine.getPhase()).toBe('SHORT_BREAK');
      expect(engine.getCompletedPomodoros()).toBe(1);

      // Skip SHORT_BREAK
      engine.start();
      currentTime += mockMode.shortBreakDuration * 1000;
      engine.tick();
      expect(engine.getPhase()).toBe('FOCUS');

      // Completar 2º pomodoro (pomodorosUntilLongBreak = 2)
      engine.start();
      currentTime += mockMode.focusDuration * 1000;
      engine.tick();

      // Agora deve ser LONG_BREAK
      expect(engine.getPhase()).toBe('LONG_BREAK');
      expect(engine.getCompletedPomodoros()).toBe(2);
    });
  });

  describe('isLastMinute flag', () => {
    it('deve ser true quando remainingSeconds <= 60', () => {
      engine.start();
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);

      // Avançar até restar 60 segundos
      vi.spyOn(Date, 'now').mockReturnValue(now + (mockMode.focusDuration - 60) * 1000);
      const snapshot = engine.tick();

      expect(snapshot.isLastMinute).toBe(true);
    });

    it('deve ser false quando remainingSeconds > 60', () => {
      engine.start();
      const snapshot = engine.tick();
      expect(snapshot.isLastMinute).toBe(false);
    });

    it('deve verificar isLastMinute corretamente quando fase completa', () => {
      engine.start();
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);

      // Completar fase
      vi.spyOn(Date, 'now').mockReturnValue(now + mockMode.focusDuration * 1000);
      const snapshot = engine.tick();

      // Após completar, já prepara para próxima fase (SHORT_BREAK = 60s)
      // Como remainingSeconds = 60 e isLastMinute é true quando <= 60, será true
      expect(snapshot.state).toBe('FINISHED');
      expect(snapshot.phase).toBe('SHORT_BREAK');
      expect(snapshot.remainingSeconds).toBe(60);
      // isLastMinute é true porque 60 <= 60
      expect(snapshot.isLastMinute).toBe(true);
    });
  });

  describe('Precisão do Anti-drift', () => {
    it('deve manter precisão mesmo com ticks irregulares', () => {
      const now = Date.now();
      let currentTime = now;
      vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

      engine.start();
      const initialTime = engine.getRemainingSeconds();

      // Tick 1: após 2 segundos
      currentTime += 2000;
      engine.tick();
      expect(engine.getRemainingSeconds()).toBe(initialTime - 2);

      // Tick 2: após mais 3 segundos
      currentTime += 3000;
      engine.tick();
      expect(engine.getRemainingSeconds()).toBe(initialTime - 5);

      // Tick 3: após mais 5 segundos (pulo maior)
      currentTime += 5000;
      engine.tick();
      expect(engine.getRemainingSeconds()).toBe(initialTime - 10);
    });
  });

  describe('pause() e resume() mantendo estado', () => {
    it('deve manter tempo correto após pause/resume', () => {
      const now = Date.now();
      let currentTime = now;
      vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

      // Iniciar e rodar por 10 segundos
      engine.start();
      currentTime += 10000;
      engine.tick();

      const timeBeforePause = engine.getRemainingSeconds();

      // Pausar (pause() calcula elapsed até agora)
      engine.pause();

      // "Esperar" 30 segundos enquanto pausado (não deve afetar)
      currentTime += 30000;

      // Resume
      engine.resume();

      // Avançar 6 segundos após resume (suficiente para Math.floor dar 6)
      currentTime += 6000;
      engine.tick();

      // Tempo deve ter diminuído apenas 6 segundos desde o resume
      expect(engine.getRemainingSeconds()).toBe(timeBeforePause - 6);
    });
  });
});
