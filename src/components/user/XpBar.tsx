import { useMemo } from 'react';
import { useStatsStore } from '@/store/useStatsStore';
import { calculateLevel, xpForNextLevel } from '@/domain/scoring/achievements';
import { getTitleForLevel } from '@/domain/user/titles';
import { useUserProfileStore } from '@/store/useUserProfileStore';
import { getAvatarById } from '@/domain/user/avatars';
import { Crown } from 'lucide-react';

interface XpBarProps {
  variant?: 'compact' | 'detailed' | 'header-card';
  showTitle?: boolean;
}

export function XpBar({ variant = 'compact', showTitle = false }: XpBarProps) {
  const { progress } = useStatsStore();
  const { profile } = useUserProfileStore();

  // Proteção contra dados não carregados
  const totalXp = progress?.totalXp ?? 0;

  const level = useMemo(() => calculateLevel(totalXp), [totalXp]);
  const title = useMemo(() => getTitleForLevel(level), [level]);
  const xpNeeded = useMemo(() => xpForNextLevel(totalXp), [totalXp]);
  const currentLevelXp = totalXp - (level - 1) * 100;
  const progressPercentage = (currentLevelXp / 100) * 100;
  const avatar = profile ? getAvatarById(profile.avatarId) : null;

  // Header card - novo design integrado para o header
  if (variant === 'header-card') {
    const profileName = profile?.username || 'Aventureiro';

    return (
      <div className="flex items-center gap-2.5 parchment-panel rounded-xl px-3 py-2 forge-border-primary">
        {/* Avatar */}
        {avatar && (
          <div
            className="parchment-ultra rounded-lg p-1.5 forge-border-accent shadow-torch-primary hover:shadow-torch-accent transition-all duration-300 cursor-pointer"
            title={avatar.name}
          >
            <span className="text-xl md:text-2xl">{avatar.emoji}</span>
          </div>
        )}

        {/* Info do usuario */}
        <div className="flex flex-col min-w-0">
          {/* Nome do perfil */}
          <span className="text-sm font-semibold text-text font-heading truncate max-w-[100px]">
            {profileName}
          </span>

          {/* Título com nível */}
          <div className="flex items-center gap-1.5">
            <Crown size={10} className="text-primary flex-shrink-0" />
            <span className="text-xs text-gilded-primary font-body">
              {title}
            </span>
            <span className="text-[10px] text-text-muted">•</span>
            <span className="text-[10px] text-text-secondary font-heading">
              Nv.{level}
            </span>
          </div>

          {/* XP Bar minimalista */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-text-muted font-mono">
              {currentLevelXp}/{100}
            </span>
            <div className="relative h-1.5 w-20 bg-iron/80 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-bronze rounded-full"
                style={{
                  width: `${progressPercentage}%`,
                  transition: 'width 800ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="hidden md:flex items-center gap-2 min-w-0">
        {showTitle && (
          <div className="hidden lg:flex items-center gap-2 text-sm font-heading font-medium text-text">
            <span className="text-primary">{title}</span>
            <span className="text-text-secondary">&#8226;</span>
            <span className="text-text-secondary">Nível {level}</span>
          </div>
        )}
        <div className="flex-1 min-w-0 max-w-xs">
          <div className="relative h-3 parchment-ultra rounded-full overflow-hidden forge-border-primary">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-bronze to-primary rounded-full"
              style={{
                width: `${progressPercentage}%`,
                boxShadow: 'inset 0 0 8px rgba(232, 220, 196, 0.2)',
                transition: 'width 800ms cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </div>
          <div className="text-xs text-text-secondary font-body mt-1 text-right">
            {currentLevelXp} / 100 XP
          </div>
        </div>
      </div>
    );
  }

  // Detailed variant (para Stats Page)
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-gilded-primary font-display">
            Nível {level} - {title}
          </div>
          <div className="text-sm text-text-secondary font-body">
            {totalXp.toLocaleString()} XP total
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-text font-heading">
            {currentLevelXp} / 100 XP
          </div>
          <div className="text-xs text-text-secondary font-body">
            {xpNeeded} XP para próximo nível
          </div>
        </div>
      </div>
      <div className="relative h-5 parchment-ultra rounded-full overflow-hidden forge-border-primary">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-bronze to-success rounded-full"
          style={{
            width: `${progressPercentage}%`,
            boxShadow: 'inset 0 0 12px rgba(232, 220, 196, 0.25)',
            transition: 'width 800ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-text drop-shadow-lg font-heading">
          {Math.floor(progressPercentage)}%
        </div>
      </div>
    </div>
  );
}
