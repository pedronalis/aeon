import { formatTime } from '@/domain/utils/dateUtils';
import { useTimerStore } from '@/store/useTimerStore';
import { CircularProgress } from './CircularProgress';
import type { TimerPhase } from '@/domain/timer/types';
import type { Mode } from '@/domain/modes/Mode';

export function TimerDisplay() {
  const snapshot = useTimerStore((state) => state.snapshot);
  const isRunning = snapshot.state === 'RUNNING';
  const isLastMinute = snapshot.isLastMinute && isRunning;

  // Calcular duração total baseada na fase
  const getTotalDuration = (phase: TimerPhase, mode: Mode): number => {
    switch (phase) {
      case 'FOCUS':
        return mode.focusDuration;
      case 'SHORT_BREAK':
        return mode.shortBreakDuration;
      case 'LONG_BREAK':
        return mode.longBreakDuration;
    }
  };

  // Calcular progresso
  const modeDuration = getTotalDuration(snapshot.phase, snapshot.mode);
  const totalSeconds = snapshot.state === 'IDLE'
    ? snapshot.remainingSeconds
    : Math.max(modeDuration, snapshot.remainingSeconds);
  const elapsedSeconds = totalSeconds - snapshot.remainingSeconds;
  const progressPercentage = Math.max(0, Math.min(100, (elapsedSeconds / totalSeconds) * 100));

  // Cor baseada na fase/modo - Medieval gold theme
  const progressColor = snapshot.mode.accentColor;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Timer Circle - Minimal Arc */}
      <CircularProgress
        percentage={progressPercentage}
        size={300}
        strokeWidth={4}
        color={progressColor}
      >
        {/* Timer centralizado */}
        <div
          className={`
            font-mono font-bold tracking-tight
            ${isLastMinute
              ? 'animate-pulse-timer'
              : ''
            }
            text-5xl sm:text-6xl
            transition-colors duration-300
          `}
          style={{
            fontVariantNumeric: 'tabular-nums',
            color: isRunning ? progressColor : undefined,
          }}
        >
          {formatTime(snapshot.remainingSeconds)}
        </div>
      </CircularProgress>

      {/* Pomodoro count - inline badge */}
      <div className="parchment-panel px-4 py-2 rounded-full">
        <span className="text-text-secondary text-sm font-heading">
          {snapshot.completedPomodoros} pomodoro{snapshot.completedPomodoros !== 1 ? 's' : ''} completo{snapshot.completedPomodoros !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
