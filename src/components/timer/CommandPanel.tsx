import { Play, Pause, SkipForward, RotateCcw, Plus, Minus, Keyboard } from 'lucide-react';
import { useTimerStore } from '@/store/useTimerStore';
import { Button } from '@/components/shared/Button';
import { PHASE_ICONS, PHASE_LABELS } from '@/utils/phaseIcons';
import { formatTime } from '@/domain/utils/dateUtils';

export function CommandPanel() {
  const { snapshot, start, pause, resume, skip, reset, addMinute, subtractMinute } =
    useTimerStore();

  const isRunning = snapshot.state === 'RUNNING';
  const isPaused = snapshot.state === 'PAUSED';
  const isIdle = snapshot.state === 'IDLE';
  const isFinished = snapshot.state === 'FINISHED';
  const finishedLabel = snapshot.phase === 'FOCUS' ? 'Iniciar Foco' : 'Iniciar Pausa';
  const PhaseIcon = PHASE_ICONS[snapshot.phase];
  const phaseLabel = PHASE_LABELS[snapshot.phase];
  const stateLabelMap = {
    IDLE: 'Preparar',
    RUNNING: 'Em ritual',
    PAUSED: 'Em pausa',
    FINISHED: 'Concluído',
  } as const;
  const stateDotMap = {
    IDLE: 'bg-text-muted',
    RUNNING: 'bg-success',
    PAUSED: 'bg-warning',
    FINISHED: 'bg-primary',
  } as const;
  const statePillMap = {
    IDLE: 'border-border/60 text-text-muted bg-surface/40',
    RUNNING: 'border-success/30 text-success bg-success/10',
    PAUSED: 'border-warning/30 text-warning bg-warning/10',
    FINISHED: 'border-primary/30 text-primary bg-primary/10',
  } as const;
  const stateLabel = stateLabelMap[snapshot.state];
  const statePill = statePillMap[snapshot.state];
  const stateDot = stateDotMap[snapshot.state];
  const adjustHint = isRunning ? 'Trancado durante ritual' : 'Disponível antes do ritual';
  const actionHintMap = {
    IDLE: 'Escolha um ritual e acenda a chama.',
    RUNNING: 'Ritual em curso — mantenha o foco.',
    PAUSED: 'Respire, então retome quando estiver pronto.',
    FINISHED: 'Ritual concluído — escolha o próximo passo.',
  } as const;
  const actionHint = actionHintMap[snapshot.state];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-base font-display text-primary mb-1">Painel de Comando</h2>
        <p className="text-text-muted text-xs font-body">Rege o tempo e a chama do ritual</p>
      </div>

      {/* Status Seal */}
      <div className="parchment-panel rounded-lg p-4 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="parchment-primary p-2 rounded-lg">
              <PhaseIcon size={14} className="text-primary" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-heading">
                Fase atual
              </p>
              <p className="text-sm font-heading text-text-secondary">{phaseLabel}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-heading">
              Estado
            </p>
            <div
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] uppercase tracking-[0.2em] font-heading ${statePill}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${stateDot}`} />
              {stateLabel}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-text-muted font-body">
          <span>Tempo restante</span>
          <span className="font-mono text-text">{formatTime(snapshot.remainingSeconds)}</span>
        </div>
      </div>

      {/* Main Action */}
      <div className="mb-5">
        {isIdle && (
          <Button
            onClick={start}
            variant="royal"
            icon={<Play size={18} />}
            aria-label="Iniciar timer"
            className="w-full justify-center"
          >
            Iniciar Sessão
          </Button>
        )}

        {isFinished && (
          <Button
            onClick={start}
            variant="royal"
            icon={<Play size={18} />}
            aria-label={finishedLabel}
            className="w-full justify-center"
          >
            {finishedLabel}
          </Button>
        )}

        {isRunning && (
          <Button
            onClick={pause}
            variant="royal"
            icon={<Pause size={18} />}
            aria-label="Pausar timer"
            className="w-full justify-center"
          >
            Pausar
          </Button>
        )}

        {isPaused && (
          <Button
            onClick={resume}
            variant="royal"
            icon={<Play size={18} />}
            aria-label="Retomar timer"
            className="w-full justify-center"
          >
            Retomar
          </Button>
        )}
        <p className="text-[11px] text-text-muted font-body text-center mt-2">
          {actionHint}
        </p>
      </div>

      {/* Secondary Actions */}
      <div className="parchment-panel rounded-lg p-3 mb-5">
        <p className="text-text-muted text-[10px] uppercase tracking-[0.2em] font-heading mb-2 text-center">
          Ações rápidas
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={skip}
            variant="parchment"
            size="sm"
            icon={<SkipForward size={14} />}
            disabled={isIdle}
            aria-label="Pular fase"
            className="justify-center"
          >
            Pular
          </Button>

          <Button
            onClick={reset}
            variant="iron"
            size="sm"
            icon={<RotateCcw size={14} />}
            disabled={isIdle}
            aria-label="Resetar timer"
            className="justify-center"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Time Adjustment */}
      <div className="parchment-panel rounded-lg p-4 mb-6">
        <div className="flex items-center justify-center mb-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-heading">
            {adjustHint}
          </span>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={subtractMinute}
            variant="parchment"
            size="sm"
            icon={<Minus size={16} />}
            disabled={isRunning}
            aria-label="Remover 1 minuto"
            rounded
          />
          <span className="text-text font-mono text-base min-w-[3.5rem] text-center">
            {Math.floor(snapshot.remainingSeconds / 60)}min
          </span>
          <Button
            onClick={addMinute}
            variant="parchment"
            size="sm"
            icon={<Plus size={16} />}
            disabled={isRunning}
            aria-label="Adicionar 1 minuto"
            rounded
          />
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Keyboard Shortcuts */}
      <div className="parchment-panel rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Keyboard size={12} className="text-text-muted" />
            <p className="text-text-muted text-xs font-heading">Atalhos</p>
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-heading">
            Teclado
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-md border border-border/60 px-2 py-1.5">
            <kbd className="px-1.5 py-0.5 parchment-primary rounded text-primary font-mono text-xs">
              Space
            </kbd>
            <span className="text-text-secondary text-xs">iniciar/pausar</span>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border/60 px-2 py-1.5">
            <kbd className="px-1.5 py-0.5 parchment-primary rounded text-primary font-mono text-xs">
              +
            </kbd>
            <span className="text-text-secondary text-xs">adicionar 1 min</span>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border/60 px-2 py-1.5">
            <kbd className="px-1.5 py-0.5 parchment-primary rounded text-primary font-mono text-xs">
              -
            </kbd>
            <span className="text-text-secondary text-xs">remover 1 min</span>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border/60 px-2 py-1.5">
            <kbd className="px-1.5 py-0.5 parchment-primary rounded text-primary font-mono text-xs">
              R
            </kbd>
            <span className="text-text-secondary text-xs">resetar</span>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border/60 px-2 py-1.5">
            <kbd className="px-1.5 py-0.5 parchment-primary rounded text-primary font-mono text-xs">
              S
            </kbd>
            <span className="text-text-secondary text-xs">pular fase</span>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border/60 px-2 py-1.5">
            <kbd className="px-1.5 py-0.5 parchment-primary rounded text-primary font-mono text-xs">
              M
            </kbd>
            <span className="text-text-secondary text-xs">mutar som</span>
          </div>
        </div>
      </div>
    </div>
  );
}
