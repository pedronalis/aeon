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
  pauseToast: (id: string) => void;
  resumeToast: (id: string) => void;
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
const toastStartTimes = new Map<string, number>();
const toastRemaining = new Map<string, number>();

const createToastId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const stopToastTimeout = (id: string) => {
  const timeout = toastTimeouts.get(id);
  if (timeout) {
    clearTimeout(timeout);
    toastTimeouts.delete(id);
  }
};

const clearToastTimeout = (id: string) => {
  stopToastTimeout(id);
  toastStartTimes.delete(id);
  toastRemaining.delete(id);
};

const startToastTimeout = (
  id: string,
  duration: number,
  set: (partial: (state: NotificationsStore) => Partial<NotificationsStore>) => void
) => {
  stopToastTimeout(id);
  if (duration <= 0) return;
  toastStartTimes.set(id, Date.now());
  toastRemaining.set(id, duration);
  toastTimeouts.set(
    id,
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((item) => item.id !== id),
      }));
      clearToastTimeout(id);
    }, duration)
  );
};

const computeDuration = (toastInput: Omit<NotificationToast, 'id'>) => {
  if (typeof toastInput.duration === 'number') {
    return toastInput.duration;
  }
  const base = DEFAULT_DURATIONS[toastInput.kind];
  if (toastInput.kind === 'xp') {
    return base;
  }
  const contentLength =
    (toastInput.title?.length ?? 0) +
    (toastInput.description?.length ?? 0) +
    (toastInput.detail?.length ?? 0);
  const extra = Math.min(2400, Math.floor(contentLength / 80) * 800);
  return base + extra;
};

export const useNotificationsStore = create<NotificationsStore>((set) => ({
  toasts: [],

  pushToast: (toastInput) => {
    const id = toastInput.id ?? createToastId();
    const duration = computeDuration(toastInput);
    const toast: NotificationToast = {
      ...toastInput,
      id,
      duration,
    };

    let mergedToastId: string | null = null;
    set((state) => {
      if (toast.kind === 'xp') {
        const candidateIndex = state.toasts.findIndex(
          (item) => item.kind === 'xp' && item.title === toast.title && item.description === toast.description
        );
        if (candidateIndex === 0) {
          const current = state.toasts[0];
          const merged = {
            ...current,
            xp: (current.xp ?? 0) + (toast.xp ?? 0),
            duration,
          };
          mergedToastId = current.id;
          return { toasts: [merged, ...state.toasts.slice(1)] };
        }
      }

      const nextToasts = [toast, ...state.toasts];
      const trimmed = nextToasts.slice(0, MAX_TOASTS);
      const removed = nextToasts.slice(MAX_TOASTS);
      removed.forEach((removedToast) => clearToastTimeout(removedToast.id));
      return { toasts: trimmed };
    });

    if (mergedToastId) {
      clearToastTimeout(mergedToastId);
      startToastTimeout(mergedToastId, duration, set);
      return mergedToastId;
    }

    clearToastTimeout(id);
    startToastTimeout(id, duration, set);

    return id;
  },

  dismissToast: (id) => {
    clearToastTimeout(id);
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  pauseToast: (id) => {
    const startTime = toastStartTimes.get(id);
    const remaining = toastRemaining.get(id);
    if (!startTime || remaining === undefined) return;
    const elapsed = Date.now() - startTime;
    const nextRemaining = Math.max(0, remaining - elapsed);
    toastRemaining.set(id, nextRemaining);
    stopToastTimeout(id);
  },

  resumeToast: (id) => {
    const remaining = toastRemaining.get(id);
    if (remaining === undefined) return;
    if (remaining <= 0) {
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      }));
      clearToastTimeout(id);
      return;
    }
    startToastTimeout(id, remaining, set);
  },

  clearToasts: () => {
    toastTimeouts.forEach((_, id) => clearToastTimeout(id));
    set({ toasts: [] });
  },
}));
