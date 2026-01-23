import { useEffect, useMemo } from 'react';
import { useTimerStore } from '@/store/useTimerStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { TimerDisplay } from '@/components/timer/TimerDisplay';
import { CommandPanel } from '@/components/timer/CommandPanel';
import { ActiveTaskPanel } from '@/components/tasks/ActiveTaskPanel';
import { Container } from '@/components/shared/Container';
import { Select } from '@/components/shared/Select';
import { getModeIcon } from '@/utils/modeIcons';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { SelectOption } from '@/components/shared/Select';

export function TimerPage() {
  const snapshot = useTimerStore((state) => state.snapshot);
  const setMode = useTimerStore((state) => state.setMode);
  const { modes, settings } = useSettingsStore();

  useKeyboardShortcuts();

  // Carregar modo ativo ao montar
  useEffect(() => {
    const activeMode = modes.find((m) => m.id === settings.activeMode);
    if (activeMode && activeMode.id !== snapshot.mode.id) {
      setMode(activeMode);
    }
  }, [settings.activeMode, modes]);

  // Preparar opcoes do select com icones - usa accentColor do próprio modo
  const selectOptions: SelectOption[] = useMemo(() => {
    return modes.map((mode) => ({
      value: mode.id,
      label: mode.name,
      icon: getModeIcon(mode.id, 20),
      color: mode.accentColor,
    }));
  }, [modes]);

  return (
    <Container maxWidth="2xl" className="animate-fade-in">

      {/* Command Center Layout - Three Column */}
      <div className="flex items-center justify-center py-2">
        <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr,300px] xl:grid-cols-[minmax(440px,580px),minmax(320px,360px),minmax(320px,360px)] gap-4 lg:gap-5 xl:gap-6">

          {/* Left Panel - Timer Hero */}
          <div
            className="parchment-ultra rounded-xl p-4 sm:p-5 lg:p-6 forge-border-primary shadow-torch-primary order-1 lg:order-1 animate-slide-in-up"
            style={{ animationDelay: '40ms' }}
          >
            <div className="flex flex-col h-full min-h-[320px] sm:min-h-[360px] lg:min-h-[400px]">
              {/* Header: Mode Selector - Centered */}
              <div className="flex justify-center mb-3 lg:mb-4">
                <div className="w-full max-w-[320px] min-w-[240px] sm:min-w-[280px]">
                  <Select
                    value={snapshot.mode.id}
                    options={selectOptions}
                    onChange={(value) => {
                      const mode = modes.find((m) => m.id === value);
                      if (mode) {
                        setMode(mode);
                        useSettingsStore.getState().updateSettings({ activeMode: mode.id });
                      }
                    }}
                    disabled={snapshot.state === 'RUNNING'}
                    placeholder="Escolha seu Ritual"
                  />
                </div>
              </div>

              {/* Disclaimer - Compacto */}
              {snapshot.mode.disclaimer && (
                <p className="text-text-secondary text-xs text-center opacity-75 animate-fade-in font-body mb-0">
                  {snapshot.mode.disclaimer}
                </p>
              )}

              {/* Timer Display - Centered Hero */}
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <TimerDisplay />
              </div>
            </div>
          </div>

          {/* Center Panel - Command Panel */}
          <div
            className="parchment-ultra rounded-xl p-4 sm:p-5 lg:p-6 forge-border-primary shadow-elevation-2 order-2 lg:order-2 animate-slide-in-up"
            style={{ animationDelay: '120ms' }}
          >
            <CommandPanel />
          </div>

          {/* Right Panel - Active Task Panel */}
          <div
            className="parchment-ultra rounded-xl p-4 sm:p-5 lg:p-6 forge-border-primary shadow-elevation-2 order-3 lg:col-span-2 xl:col-span-1 xl:order-3 animate-slide-in-up"
            style={{ animationDelay: '200ms' }}
          >
            <ActiveTaskPanel />
          </div>

        </div>
      </div>
    </Container>
  );
}
