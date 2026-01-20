import { create } from 'zustand';
import Database from '@tauri-apps/plugin-sql';
import { sendNotification, isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification';
import { TimerEngine } from '@/domain/timer/TimerEngine';
import type { TimerSnapshot } from '@/domain/timer/types';
import type { Mode } from '@/domain/modes/Mode';
import { getDefaultPreset } from '@/domain/modes/presets';
import { formatDate } from '@/domain/utils/dateUtils';
import { ScoreEngine } from '@/domain/scoring/ScoreEngine';
import type { AchievementContext } from '@/domain/scoring/ScoreEngine';
import { QuestEngine } from '@/domain/quests/QuestEngine';
import { useSettingsStore } from './useSettingsStore';
import { useStatsStore } from './useStatsStore';
import { useQuestsStore } from './useQuestsStore';
import { useTasksStore } from './useTasksStore';

interface TimerStore {
  engine: TimerEngine;
  snapshot: TimerSnapshot;
  tickInterval: number | null;

  // Actions
  start: () => void;
  pause: () => void;
  resume: () => void;
  skip: () => void;
  reset: () => void;
  addMinute: () => void;
  subtractMinute: () => void;
  setMode: (mode: Mode) => void;
  tick: () => void;
}

let tickIntervalId: ReturnType<typeof setInterval> | null = null;

export const useTimerStore = create<TimerStore>((set, get) => {
  const initialMode = getDefaultPreset();
  const engine = new TimerEngine(initialMode);

  return {
    engine,
    snapshot: engine.snapshot(),
    tickInterval: null,

    start: () => {
      const { engine } = get();
      const snapshot = engine.start();
      set({ snapshot });
      void ensureNotificationPermission();
      void ensureWebNotificationPermission();
      void ensureAudioContext();
      void ensureNotificationPermission();
      void ensureAudioContext();

      // Iniciar interval de 1 segundo
      if (tickIntervalId) clearInterval(tickIntervalId);
      tickIntervalId = setInterval(() => {
        get().tick();
      }, 1000);
    },

    pause: () => {
      const { engine } = get();
      const snapshot = engine.pause();
      set({ snapshot });

      if (tickIntervalId) {
        clearInterval(tickIntervalId);
        tickIntervalId = null;
      }
    },

    resume: () => {
      const { engine } = get();
      const snapshot = engine.resume();
      set({ snapshot });
      void ensureNotificationPermission();
      void ensureWebNotificationPermission();
      void ensureAudioContext();
      void ensureNotificationPermission();
      void ensureAudioContext();

      // Reiniciar interval
      if (tickIntervalId) clearInterval(tickIntervalId);
      tickIntervalId = setInterval(() => {
        get().tick();
      }, 1000);
    },

    skip: () => {
      const { engine } = get();
      const snapshot = engine.skip();
      set({ snapshot });

      if (tickIntervalId) {
        clearInterval(tickIntervalId);
        tickIntervalId = null;
      }

      // Trigger completion handler
      handlePhaseComplete(snapshot);
    },

    reset: () => {
      const { engine } = get();
      const snapshot = engine.reset();
      set({ snapshot });

      if (tickIntervalId) {
        clearInterval(tickIntervalId);
        tickIntervalId = null;
      }
    },

    addMinute: () => {
      const { engine } = get();
      const snapshot = engine.addMinute();
      set({ snapshot });
    },

    subtractMinute: () => {
      const { engine } = get();
      const snapshot = engine.subtractMinute();
      set({ snapshot });
    },

    setMode: (mode: Mode) => {
      const { engine } = get();
      const snapshot = engine.setMode(mode);
      set({ snapshot });

      if (tickIntervalId) {
        clearInterval(tickIntervalId);
        tickIntervalId = null;
      }
    },

    tick: () => {
      const { engine } = get();
      const snapshot = engine.tick();
      set({ snapshot });

      // Verificar se fase completou
      if (snapshot.state === 'FINISHED') {
        if (tickIntervalId) {
          clearInterval(tickIntervalId);
          tickIntervalId = null;
        }
        handlePhaseComplete(snapshot);
      }
    },
  };
});

/**
 * Handler quando uma fase é completada
 */
async function handlePhaseComplete(snapshot: TimerSnapshot) {
  // Se completou um FOCUS, salvar no backend
  if (snapshot.phase === 'SHORT_BREAK' || snapshot.phase === 'LONG_BREAK') {
    // Significa que acabou de completar um FOCUS (agora está no break)
    let xpGained = 0;
    let currentStreak = 0;
    try {
      const db = await Database.load('sqlite:pomodore.db');
      const date = formatDate(new Date());
      const focusMinutes = Math.floor(snapshot.mode.focusDuration / 60);

      // 1. Salvar daily_stats
      const existing = await db.select<Array<{ pomodoros_completed: number; total_focus_minutes: number }>>(
        'SELECT pomodoros_completed, total_focus_minutes FROM daily_stats WHERE date = $1 AND mode_id = $2',
        [date, snapshot.mode.id]
      );

      if (existing.length > 0) {
        await db.execute(
          'UPDATE daily_stats SET pomodoros_completed = pomodoros_completed + 1, total_focus_minutes = total_focus_minutes + $1 WHERE date = $2 AND mode_id = $3',
          [focusMinutes, date, snapshot.mode.id]
        );
      } else {
        await db.execute(
          'INSERT INTO daily_stats (date, mode_id, pomodoros_completed, total_focus_minutes) VALUES ($1, $2, 1, $3)',
          [date, snapshot.mode.id, focusMinutes]
        );
      }

      // 2. Buscar current_streak
      const progressRows = await db.select<Array<{ current_streak: number }>>(
        'SELECT current_streak FROM user_progress WHERE id = 1'
      );
      currentStreak = progressRows.length > 0 ? progressRows[0].current_streak : 0;

      // 3. Calcular XP dinâmico
      xpGained = ScoreEngine.calculateXpForFocus(snapshot.mode, currentStreak);

      // 4. Atualizar XP total e última atividade
      await db.execute(
        'UPDATE user_progress SET total_xp = total_xp + $1, last_activity_date = $2 WHERE id = 1',
        [xpGained, date]
      );

      // 5. Recarregar stats para ter dados atualizados para achievements
      await useStatsStore.getState().loadStats();

      // 6. Verificar achievements desbloqueados
      const completionTime = new Date();
      const achievementContext = await buildAchievementContext(db, snapshot, completionTime);
      const newAchievements = ScoreEngine.checkAchievements(achievementContext);

      for (const achievement of newAchievements) {
        await useStatsStore.getState().unlockAchievement(
          achievement.id,
          achievement.category,
          achievement.xp
        );
        console.log(`Achievement unlocked: ${achievement.name} (+${achievement.xp} XP)`);
        // TODO: Mostrar toast de achievement
      }

      // 7. Atualizar progresso de quests
      const questsStore = useQuestsStore.getState();

      // Quest: 3 focos hoje
      await questsStore.updateQuestProgress('daily_3_focuses', 1, false);

      // Quest: 100 minutos hoje
      await questsStore.updateQuestProgress('daily_100_minutes', focusMinutes, false);

      // Quest: Early bird (antes das 9h)
      if (QuestEngine.isEarlyBirdFocus(completionTime)) {
        await questsStore.updateQuestProgress('daily_early_bird', 1, false);
      }

      // Quest: 20 focos esta semana
      await questsStore.updateQuestProgress('weekly_20_focuses', 1, true);

      // Quest: Perfect week (1 foco por dia) - verificar dias únicos
      await questsStore.updatePerfectWeekProgress();

      // 8. Link pomodoro to active task if any
      const tasksStore = useTasksStore.getState();
      if (tasksStore.activeTaskId) {
        await tasksStore.linkPomodoro(tasksStore.activeTaskId);
      }

    } catch (error) {
      console.error('Error saving focus:', error);
    }

    await notifyFocusCompletion(xpGained, currentStreak);
  }
}

/**
 * Toca som de conclusão
 */
async function playCompletionSound() {
  try {
    const audio = new Audio('/sounds/complete.wav');
    audio.volume = 0.5;
    await audio.play();
  } catch (error) {
    console.error('Error playing sound:', error);
    await playFallbackBeep();
  }
}

async function playFallbackBeep() {
  try {
    const context = await ensureAudioContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.value = 0.05;

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.25);
  } catch (error) {
    console.error('Error playing fallback beep:', error);
  }
}

async function notifyFocusCompletion(xpGained: number, currentStreak: number) {
  const settingsState = useSettingsStore.getState();
  if (settingsState.settings.notificationsEnabled) {
    const streakBonus = currentStreak >= 3 ? ` (Bônus streak ${currentStreak}d!)` : '';
    const body = xpGained > 0 ? `+${xpGained} XP${streakBonus}` : 'Foco concluído.';
    try {
      await ensureNotificationPermission();

      await sendNotification({
        title: 'Foco completado!',
        body,
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      await sendWebNotification({
        title: 'Foco completado!',
        body,
      });
    }
  }

  if (settingsState.settings.soundEnabled) {
    await playCompletionSound();
  }
}

let notificationPermissionRequested = false;

async function ensureNotificationPermission() {
  if (notificationPermissionRequested) return;
  notificationPermissionRequested = true;
  try {
    const permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      await requestPermission();
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
  }
}

let audioContext: AudioContext | null = null;

async function ensureAudioContext(): Promise<AudioContext | null> {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioContext) {
      audioContext = new AudioContextClass();
    }
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    return audioContext;
  } catch (error) {
    console.error('Error initializing audio context:', error);
    return null;
  }
}

let webNotificationPermissionRequested = false;

async function ensureWebNotificationPermission() {
  if (webNotificationPermissionRequested) return;
  webNotificationPermissionRequested = true;
  if (typeof Notification === 'undefined') return;
  try {
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  } catch (error) {
    console.error('Error requesting web notification permission:', error);
  }
}

async function sendWebNotification(payload: { title: string; body: string }) {
  if (typeof Notification === 'undefined') return;
  try {
    if (Notification.permission === 'default') {
      await ensureWebNotificationPermission();
    }
    if (Notification.permission !== 'granted') return;
    new Notification(payload.title, { body: payload.body });
  } catch (error) {
    console.error('Error sending web notification:', error);
  }
}

/**
 * Constrói contexto para verificação de achievements
 */
async function buildAchievementContext(
  db: Database,
  _snapshot: TimerSnapshot,
  completionTime: Date
): Promise<AchievementContext> {
  // Buscar daily stats
  const dailyStatsRows = await db.select<
    Array<{
      date: string;
      mode_id: string;
      pomodoros_completed: number;
      total_focus_minutes: number;
    }>
  >('SELECT * FROM daily_stats ORDER BY date DESC');

  const dailyStats = dailyStatsRows.map((row) => ({
    date: row.date,
    modeId: row.mode_id,
    pomodorosCompleted: row.pomodoros_completed,
    totalFocusMinutes: row.total_focus_minutes,
  }));

  // Buscar achievements desbloqueados
  const achievementsRows = await db.select<Array<{ id: string }>>(
    'SELECT id FROM achievements'
  );
  const unlockedAchievementIds = achievementsRows.map((row) => row.id);

  // Calcular total de pomodoros
  const totalPomodoros = dailyStats.reduce((sum, s) => sum + s.pomodorosCompleted, 0);

  // Modos usados
  const modesUsed = new Set(dailyStats.map((s) => s.modeId));

  // Verificar se tem custom mode
  const modesRows = await db.select<Array<{ is_custom: number }>>(
    'SELECT is_custom FROM modes WHERE is_custom = 1'
  );
  const hasCustomMode = modesRows.length > 0;

  return {
    dailyStats,
    unlockedAchievementIds,
    totalPomodoros,
    modesUsed,
    hasCustomMode,
    completionTime,
  };
}
