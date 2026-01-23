import { useEffect } from 'react';
import { useTimerStore } from '@/store/useTimerStore';
import { useSettingsStore } from '@/store/useSettingsStore';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tagName = target.tagName;
      if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
        return true;
      }
      if (target.isContentEditable) return true;
      if (target.closest('[contenteditable="true"]')) return true;
      return target.getAttribute('role') === 'textbox';
    };

    const handler = (e: KeyboardEvent) => {
      const { snapshot, start, pause, resume, reset, skip, addMinute, subtractMinute } = useTimerStore.getState();

      // Ignorar se usuário está digitando em input/textarea
      if (isEditableTarget(e.target)) {
        return;
      }

      const code = e.code || '';
      const keyValue = e.key || '';
      const keyLower = keyValue.toLowerCase();
      const isAddChar = keyValue === '+' || keyValue === '=';
      const isSubtractChar = keyValue === '-' || keyValue === '_';
      const isSpace = code === 'Space' || keyLower === ' ' || keyLower === 'spacebar' || keyLower === 'space';
      const isReset = code === 'KeyR' || keyLower === 'r';
      const isSkip = code === 'KeyS' || keyLower === 's';
      const isAddMinute =
        isAddChar ||
        code === 'NumpadAdd' ||
        code === 'Equal' ||
        code === 'BracketRight' ||
        code === 'IntlRo' ||
        keyLower === '+' ||
        keyLower === '=' ||
        keyLower === 'add' ||
        keyLower === 'plus';
      const isSubtractMinute =
        isSubtractChar ||
        code === 'NumpadSubtract' ||
        code === 'Minus' ||
        code === 'BracketLeft' ||
        code === 'IntlBackslash' ||
        keyLower === '-' ||
        keyLower === '_' ||
        keyLower === 'subtract' ||
        keyLower === 'minus';
      const isToggleSound = code === 'KeyM' || keyLower === 'm';

      if (e.repeat) {
        return;
      }

      const hasModifier = e.metaKey || e.ctrlKey || e.altKey;
      const isAltGraph = e.ctrlKey && e.altKey;
      if (hasModifier && !(isAltGraph && (isAddMinute || isSubtractMinute))) {
        return;
      }

      if (isSpace) {
        e.preventDefault();
        if (snapshot.state === 'IDLE' || snapshot.state === 'FINISHED') {
          start();
        } else if (snapshot.state === 'RUNNING') {
          pause();
        } else if (snapshot.state === 'PAUSED') {
          resume();
        }
        return;
      }

      if (isReset) {
        e.preventDefault();
        reset();
        return;
      }

      if (isSkip) {
        e.preventDefault();
        skip();
        return;
      }

      if (isAddMinute && snapshot.state !== 'RUNNING') {
        e.preventDefault();
        addMinute();
        return;
      }

      if (isSubtractMinute && snapshot.state !== 'RUNNING') {
        e.preventDefault();
        subtractMinute();
        return;
      }

      if (isToggleSound) {
        e.preventDefault();
        const { settings, updateSettings } = useSettingsStore.getState();
        void updateSettings({ soundEnabled: !settings.soundEnabled });
      }
    };

    const listenerOptions = { capture: true } as const;
    document.addEventListener('keydown', handler, listenerOptions);
    return () => document.removeEventListener('keydown', handler, listenerOptions);
  }, []);
}
