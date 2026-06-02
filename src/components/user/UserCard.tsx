import { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useStatsStore } from '@/store/useStatsStore';
import { useUserProfileStore } from '@/store/useUserProfileStore';
import { useTimerStore } from '@/store/useTimerStore';
import { calculateLevel } from '@/domain/scoring/achievements';
import { getTitleForLevel } from '@/domain/user/titles';
import { getAvatarById } from '@/domain/user/avatars';
import { Crown, LogOut, Flame } from 'lucide-react';

export function UserCard() {
  const { email, signOut } = useAuthStore();
  const { progress } = useStatsStore();
  const { profile } = useUserProfileStore();
  const { snapshot } = useTimerStore();
  const [open, setOpen] = useState(false);

  const totalXp = progress?.totalXp ?? 0;
  const level = useMemo(() => calculateLevel(totalXp), [totalXp]);
  const title = useMemo(() => getTitleForLevel(level), [level]);
  const currentLevelXp = totalXp - (level - 1) * 100;
  const progressPercentage = Math.min((currentLevelXp / 100) * 100, 100);
  const avatar = profile ? getAvatarById(profile.avatarId) : null;
  const profileName = profile?.username || 'Aventureiro';
  const isRunning = snapshot?.state === 'RUNNING';
  const streak = progress?.currentStreak ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`
          w-full flex flex-col items-center gap-2.5 px-4 py-4 rounded-2xl
          parchment-panel forge-border-primary
          transition-all duration-300 ease-out
          hover:shadow-torch-sm hover:border-primary/30
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
          ${isRunning ? 'animate-torch-flicker border-primary/40 shadow-torch-sm' : ''}
        `}
        title="Perfil do Herói"
      >
        {/* Avatar */}
        <div className="relative">
          <div
            className={`
              parchment-ultra rounded-2xl p-2.5 forge-border-accent
              transition-all duration-300
              ${isRunning ? 'shadow-torch-primary' : 'shadow-torch-sm'}
            `}
          >
            <span className="text-3xl leading-none">{avatar?.emoji ?? '⚔️'}</span>
          </div>
          {isRunning && (
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary shadow-torch-primary animate-pulse" />
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col items-center gap-1 min-w-0 w-full">
          {/* Nome */}
          <span className="text-sm font-semibold text-text font-heading truncate max-w-full">
            {profileName}
          </span>

          {/* Título + Nível */}
          <div className="flex items-center gap-1.5">
            <Crown size={10} className="text-primary flex-shrink-0" />
            <span className="text-xs text-gilded-primary font-body">{title}</span>
            <span className="text-[10px] text-text-muted">•</span>
            <span className="text-[10px] text-text-secondary font-heading">Nv.{level}</span>
          </div>

          {/* XP Bar minimal */}
          <div className="w-full flex items-center gap-2 mt-1.5">
            <div className="relative flex-1 h-1.5 bg-iron/80 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-bronze rounded-full"
                style={{
                  width: `${progressPercentage}%`,
                  transition: 'width 800ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            </div>
            <span className="text-[10px] text-text-muted font-mono tabular-nums">
              {currentLevelXp}/100
            </span>
          </div>

          {/* Streak badge */}
          {streak > 0 && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-primary font-heading">
              <Flame size={10} className="text-primary" />
              <span>Streak {streak}d</span>
            </div>
          )}
        </div>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 bottom-full mb-2 w-full parchment-panel rounded-xl forge-border-primary shadow-elevation-2 z-50 py-2">
            <div className="px-4 py-2 border-b border-primary/10">
              <p className="text-xs text-text-muted font-body">Logado como</p>
              <p className="text-sm font-heading text-text truncate">{email}</p>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-error/10 font-heading transition-colors"
            >
              <LogOut size={16} />
              Sair do Reino
            </button>
          </div>
        </>
      )}
    </div>
  );
}
