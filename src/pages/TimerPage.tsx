import { useEffect, useMemo } from 'react';
import { useTimerStore } from '@/store/useTimerStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { TimerDisplay } from '@/components/timer/TimerDisplay';
import { CommandPanel } from '@/components/timer/CommandPanel';
import { ActiveTaskPanel } from '@/components/tasks/ActiveTaskPanel';
import { Select } from '@/components/shared/Select';
import { getModeIcon } from '@/utils/modeIcons';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { SelectOption } from '@/components/shared/Select';

export function TimerPage() {
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

  const selectOptions: SelectOption[] = useMemo(() => {
    return modes.map((mode) => ({
      value: mode.id,
      label: mode.name,
      icon: getModeIcon(mode.id, 20),
      color: mode.accentColor,
    }));
  }, [modes]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">

        {/* Left: Timer Hero */}
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center
                        parchment-ultra rounded-2xl p-6 sm:p-8 lg:p-10
                        forge-border-primary shadow-torch-primary animate-slide-in-up">
          <div className="w-full max-w-[380px] mb-4">
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

          {snapshot.mode.disclaimer && (
            <p className="text-text-muted text-xs text-center opacity-60 animate-fade-in font-body mb-2">
              {snapshot.mode.disclaimer}
            </p>
          )}

          <div className="flex-1 flex items-center justify-center w-full">
            <TimerDisplay />
          </div>
        </div>

        {/* Right: Controls + Active Task */}
        <div className="w-full lg:w-[340px] xl:w-[380px] flex flex-col gap-6">
          <div className="parchment-ultra rounded-2xl p-6 forge-border-primary shadow-elevation-2 animate-slide-in-up">
            <CommandPanel />
          </div>
          <div className="flex-1 parchment-ultra rounded-2xl p-6 forge-border-primary shadow-elevation-2 animate-slide-in-up">
            <ActiveTaskPanel />
          </div>
        </div>

      </div>
    </div>
  );
}
