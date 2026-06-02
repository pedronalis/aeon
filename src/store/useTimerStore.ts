import { create } from 'zustand';
import { TimerEngine } from '@/domain/timer/TimerEngine';
import type { TimerSnapshot } from '@/domain/timer/types';
import type { Mode } from '@/domain/modes/Mode';
import { getDefaultPreset } from '@/domain/modes/presets';
import { formatDate } from '@/domain/utils/dateUtils';
import { ScoreEngine } from '@/domain/scoring/ScoreEngine';
import type { AchievementContext, DailyStats } from '@/domain/scoring/ScoreEngine';
import { QuestEngine } from '@/domain/quests/QuestEngine';
import { useSettingsStore } from './useSettingsStore';
import { useStatsStore } from './useStatsStore';
import { useQuestsStore } from './useQuestsStore';
import { useTasksStore } from './useTasksStore';
import { useNotificationsStore } from './useNotificationsStore';
import { tableGet, tableSet, dbGet, dbSet, DB_KEYS } from '@/lib/storage';
import { getCurrentUserId, supaGetDailyStats, supaUpsertDailyStats, supaGetUserProgress, supaUpdateUserProgress, supaGetAchievements, supaGetModes } from '@/lib/supabaseStorage';

interface TimerStore {
  engine: TimerEngine;
  snapshot: TimerSnapshot;
  tickInterval: number | null;

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
let timerSessionActive = false;

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
      timerSessionActive = true;
      const { notificationsEnabled, soundEnabled } = useSettingsStore.getState().settings;
      if (notificationsEnabled) void ensureWebNotificationPermission();
      if (soundEnabled) void ensureAudioContext();

      if (tickIntervalId) clearInterval(tickIntervalId);
      tickIntervalId = setInterval(() => {
        get().tick();
      }, 1000);
    },

    pause: () => {
      const { engine } = get();
      const snapshot = engine.pause();
      set({ snapshot });
      if (tickIntervalId) { clearInterval(tickIntervalId); tickIntervalId = null; }
    },

    resume: () => {
      const { engine } = get();
      const snapshot = engine.resume();
      set({ snapshot });
      timerSessionActive = true;
      const { notificationsEnabled, soundEnabled } = useSettingsStore.getState().settings;
      if (notificationsEnabled) void ensureWebNotificationPermission();
      if (soundEnabled) void ensureAudioContext();

      if (tickIntervalId) clearInterval(tickIntervalId);
      tickIntervalId = setInterval(() => {
        get().tick();
      }, 1000);
    },

    skip: () => {
      const { engine, snapshot: currentSnapshot } = get();
      if (currentSnapshot.state !== 'RUNNING' && currentSnapshot.state !== 'PAUSED') return;
      const snapshot = engine.skip();
      set({ snapshot });
      timerSessionActive = true;
      if (tickIntervalId) { clearInterval(tickIntervalId); tickIntervalId = null; }
      handlePhaseComplete(snapshot);
    },

    reset: () => {
      const { engine } = get();
      const snapshot = engine.reset();
      set({ snapshot });
      timerSessionActive = false;
      if (tickIntervalId) { clearInterval(tickIntervalId); tickIntervalId = null; }
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
      timerSessionActive = false;
      if (tickIntervalId) { clearInterval(tickIntervalId); tickIntervalId = null; }
    },

    tick: () => {
      const { engine } = get();
      const snapshot = engine.tick();
      set({ snapshot });
      if (snapshot.state === 'FINISHED') {
        if (tickIntervalId) { clearInterval(tickIntervalId); tickIntervalId = null; }
        handlePhaseComplete(snapshot);
      }
    },
  };
});

async function handlePhaseComplete(snapshot: TimerSnapshot) {
  if (snapshot.state !== 'FINISHED') return;
  if (!timerSessionActive) return;
  timerSessionActive = false;
  const completedFocus = snapshot.phase === 'SHORT_BREAK' || snapshot.phase === 'LONG_BREAK';
  const notifications = useNotificationsStore.getState();
  let xpGained = 0;
  let currentStreak = 0;

  if (completedFocus) {
    try {
      const userId = await getCurrentUserId();
      const date = formatDate(new Date());
      const focusMinutes = Math.floor(snapshot.mode.focusDuration / 60);

      let dailyStats: DailyStats[] = [];
      if (userId) {
        dailyStats = await supaGetDailyStats(userId);
      } else {
        dailyStats = await tableGet<DailyStats>(DB_KEYS.dailyStats);
      }

      const idx = dailyStats.findIndex((s) => s.date === date && s.modeId === snapshot.mode.id);
      if (idx !== -1) {
        dailyStats[idx].pomodorosCompleted += 1;
        dailyStats[idx].totalFocusMinutes += focusMinutes;
      } else {
        dailyStats.push({ date, modeId: snapshot.mode.id, pomodorosCompleted: 1, totalFocusMinutes: focusMinutes });
      }

      if (userId) {
        await supaUpsertDailyStats(userId, dailyStats);
      } else {
        await tableSet(DB_KEYS.dailyStats, dailyStats);
      }

      let progress: { totalXp: number; currentStreak: number; bestStreak: number; lastActivityDate: string | null };
      if (userId) {
        const p = await supaGetUserProgress(userId);
        progress = p ?? { totalXp: 0, currentStreak: 0, bestStreak: 0, lastActivityDate: null };
      } else {
        progress = (await dbGet<{ totalXp: number; currentStreak: number; bestStreak: number; lastActivityDate: string | null }>(DB_KEYS.userProgress)) ?? { totalXp: 0, currentStreak: 0, bestStreak: 0, lastActivityDate: null };
      }

      currentStreak = progress.currentStreak;
      xpGained = ScoreEngine.calculateXpForFocus(snapshot.mode, currentStreak);
      progress.totalXp += xpGained;
      progress.lastActivityDate = date;

      if (userId) {
        await supaUpdateUserProgress(userId, { totalXp: progress.totalXp, lastActivityDate: date });
      } else {
        await dbSet(DB_KEYS.userProgress, progress);
      }

      await useStatsStore.getState().loadStats();

      const completionTime = new Date();
      const achievementContext = await buildAchievementContext(completionTime);
      const newAchievements = ScoreEngine.checkAchievements(achievementContext);

      for (const achievement of newAchievements) {
        await useStatsStore.getState().unlockAchievement(achievement.id, achievement.category, achievement.xp);
        console.log(`Achievement unlocked: ${achievement.name} (+${achievement.xp} XP)`);
      }

      const questsStore = useQuestsStore.getState();
      await questsStore.updateQuestProgress('daily_3_focuses', 1, false);
      await questsStore.updateQuestProgress('daily_100_minutes', focusMinutes, false);
      if (QuestEngine.isEarlyBirdFocus(completionTime)) {
        await questsStore.updateQuestProgress('daily_early_bird', 1, false);
      }
      await questsStore.updateQuestProgress('weekly_20_focuses', 1, true);
      await questsStore.updatePerfectWeekProgress();

      const tasksStore = useTasksStore.getState();
      if (tasksStore.activeTaskId) {
        await tasksStore.linkPomodoro(tasksStore.activeTaskId);
      }
    } catch (error) {
      console.error('Error saving focus:', error);
    }
  }

  if (completedFocus) {
    const description = currentStreak >= 3
      ? `A chama arde forte: ${currentStreak} dias de sequencia.`
      : 'A chama foi alimentada.';
    if (xpGained > 0) {
      notifications.pushToast({ kind: 'xp', title: 'Ritual consumado', description, xp: xpGained, icon: '🔥' });
    } else {
      notifications.pushToast({ kind: 'timer', title: 'Ritual consumado', description, icon: '🔥' });
    }
    await notifyFocusCompletion(xpGained, currentStreak);
  } else {
    notifications.pushToast({ kind: 'timer', title: 'Intervalo encerrado', description: 'Hora de reacender o foco.', icon: '⏳' });
    await notifyBreakCompletion();
  }
}

async function playCompletionSound() {
  try {
    const context = await ensureAudioContext();
    if (context) {
      const buffer = await loadCompletionSound(context);
      if (buffer) {
        const source = context.createBufferSource();
        const gain = context.createGain();
        source.buffer = buffer;
        gain.gain.value = 0.5;
        source.connect(gain);
        gain.connect(context.destination);
        source.start(0);
        return;
      }
    }
    await playFallbackBeep();
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
  const tasks: Array<Promise<unknown>> = [];
  if (settingsState.settings.notificationsEnabled) {
    const streakBonus = currentStreak >= 3 ? ` (Bonus streak ${currentStreak}d!)` : '';
    const body = xpGained > 0 ? `+${xpGained} XP${streakBonus}` : 'Foco concluido.';
    tasks.push(sendWebNotification({ title: 'Foco completado!', body }));
  }
  if (settingsState.settings.soundEnabled) tasks.push(playCompletionSound());
  if (tasks.length > 0) await Promise.allSettled(tasks);
}

async function notifyBreakCompletion() {
  const settingsState = useSettingsStore.getState();
  const tasks: Array<Promise<unknown>> = [];
  if (settingsState.settings.notificationsEnabled) {
    tasks.push(sendWebNotification({ title: 'Pausa concluida!', body: 'Hora de voltar ao foco.' }));
  }
  if (settingsState.settings.soundEnabled) tasks.push(playCompletionSound());
  if (tasks.length > 0) await Promise.allSettled(tasks);
}

let audioContext: AudioContext | null = null;

async function ensureAudioContext(): Promise<AudioContext | null> {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContext) audioContext = new AudioContextClass();
    if (audioContext.state === 'suspended') await audioContext.resume();
    return audioContext;
  } catch (error) {
    console.error('Error initializing audio context:', error);
    return null;
  }
}

let webNotificationPermissionRequested = false;

async function ensureWebNotificationPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  if (webNotificationPermissionRequested) return false;
  webNotificationPermissionRequested = true;
  try {
    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      return result === 'granted';
    }
    return Notification.permission === 'granted';
  } catch (error) {
    console.error('Error requesting web notification permission:', error);
    return false;
  }
}

async function sendWebNotification(payload: { title: string; body: string }): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  try {
    const permissionGranted = await ensureWebNotificationPermission();
    if (!permissionGranted) return false;
    new Notification(payload.title, { body: payload.body });
    return true;
  } catch (error) {
    console.error('Error sending web notification:', error);
    return false;
  }
}

let completionSoundBuffer: AudioBuffer | null = null;
let completionSoundLoading: Promise<AudioBuffer | null> | null = null;

async function loadCompletionSound(context: AudioContext): Promise<AudioBuffer | null> {
  if (completionSoundBuffer) return completionSoundBuffer;
  if (completionSoundLoading) return completionSoundLoading;
  completionSoundLoading = fetch('/sounds/complete.wav')
    .then((response) => response.arrayBuffer())
    .then((buffer) => context.decodeAudioData(buffer))
    .then((decoded) => { completionSoundBuffer = decoded; return decoded; })
    .catch((error) => { console.error('Error loading completion sound:', error); return null; })
    .finally(() => { completionSoundLoading = null; });
  return completionSoundLoading;
}

async function buildAchievementContext(completionTime: Date): Promise<AchievementContext> {
  const userId = await getCurrentUserId();
  let dailyStats: DailyStats[] = [];
  let unlockedAchievementIds: string[] = [];
  let hasCustomMode = false;

  if (userId) {
    dailyStats = await supaGetDailyStats(userId);
    const achs = await supaGetAchievements(userId);
    unlockedAchievementIds = achs.map((a) => a.achievement_id);
    const custom = await supaGetModes(userId);
    hasCustomMode = custom.length > 0;
  } else {
    dailyStats = await tableGet<DailyStats>(DB_KEYS.dailyStats);
    const achievementsRecords = await tableGet<{ id: string }>(DB_KEYS.achievements);
    unlockedAchievementIds = achievementsRecords.map((row) => row.id);
    const modes = await tableGet<{ id: string; isCustom: boolean }>(DB_KEYS.modes);
    hasCustomMode = modes.some((m) => m.isCustom);
  }

  const totalPomodoros = dailyStats.reduce((sum, s) => sum + s.pomodorosCompleted, 0);
  const modesUsed = new Set(dailyStats.map((s) => s.modeId));

  return {
    dailyStats,
    unlockedAchievementIds,
    totalPomodoros,
    modesUsed,
    hasCustomMode,
    completionTime,
  };
}
