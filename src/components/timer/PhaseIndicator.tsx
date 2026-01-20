import { useTimerStore } from '@/store/useTimerStore';
import { Badge } from '@/components/shared/Badge';
import { PHASE_ICONS, PHASE_LABELS } from '@/utils/phaseIcons';

export function PhaseIndicator() {
  const snapshot = useTimerStore((state) => state.snapshot);
  const IconComponent = PHASE_ICONS[snapshot.phase];
  const label = PHASE_LABELS[snapshot.phase];
  const isRunning = snapshot.state === 'RUNNING';

  return (
    <Badge
      variant="primary"
      size="lg"
      glow={isRunning}
      pulse={isRunning}
      icon={<IconComponent size={20} />}
      className={`
        animate-parchment-unfold font-heading
        ${isRunning && 'forge-border-animated parchment-primary'}
      `}
      style={{
        borderColor: snapshot.mode.accentColor,
        color: snapshot.mode.accentColor,
        backgroundColor: `${snapshot.mode.accentColor}20`,
        boxShadow: isRunning
          ? `0 0 12px ${snapshot.mode.accentColor}60, 0 0 24px ${snapshot.mode.accentColor}30`
          : 'none',
      }}
    >
      {label}
    </Badge>
  );
}
