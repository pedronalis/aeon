import { useEffect, useMemo, useState } from 'react';
import { useQuestsStore } from '@/store/useQuestsStore';
import { QuestCard } from '@/components/gamification/QuestCard';
import { Container } from '@/components/shared/Container';
import { Scroll, Calendar, CalendarRange, Target, Clock } from 'lucide-react';

export function QuestsPage() {
  const { dailyQuests, weeklyQuests, loading, loadQuests } = useQuestsStore();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    loadQuests();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const completedDaily = dailyQuests.filter(q => q.completed).length;
  const completedWeekly = weeklyQuests.filter(q => q.completed).length;
  const totalDaily = dailyQuests.length;
  const totalWeekly = weeklyQuests.length;
  const totalQuests = totalDaily + totalWeekly;
  const totalCompleted = completedDaily + completedWeekly;
  const completedXp = [...dailyQuests, ...weeklyQuests].reduce(
    (sum, quest) => sum + (quest.completed ? quest.xpReward : 0),
    0
  );
  const overallProgress = totalQuests > 0 ? Math.round((totalCompleted / totalQuests) * 100) : 0;
  const dailyProgressPercent = totalDaily > 0 ? Math.round((completedDaily / totalDaily) * 100) : 0;
  const weeklyProgressPercent = totalWeekly > 0 ? Math.round((completedWeekly / totalWeekly) * 100) : 0;
  const dailyRemaining = Math.max(0, totalDaily - completedDaily);
  const weeklyRemaining = Math.max(0, totalWeekly - completedWeekly);
  const dailyXpRemaining = dailyQuests.reduce(
    (sum, quest) => sum + (quest.completed ? 0 : quest.xpReward),
    0
  );
  const weeklyXpRemaining = weeklyQuests.reduce(
    (sum, quest) => sum + (quest.completed ? 0 : quest.xpReward),
    0
  );
  const dailyResetLabel = useMemo(() => {
    const nextReset = new Date(now);
    nextReset.setHours(24, 0, 0, 0);
    return formatCountdown(now, nextReset);
  }, [now]);
  const weeklyResetLabel = useMemo(() => {
    const nextReset = new Date(now);
    const day = nextReset.getDay();
    const daysUntilMonday = (8 - day) % 7;
    nextReset.setDate(nextReset.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
    nextReset.setHours(0, 0, 0, 0);
    return formatCountdown(now, nextReset);
  }, [now]);

  if (loading) {
    return (
      <Container maxWidth="2xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-text-secondary font-body animate-pulse">Carregando missões...</p>
        </div>
      </Container>
    );
  }

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
            <p className="text-text-secondary text-sm font-body">Complete desafios e ganhe XP</p>
          </div>
        </div>

        {/* Summary */}
        <div className="parchment-ultra rounded-2xl p-6 forge-border-primary mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="parchment-primary p-2 rounded-lg">
                <Target size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-text font-display">Progresso da Guilda</h2>
                <p className="text-text-muted text-xs font-body">Resumo das missões ativas</p>
              </div>
            </div>
            <div className="parchment-panel rounded-full px-3 py-1">
              <span className="text-sm font-semibold text-primary font-heading">
                {totalCompleted}/{totalQuests}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="parchment-panel rounded-xl p-4">
              <p className="text-xs text-text-muted font-heading uppercase tracking-wider mb-1">Diárias</p>
              <p className="text-2xl font-bold text-gilded-primary font-display">
                {completedDaily}/{totalDaily}
              </p>
              <p className="text-xs text-text-secondary font-body">Missões concluídas</p>
            </div>
            <div className="parchment-panel rounded-xl p-4">
              <p className="text-xs text-text-muted font-heading uppercase tracking-wider mb-1">Semanais</p>
              <p className="text-2xl font-bold text-gilded-accent font-display">
                {completedWeekly}/{totalWeekly}
              </p>
              <p className="text-xs text-text-secondary font-body">Missões concluídas</p>
            </div>
            <div className="parchment-panel rounded-xl p-4">
              <p className="text-xs text-text-muted font-heading uppercase tracking-wider mb-1">Recompensas</p>
              <p className="text-2xl font-bold text-gilded-success font-display">
                {completedXp} XP
              </p>
              <p className="text-xs text-text-secondary font-body">Ganhos nas missões</p>
            </div>
          </div>

          <div className="mt-5">
            <div className="relative h-2 parchment-panel rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-bronze"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-text-muted mt-2 font-body">
              <span>{overallProgress}% concluído</span>
              <span>{totalQuests} missões ativas</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
            <div className="parchment-panel rounded-xl p-4 flex items-center gap-3">
              <div className="parchment-primary p-2 rounded-lg">
                <Clock size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-text-muted font-heading uppercase tracking-wider">Reset diário</p>
                <p className="text-sm text-text font-body">Em {dailyResetLabel}</p>
              </div>
            </div>
            <div className="parchment-panel rounded-xl p-4 flex items-center gap-3">
              <div className="parchment-accent p-2 rounded-lg">
                <CalendarRange size={16} className="text-accent" />
              </div>
              <div>
                <p className="text-xs text-text-muted font-heading uppercase tracking-wider">Reset semanal</p>
                <p className="text-sm text-text font-body">Em {weeklyResetLabel}</p>
              </div>
            </div>
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

            <div className="parchment-panel rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between text-xs font-heading text-text-muted mb-2">
                <span className="uppercase tracking-[0.2em]">Progresso diário</span>
                <span>{dailyProgressPercent}%</span>
              </div>
              <div className="relative h-2 parchment-ultra rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-bronze"
                  style={{ width: `${dailyProgressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-text-muted mt-2 font-body">
                <span>
                  {dailyRemaining === 0
                    ? 'Todas seladas'
                    : `Restam ${dailyRemaining} missão${dailyRemaining !== 1 ? 's' : ''}`}
                </span>
                <span>{dailyXpRemaining} XP em jogo</span>
              </div>
            </div>

            <div className="space-y-4">
              {dailyQuests.length === 0 ? (
                <div className="parchment-panel rounded-xl p-8 text-center">
                  <div className="mx-auto mb-3 w-12 h-12 rounded-full parchment-primary flex items-center justify-center">
                    <Scroll size={20} className="text-primary" />
                  </div>
                  <h3 className="text-sm font-heading text-text mb-2">Salão diário em silêncio</h3>
                  <p className="text-text-secondary font-body">
                    Nenhuma missão diária selada no momento.
                  </p>
                  <div className="ornate-divider opacity-50 my-3" />
                  <p className="text-[11px] text-text-muted font-body">
                    As missões renascem a cada amanhecer.
                  </p>
                </div>
              ) : (
                dailyQuests.map((quest, index) => (
                  <div
                    key={quest.id}
                    className="animate-slide-in-up"
                    style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
                  >
                    <QuestCard quest={quest} />
                  </div>
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

            <div className="parchment-panel rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between text-xs font-heading text-text-muted mb-2">
                <span className="uppercase tracking-[0.2em]">Progresso semanal</span>
                <span>{weeklyProgressPercent}%</span>
              </div>
              <div className="relative h-2 parchment-ultra rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-primary"
                  style={{ width: `${weeklyProgressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-text-muted mt-2 font-body">
                <span>
                  {weeklyRemaining === 0
                    ? 'Todas seladas'
                    : `Restam ${weeklyRemaining} missão${weeklyRemaining !== 1 ? 's' : ''}`}
                </span>
                <span>{weeklyXpRemaining} XP em jogo</span>
              </div>
            </div>

            <div className="space-y-4">
              {weeklyQuests.length === 0 ? (
                <div className="parchment-panel rounded-xl p-8 text-center">
                  <div className="mx-auto mb-3 w-12 h-12 rounded-full parchment-accent flex items-center justify-center">
                    <Scroll size={20} className="text-accent" />
                  </div>
                  <h3 className="text-sm font-heading text-text mb-2">Crônica semanal aguardando</h3>
                  <p className="text-text-secondary font-body">
                    Nenhuma missão semanal selada ainda.
                  </p>
                  <div className="ornate-divider opacity-50 my-3" />
                  <p className="text-[11px] text-text-muted font-body">
                    A semana se completa na próxima segunda.
                  </p>
                </div>
              ) : (
                weeklyQuests.map((quest, index) => (
                  <div
                    key={quest.id}
                    className="animate-slide-in-up"
                    style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
                  >
                    <QuestCard quest={quest} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}

function formatCountdown(now: Date, target: Date): string {
  const diffMs = Math.max(0, target.getTime() - now.getTime());
  const totalMinutes = Math.ceil(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes - days * 24 * 60) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}
