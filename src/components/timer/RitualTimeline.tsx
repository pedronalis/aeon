import { useMemo } from 'react';
import { useTimerStore } from '@/store/useTimerStore';
import { PHASE_ICONS, PHASE_LABELS } from '@/utils/phaseIcons';
import { formatMinutes } from '@/domain/utils/dateUtils';

export function RitualTimeline() {
  const snapshot = useTimerStore((state) => state.snapshot);
  const totalRituals = Math.max(1, snapshot.mode.pomodorosUntilLongBreak);
  const completedInCycle = snapshot.completedPomodoros % totalRituals;
  const isFocus = snapshot.phase === 'FOCUS';
  const accentColor = snapshot.mode.accentColor;
  const nextPhase = useMemo(() => {
    if (snapshot.phase === 'FOCUS') {
      const willLongBreak = (snapshot.completedPomodoros + 1) % totalRituals === 0;
      return willLongBreak ? 'LONG_BREAK' : 'SHORT_BREAK';
    }
    return 'FOCUS';
  }, [snapshot.phase, snapshot.completedPomodoros, totalRituals]);
  const NextIcon = PHASE_ICONS[nextPhase];
  const nextDurationSeconds = useMemo(() => {
    if (nextPhase === 'FOCUS') return snapshot.mode.focusDuration;
    if (nextPhase === 'SHORT_BREAK') return snapshot.mode.shortBreakDuration;
    return snapshot.mode.longBreakDuration;
  }, [nextPhase, snapshot.mode.focusDuration, snapshot.mode.shortBreakDuration, snapshot.mode.longBreakDuration]);

  const statusLabel = useMemo(() => {
    if (isFocus) {
      const current = Math.min(completedInCycle + 1, totalRituals);
      return `Ritual ${current} de ${totalRituals}`;
    }
    return PHASE_LABELS[snapshot.phase];
  }, [isFocus, completedInCycle, totalRituals, snapshot.phase]);

  return (
    <div className="parchment-panel rounded-xl px-3 sm:px-4 py-3 w-full max-w-[320px] sm:max-w-[340px]">
      <div className="flex items-center justify-between text-[11px] font-heading text-text-muted mb-2">
        <span className="uppercase tracking-[0.2em]">Ciclo</span>
        <span className="text-text-secondary">{statusLabel}</span>
      </div>
      <div className="flex items-center gap-2">
        {Array.from({ length: totalRituals }).map((_, index) => {
          const isCompleted = index < completedInCycle;
          const isActive = isFocus && index === completedInCycle;
          return (
            <div
              key={`ritual-${index}`}
              className="flex-1 h-2 rounded-full border border-border/50 bg-surface/60"
              style={
                isActive
                  ? {
                      backgroundColor: accentColor,
                      boxShadow: `0 0 12px ${accentColor}70`,
                      borderColor: `${accentColor}90`,
                    }
                  : isCompleted
                    ? {
                        backgroundColor: `${accentColor}80`,
                        borderColor: `${accentColor}60`,
                      }
                    : undefined
              }
            />
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] font-heading text-text-muted uppercase tracking-[0.2em]">
        <div className="flex items-center gap-2">
          <NextIcon size={12} className="text-text-muted" />
          <span>Próximo</span>
        </div>
        <span className="text-text-secondary">
          {PHASE_LABELS[nextPhase].replace(' ', '\u00A0')} · {formatMinutes(Math.round(nextDurationSeconds / 60))}
        </span>
      </div>
    </div>
  );
}
