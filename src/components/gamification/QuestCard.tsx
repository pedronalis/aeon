import type { DailyQuest, WeeklyQuest } from '@/domain/quests/Quest';
import { Card } from '@/components/shared/Card';
import { Check, Scroll } from 'lucide-react';

interface QuestCardProps {
  quest: DailyQuest | WeeklyQuest;
}

export function QuestCard({ quest }: QuestCardProps) {
  const progressPercentage = (quest.currentProgress / quest.target) * 100;
  const isCompleted = quest.completed;
  const remaining = Math.max(0, quest.target - quest.currentProgress);
  const nearComplete = !isCompleted && progressPercentage >= 70;
  const unit = getQuestUnit(quest.id);
  const remainingLabel = unit
    ? `Faltam ${remaining} ${remaining === 1 ? unit.singular : unit.plural}`
    : `Faltam ${remaining}`;

  return (
    <Card
      variant="parchment"
      className={`
        ${isCompleted
          ? 'forge-border-success'
          : 'forge-border-primary'
        }
        ${isCompleted ? 'hover:shadow-torch-success' : 'hover:shadow-torch-primary'}
        ${nearComplete ? 'shadow-torch-sm ring-1 ring-primary/20' : ''}
        hover-forge-lift
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icone container com parchment */}
        <div className={`
          flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
          ${isCompleted
            ? 'parchment-success forge-border-success'
            : 'parchment-primary forge-border-primary'
          }
        `}>
          {isCompleted ? (
            <Check size={24} className="animate-scale-in text-success" />
          ) : (
            <Scroll size={24} className="text-primary" />
          )}
        </div>

        {/* Conteudo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className={`
              font-bold text-lg truncate font-heading
              ${isCompleted ? 'text-gilded-success' : 'text-text'}
            `}>
              {quest.name}
            </h3>
            {isCompleted && (
              <span className="text-xs font-semibold text-success uppercase tracking-wider flex-shrink-0 animate-pulse font-heading">
                Completa
              </span>
            )}
          </div>

          <p className="text-text-secondary text-sm mb-3 font-body">
            {quest.description}
          </p>

          {/* Barra de progresso premium */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-body">
              <span className={isCompleted ? 'text-success' : 'text-text-secondary'}>
                {quest.currentProgress} / {quest.target}
              </span>
              <span className="font-semibold text-primary font-heading">
                +{quest.xpReward} XP
              </span>
            </div>
            <div className="relative h-3 parchment-ultra rounded-full overflow-hidden">
              <div
                className={`
                  absolute inset-y-0 left-0 transition-all duration-500 ease-out
                  ${isCompleted
                    ? 'bg-gradient-to-r from-success to-success/80'
                    : 'bg-gradient-to-r from-primary to-bronze'
                  }
                `}
                style={{
                  width: `${Math.min(progressPercentage, 100)}%`,
                  boxShadow: 'inset 0 0 10px rgba(232, 220, 196, 0.2)'
                }}
              />
            </div>
            {!isCompleted && (
              <div className="flex items-center justify-between text-[11px] font-body text-text-muted">
                <span>{remainingLabel}</span>
                {nearComplete && (
                  <span className="text-primary font-heading uppercase tracking-[0.2em]">
                    Quase selada
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function getQuestUnit(questId: string): { singular: string; plural: string } | null {
  if (questId.includes('minutes')) {
    return { singular: 'minuto', plural: 'minutos' };
  }
  if (questId.includes('focuses')) {
    return { singular: 'ritual', plural: 'rituais' };
  }
  if (questId.includes('perfect_week')) {
    return { singular: 'dia', plural: 'dias' };
  }
  if (questId.includes('early_bird') || questId.includes('daily_10')) {
    return { singular: 'ritual', plural: 'rituais' };
  }
  return null;
}
