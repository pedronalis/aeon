import { Play, Pause, SkipForward, RotateCcw, Plus, Minus, Keyboard } from 'lucide-react';
import { useTimerStore } from '@/store/useTimerStore';
import { Button } from '@/components/shared/Button';

export function CommandPanel() {
  const { snapshot, start, pause, resume, skip, reset, addMinute, subtractMinute } =
    useTimerStore();

  const isRunning = snapshot.state === 'RUNNING';
  const isPaused = snapshot.state === 'PAUSED';
  const isIdle = snapshot.state === 'IDLE';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-base font-display text-primary mb-0.5">Painel de Comando</h2>
        <p className="text-text-muted text-xs font-body">Controle sua sessão</p>
      </div>

      {/* Main Action */}
      <div className="mb-6">
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
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <Button
          onClick={skip}
          variant="iron"
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

      {/* Time Adjustment */}
      <div className="parchment-panel rounded-lg p-4 mb-6">
        <p className="text-text-muted text-xs font-heading mb-2 text-center">Ajustar Tempo</p>
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
        <div className="flex items-center gap-2 mb-2">
          <Keyboard size={12} className="text-text-muted" />
          <p className="text-text-muted text-xs font-heading">Atalhos</p>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <kbd className="px-1.5 py-0.5 parchment-primary rounded text-primary font-mono text-xs">
              Space
            </kbd>
            <span className="text-text-secondary text-xs">iniciar/pausar</span>
          </div>
          <div className="flex items-center justify-between">
            <kbd className="px-1.5 py-0.5 parchment-primary rounded text-primary font-mono text-xs">
              R
            </kbd>
            <span className="text-text-secondary text-xs">resetar</span>
          </div>
          <div className="flex items-center justify-between">
            <kbd className="px-1.5 py-0.5 parchment-primary rounded text-primary font-mono text-xs">
              S
            </kbd>
            <span className="text-text-secondary text-xs">pular fase</span>
          </div>
        </div>
      </div>
    </div>
  );
}
