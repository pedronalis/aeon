import { useEffect } from 'react';
import { useQuestsStore } from '@/store/useQuestsStore';
import { QuestCard } from '@/components/gamification/QuestCard';
import { Container } from '@/components/shared/Container';
import { Scroll, Calendar, CalendarRange, Target } from 'lucide-react';

export function QuestsPage() {
  const { dailyQuests, weeklyQuests, loading, loadQuests } = useQuestsStore();

  useEffect(() => {
    loadQuests();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <Container maxWidth="2xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-text-secondary font-body animate-pulse">Carregando missões...</p>
        </div>
      </Container>
    );
  }

  const completedDaily = dailyQuests.filter(q => q.completed).length;
  const completedWeekly = weeklyQuests.filter(q => q.completed).length;

  return (
    <Container maxWidth="2xl" className="animate-fade-in" noPadding>
      <div className="px-4 py-4 md:py-6 lg:py-8 md:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="parchment-primary forge-border-primary p-3 rounded-xl">
            <Target size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gilded-primary font-display">
              Missões da Guilda
            </h1>
            <p className="text-text-secondary text-sm font-body">Complete desafios e ganhe moedas de ouro</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quests Diárias */}
          <div className="parchment-ultra rounded-2xl p-6 forge-border-primary">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="parchment-primary p-2 rounded-lg">
                  <Calendar size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-text font-display">Missões Diárias</h2>
                  <p className="text-text-muted text-xs font-body">Resetam a meia-noite</p>
                </div>
              </div>
              <div className="parchment-panel rounded-full px-3 py-1">
                <span className="text-sm font-medium text-primary font-heading">{completedDaily}/{dailyQuests.length}</span>
              </div>
            </div>

            <div className="space-y-4">
              {dailyQuests.length === 0 ? (
                <div className="parchment-panel rounded-xl p-8 text-center">
                  <Scroll size={32} className="text-text-muted mx-auto mb-3 opacity-50" />
                  <p className="text-text-secondary font-body">
                    Nenhuma missão diária disponível.
                  </p>
                </div>
              ) : (
                dailyQuests.map((quest) => (
                  <QuestCard key={quest.id} quest={quest} />
                ))
              )}
            </div>
          </div>

          {/* Quests Semanais */}
          <div className="parchment-ultra rounded-2xl p-6 forge-border-accent">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="parchment-accent p-2 rounded-lg">
                  <CalendarRange size={20} className="text-accent" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-text font-display">Missões Semanais</h2>
                  <p className="text-text-muted text-xs font-body">Resetam toda segunda</p>
                </div>
              </div>
              <div className="parchment-panel rounded-full px-3 py-1">
                <span className="text-sm font-medium text-accent font-heading">{completedWeekly}/{weeklyQuests.length}</span>
              </div>
            </div>

            <div className="space-y-4">
              {weeklyQuests.length === 0 ? (
                <div className="parchment-panel rounded-xl p-8 text-center">
                  <Scroll size={32} className="text-text-muted mx-auto mb-3 opacity-50" />
                  <p className="text-text-secondary font-body">
                    Nenhuma missão semanal disponível.
                  </p>
                </div>
              ) : (
                weeklyQuests.map((quest) => (
                  <QuestCard key={quest.id} quest={quest} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
