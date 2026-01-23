import { formatTime } from '@/domain/utils/dateUtils';
import { useTimerStore } from '@/store/useTimerStore';
import { CircularProgress } from './CircularProgress';
import { RitualTimeline } from './RitualTimeline';
import type { TimerPhase } from '@/domain/timer/types';
import type { Mode } from '@/domain/modes/Mode';
import { Flame } from 'lucide-react';
import { PHASE_ICONS, PHASE_LABELS } from '@/utils/phaseIcons';

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
  const PhaseIcon = PHASE_ICONS[snapshot.phase];
  const phaseLabel = PHASE_LABELS[snapshot.phase];
  const phaseToneStyle = isRunning ? { color: progressColor } : undefined;
  const glowStyle = {
    background: `radial-gradient(circle at center, ${progressColor}25 0%, transparent 70%)`,
  };
  const glowOpacityClass = isRunning ? 'opacity-40' : 'opacity-20';

  const ritualSummary = snapshot.completedPomodoros === 0
    ? 'Nenhum ritual selado ainda'
    : `${snapshot.completedPomodoros} total`;

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <div className="flex flex-col items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-heading uppercase tracking-[0.3em] text-text-muted mb-3">
          <PhaseIcon size={12} className="text-text-muted" style={phaseToneStyle} />
          <span style={phaseToneStyle}>{phaseLabel}</span>
        </div>

        {/* Timer Circle - Minimal Arc */}
        <div className="relative scale-[0.9] sm:scale-100 lg:scale-[1.05]">
          <div
            className={`absolute -inset-4 rounded-full blur-xl ${glowOpacityClass}`}
            style={glowStyle}
          />
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
                ${isRunning ? 'text-glow' : ''}
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
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 sm:gap-5 w-full">
        {/* Pomodoro count - ritual summary */}
        <div className="parchment-panel px-3 sm:px-4 py-3 rounded-xl w-full max-w-[300px] sm:max-w-[320px] mt-14 sm:mt-16">
          <div className="flex items-center gap-3">
            <div className="parchment-primary p-2 rounded-lg">
              <Flame size={14} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-heading uppercase tracking-[0.2em] text-text-muted">
                Rituais concluídos
              </p>
              <p className="text-sm text-text font-body">
                {ritualSummary}
              </p>
            </div>
          </div>
        </div>

        <div className="-mb-6 sm:-mb-8 w-full flex justify-center">
          <RitualTimeline />
        </div>
      </div>
    </div>
  );
}
