import { Sparkles, Trophy, Scroll, Clock, X } from 'lucide-react';
import { useNotificationsStore, type NotificationKind } from '@/store/useNotificationsStore';

const KIND_LABELS: Record<NotificationKind, string> = {
  xp: 'Experiência',
  timer: 'Ritual',
  quest: 'Missão',
  achievement: 'Conquista desbloqueada',
};

const KIND_STYLES: Record<
  NotificationKind,
  {
    border: string;
    background: string;
    shadow: string;
    badge: string;
    label: string;
    iconWrap: string;
    iconColor: string;
  }
> = {
  xp: {
    border: 'forge-border-primary',
    background: 'parchment-primary',
    shadow: 'shadow-torch-primary',
    badge: 'bg-primary/15 text-primary border-primary/30',
    label: 'text-primary',
    iconWrap: 'parchment-primary forge-border-primary',
    iconColor: 'text-primary',
  },
  timer: {
    border: 'forge-border-accent',
    background: 'parchment-accent',
    shadow: 'shadow-torch-accent',
    badge: 'bg-accent/15 text-accent border-accent/30',
    label: 'text-accent',
    iconWrap: 'parchment-accent forge-border-accent',
    iconColor: 'text-accent',
  },
  quest: {
    border: 'forge-border-success',
    background: 'parchment-success',
    shadow: 'shadow-torch-success',
    badge: 'bg-success/15 text-success border-success/30',
    label: 'text-success',
    iconWrap: 'parchment-success forge-border-success',
    iconColor: 'text-success',
  },
  achievement: {
    border: 'forge-border-warning',
    background: 'parchment-warning',
    shadow: 'shadow-torch-warning',
    badge: 'bg-warning/15 text-warning border-warning/30',
    label: 'text-warning',
    iconWrap: 'parchment-warning forge-border-warning',
    iconColor: 'text-warning',
  },
};

const KIND_ICONS: Record<NotificationKind, typeof Sparkles> = {
  xp: Sparkles,
  timer: Clock,
  quest: Scroll,
  achievement: Trophy,
};

export function NotificationCenter() {
  const toasts = useNotificationsStore((state) => state.toasts);
  const dismissToast = useNotificationsStore((state) => state.dismissToast);
  const pauseToast = useNotificationsStore((state) => state.pauseToast);
  const resumeToast = useNotificationsStore((state) => state.resumeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-24 right-4 z-50 flex flex-col gap-3 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const styles = KIND_STYLES[toast.kind];
        const label = KIND_LABELS[toast.kind];
        const Icon = KIND_ICONS[toast.kind];
        const isXp = toast.kind === 'xp';
        const isAchievement = toast.kind === 'achievement';
        const showXp = typeof toast.xp === 'number' && toast.xp > 0;
        return (
          <div
            key={toast.id}
            className={`
              pointer-events-auto w-[300px] sm:w-[340px] rounded-xl p-3 pr-10
              ${styles.background} ${styles.border} ${styles.shadow}
              animate-slide-in-right relative overflow-hidden
            `}
            onMouseEnter={() => pauseToast(toast.id)}
            onMouseLeave={() => resumeToast(toast.id)}
            onFocus={() => pauseToast(toast.id)}
            onBlur={() => resumeToast(toast.id)}
          >
            <div className="flex items-start gap-3">
              <div
                className={`
                  w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0
                  ${styles.iconWrap} ${styles.iconColor}
                `}
              >
                {toast.icon ? (
                  <span className="text-xl animate-bounce-once">{toast.icon}</span>
                ) : (
                  <Icon size={20} className="animate-gold-breathe" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-[10px] font-heading uppercase tracking-[0.24em] ${styles.label}`}>
                    {label}
                  </p>
                  {showXp && (
                    <span
                      className={
                        isXp
                          ? 'text-base font-bold font-heading text-gilded-primary'
                          : `text-[11px] font-bold tracking-wide px-2 py-1 rounded-full border ${styles.badge} whitespace-nowrap`
                      }
                    >
                      +{toast.xp} XP
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-text font-heading leading-snug line-clamp-2">
                  {toast.title}
                </h3>
                {toast.description && (
                  <p className="text-xs text-text-secondary font-body mt-1 line-clamp-2">
                    {toast.description}
                  </p>
                )}
                {isAchievement && toast.detail && (
                  <p className="text-[11px] text-text-muted italic mt-2 line-clamp-2">
                    &ldquo;{toast.detail}&rdquo;
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="absolute top-2 right-2 text-text-muted hover:text-text transition-colors"
              aria-label="Fechar notificação"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
