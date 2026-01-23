import { create } from 'zustand';

export type NotificationKind = 'xp' | 'timer' | 'quest' | 'achievement';

export interface NotificationToast {
  id: string;
  kind: NotificationKind;
  title: string;
  description?: string;
  detail?: string;
  xp?: number;
  icon?: string;
  duration?: number;
}

interface NotificationsStore {
  toasts: NotificationToast[];
  pushToast: (toast: Omit<NotificationToast, 'id'> & { id?: string }) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

const MAX_TOASTS = 4;

const DEFAULT_DURATIONS: Record<NotificationKind, number> = {
  xp: 2400,
  timer: 4200,
  quest: 5200,
  achievement: 6500,
};

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const createToastId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const clearToastTimeout = (id: string) => {
  const timeout = toastTimeouts.get(id);
  if (timeout) {
    clearTimeout(timeout);
    toastTimeouts.delete(id);
  }
};

export const useNotificationsStore = create<NotificationsStore>((set) => ({
  toasts: [],

  pushToast: (toastInput) => {
    const id = toastInput.id ?? createToastId();
    const duration = toastInput.duration ?? DEFAULT_DURATIONS[toastInput.kind];
    const toast: NotificationToast = {
      ...toastInput,
      id,
      duration,
    };

    set((state) => {
      const nextToasts = [toast, ...state.toasts];
      const trimmed = nextToasts.slice(0, MAX_TOASTS);
      const removed = nextToasts.slice(MAX_TOASTS);
      removed.forEach((removedToast) => clearToastTimeout(removedToast.id));
      return { toasts: trimmed };
    });

    if (duration > 0) {
      clearToastTimeout(id);
      toastTimeouts.set(
        id,
        setTimeout(() => {
          set((state) => ({
            toasts: state.toasts.filter((item) => item.id !== id),
          }));
          clearToastTimeout(id);
        }, duration)
      );
    }

    return id;
  },

  dismissToast: (id) => {
    clearToastTimeout(id);
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearToasts: () => {
    toastTimeouts.forEach((_, id) => clearToastTimeout(id));
    set({ toasts: [] });
  },
}));
