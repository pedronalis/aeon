import { useState, useEffect } from 'react';
import { useTimerStore } from '@/store/useTimerStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { TimerDisplay } from '@/components/timer/TimerDisplay';
import { CommandPanel } from '@/components/timer/CommandPanel';
import { ActiveTaskPanel } from '@/components/tasks/ActiveTaskPanel';
import { Surface } from '@/shared/ui/Surface';
import { getModeIcon } from '@/utils/modeIcons';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { SlidersHorizontal, ChevronUp, X } from 'lucide-react';

export function TimerPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const snapshot = useTimerStore((state) => state.snapshot);
  const setMode = useTimerStore((state) => state.setMode);
  const { modes, settings } = useSettingsStore();

  useKeyboardShortcuts();

  useEffect(() => {
    const activeMode = modes.find((m) => m.id === settings.activeMode);
    if (activeMode && activeMode.id !== snapshot.mode.id) {
      setMode(activeMode);
    }
  }, [settings.activeMode, modes]);

  const handleModeChange = (modeId: string) => {
    const mode = modes.find((m) => m.id === modeId);
    if (mode) {
      setMode(mode);
      useSettingsStore.getState().updateSettings({ activeMode: mode.id });
    }
  };

  const isRunning = snapshot.state === 'RUNNING';

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      {/* Ambient glow based on current mode */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${snapshot.mode.accentColor}10 0%, transparent 55%)`,
        }}
      />

      {/* Mode selector - topo */}
      <div className="relative z-10 flex-shrink-0 pt-4 md:pt-6 px-4 md:px-8">
        <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
          {modes.map((mode) => {
            const isActive = mode.id === snapshot.mode.id;
            const icon = getModeIcon(mode.id, isActive ? 20 : 18);
            return (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                disabled={isRunning}
                className={`
                  flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl
                  font-heading text-sm transition-all duration-300 border-2
                  ${isActive ? 'shadow-torch-sm' : 'border-transparent opacity-50 hover:opacity-90 text-text-secondary'}
                  ${isRunning ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}
                style={{
                  borderColor: isActive ? mode.accentColor : 'transparent',
                  backgroundColor: isActive ? `${mode.accentColor}14` : 'transparent',
                  color: isActive ? mode.accentColor : undefined,
                }}
              >
                {icon}
                <span className="hidden sm:inline">{mode.name}</span>
              </button>
            );
          })}
        </div>
        {snapshot.mode.disclaimer && (
          <p className="text-text-muted text-[11px] text-center opacity-50 mt-1.5 font-body animate-fade-in">
            {snapshot.mode.disclaimer}
          </p>
        )}
      </div>

      {/* Timer Hero - scrollable area para evitar overflow */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start pt-4 sm:pt-6 pb-4 overflow-y-auto overflow-x-hidden">
        <TimerDisplay />
      </div>

      {/* Bottom bar - sempre visível */}
      <div className="relative z-10 flex-shrink-0 pb-4 md:pb-6 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-text-muted text-[11px] font-heading uppercase tracking-[0.2em] opacity-70">
          <span>
            {snapshot.completedPomodoros === 0
              ? 'Nenhum ritual selado'
              : `${snapshot.completedPomodoros} ritual${snapshot.completedPomodoros === 1 ? '' : 'is'} selado${snapshot.completedPomodoros === 1 ? '' : 's'}`}
          </span>
        </div>

        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2.5 px-6 py-2.5 rounded-full parchment-ultra border border-border/40 text-text-secondary hover:text-text hover:border-primary/40 hover:shadow-elevation-2 transition-all duration-300 font-heading text-sm"
        >
          <SlidersHorizontal size={15} />
          <span>Painel de Ritual</span>
          <ChevronUp size={14} />
        </button>
      </div>

      {/* Mobile overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Controls Drawer */}
      <aside
        className={
          drawerOpen
            ? 'fixed z-50 bg-background-lighter border-primary/10 shadow-elevation-3 overflow-y-auto transition-transform duration-300 ease-out bottom-0 left-0 right-0 rounded-t-3xl h-[85vh] translate-y-0 md:bottom-0 md:left-auto md:right-0 md:top-0 md:h-full md:w-[400px] md:rounded-none md:border-l md:translate-y-0 md:translate-x-0'
            : 'fixed z-50 bg-background-lighter border-primary/10 shadow-elevation-3 overflow-y-auto transition-transform duration-300 ease-out bottom-0 left-0 right-0 rounded-t-3xl h-[85vh] translate-y-full md:bottom-0 md:left-auto md:right-0 md:top-0 md:h-full md:w-[400px] md:rounded-none md:border-l md:translate-y-0 md:translate-x-full'
        }
      >
        <div className="sticky top-0 z-10 bg-background-lighter/95 backdrop-blur-sm border-b border-primary/10 px-5 py-3 flex items-center justify-between">
          <h2 className="font-display text-primary text-base">Painel de Ritual</h2>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface transition-colors"
            aria-label="Fechar painel"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <Surface variant="elevated" padding="lg" rounded="2xl">
            <CommandPanel />
          </Surface>
          <Surface variant="elevated" padding="lg" rounded="2xl">
            <ActiveTaskPanel />
          </Surface>
        </div>
      </aside>
    </div>
  );
}
