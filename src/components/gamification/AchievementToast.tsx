import { useEffect } from 'react';
import type { Achievement } from '@/domain/scoring/achievements';
import { Trophy } from 'lucide-react';

interface AchievementToastProps {
  achievement: Achievement;
  show: boolean;
  onClose: () => void;
}

export function AchievementToast({ achievement, show, onClose }: AchievementToastProps) {
  useEffect(() => {
    if (show) {
      // Auto-fechar após 5 segundos
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed top-24 right-4 z-50 animate-slide-in-right">
      <div className="bg-warning/20 border-2 border-warning rounded-lg p-4 shadow-glow-warning backdrop-blur-sm min-w-[300px] max-w-[400px]">
        <div className="flex items-start gap-3">
          {/* Ícone do achievement */}
          <div className="text-4xl flex-shrink-0 animate-bounce">
            {achievement.icon}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={16} className="text-warning flex-shrink-0" />
              <span className="text-xs font-semibold text-warning uppercase tracking-wider">
                Achievement Desbloqueado!
              </span>
            </div>
            <h3 className="font-bold text-text text-lg mb-1 truncate">
              {achievement.name}
            </h3>
            <p className="text-text-secondary text-sm mb-2 line-clamp-2">
              {achievement.description}
            </p>
            <div className="text-warning font-bold text-sm">
              +{achievement.xp} XP
            </div>
          </div>

          {/* Botão fechar */}
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text transition-colors flex-shrink-0"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
