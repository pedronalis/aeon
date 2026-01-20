import { Play, Pause, SkipForward, RotateCcw, Plus, Minus } from 'lucide-react';
import { useTimerStore } from '@/store/useTimerStore';
import { Button } from '@/components/shared/Button';

export function TimerControls() {
  const { snapshot, start, pause, resume, skip, reset, addMinute, subtractMinute } =
    useTimerStore();

  const isRunning = snapshot.state === 'RUNNING';
  const isPaused = snapshot.state === 'PAUSED';
  const isIdle = snapshot.state === 'IDLE';
  const isFinished = snapshot.state === 'FINISHED';
  const finishedLabel = snapshot.phase === 'FOCUS' ? 'Iniciar Foco' : 'Iniciar Pausa';

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Main control em container premium */}
      <div className="parchment-ultra rounded-2xl p-6 forge-border-primary">
        <div className="flex gap-4">
          {isIdle && (
            <Button
              onClick={start}
              variant="royal"
              size="lg"
              icon={<Play size={24} />}
              aria-label="Iniciar timer"
            >
              Iniciar
            </Button>
          )}

          {isFinished && (
            <Button
              onClick={start}
              variant="royal"
              size="lg"
              icon={<Play size={24} />}
              aria-label={finishedLabel}
            >
              {finishedLabel}
            </Button>
          )}

          {isRunning && (
            <Button
              onClick={pause}
              variant="royal"
              size="lg"
              icon={<Pause size={24} />}
              aria-label="Pausar timer"
            >
              Pausar
            </Button>
          )}

          {isPaused && (
            <Button
              onClick={resume}
              variant="royal"
              size="lg"
              icon={<Play size={24} />}
              aria-label="Retomar timer"
            >
              Retomar
            </Button>
          )}
        </div>
      </div>

      {/* Secondary controls agrupados em parchment panel */}
      <div className="parchment-panel rounded-xl p-4 flex gap-4">
        <Button
          onClick={skip}
          variant="iron"
          icon={<SkipForward size={18} />}
          disabled={isIdle}
          aria-label="Pular fase"
        >
          Pular
        </Button>

        <Button
          onClick={reset}
          variant="iron"
          icon={<RotateCcw size={18} />}
          disabled={isIdle}
          aria-label="Resetar timer"
        >
          Reset
        </Button>
      </div>

      {/* Time adjustment em parchment card */}
      <div className="parchment-card rounded-full px-4 py-2 flex gap-2 items-center">
        <Button
          onClick={subtractMinute}
          variant="parchment"
          size="sm"
          icon={<Minus size={18} />}
          disabled={isRunning}
          aria-label="Remover 1 minuto"
          title="Remover 1 minuto"
          rounded
        />

        <span className="px-4 py-2 text-text-secondary text-sm font-heading">
          Ajustar tempo
        </span>

        <Button
          onClick={addMinute}
          variant="parchment"
          size="sm"
          icon={<Plus size={18} />}
          disabled={isRunning}
          aria-label="Adicionar 1 minuto"
          title="Adicionar 1 minuto"
          rounded
        />
      </div>
    </div>
  );
}
