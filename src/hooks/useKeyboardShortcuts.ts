import { useEffect } from 'react';
import { useTimerStore } from '@/store/useTimerStore';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const { snapshot, start, pause, resume, reset, skip } = useTimerStore.getState();

      // Ignorar se usuário está digitando em input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (snapshot.state === 'IDLE' || snapshot.state === 'FINISHED') {
            start();
          } else if (snapshot.state === 'RUNNING') {
            pause();
          } else if (snapshot.state === 'PAUSED') {
            resume();
          }
          break;

        case 'KeyR':
          e.preventDefault();
          reset();
          break;

        case 'KeyS':
          e.preventDefault();
          skip();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
