import { useMemo } from 'react';
import { useStatsStore } from '@/store/useStatsStore';
import { ScoreEngine } from '@/domain/scoring/ScoreEngine';
import { calculateLevel } from '@/domain/scoring/achievements';
import { ACHIEVEMENTS } from '@/domain/scoring/achievements';
import { Download, Trophy, Flame, Lock, Calendar, CalendarRange, Zap, Award, Crown, Swords } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Container } from '@/components/shared/Container';
import { XpBar } from '@/components/user/XpBar';

export function StatsPage() {
  const { dailyStats, achievements, progress, loading, exportCSV } = useStatsStore();

  if (loading) {
    return (
      <Container maxWidth="lg">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-text-secondary font-body animate-pulse">Carregando estatísticas...</p>
        </div>
      </Container>
    );
  }

  // Memoizar calculos para evitar recalcular a cada render
  const todayStats = useMemo(() =>
    ScoreEngine.aggregateStats(dailyStats, 'today'),
    [dailyStats]
  );

  const weekStats = useMemo(() =>
    ScoreEngine.aggregateStats(dailyStats, 'week'),
    [dailyStats]
  );

  const allStats = useMemo(() =>
    ScoreEngine.aggregateStats(dailyStats, 'all'),
    [dailyStats]
  );

  const level = useMemo(() =>
    calculateLevel(progress.totalXp),
    [progress.totalXp]
  );

  // Converter achievements para Set para verificação O(1) em vez de O(n)
  const unlockedSet = useMemo(() =>
    new Set(achievements),
    [achievements]
  );

  const unlockedCount = achievements.length;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <Container maxWidth="2xl" className="animate-fade-in" noPadding>
      <div className="px-4 py-4 md:py-6 lg:py-8 md:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <div className="parchment-primary forge-border-primary p-3 rounded-xl">
              <Crown size={24} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gilded-primary font-display">
                Crônica do Guerreiro
              </h1>
              <p className="text-text-secondary text-sm font-body">Acompanhe seu progresso</p>
            </div>
          </div>
          <Button
            onClick={() => exportCSV().catch(console.error)}
            variant="iron"
            icon={<Download size={16} />}
            size="sm"
          >
            <span className="hidden md:inline">Exportar</span>
          </Button>
        </div>

        {/* XP Progress Card */}
        <div className="parchment-ultra rounded-2xl p-6 forge-border-primary mb-6 md:mb-8">
          <XpBar variant="detailed" />
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mb-6 md:mb-8">
          {/* Hoje */}
          <div className="parchment-ultra rounded-2xl p-5 forge-border-primary hover:shadow-torch-primary transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <div className="parchment-primary p-2 rounded-lg">
                <Calendar size={18} className="text-primary" />
              </div>
              <span className="text-xs text-text-muted uppercase tracking-wider font-heading">Hoje</span>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-gilded-primary font-display mb-1">{todayStats.pomodoros}</p>
            <p className="text-text-secondary text-sm font-body">{todayStats.minutes} minutos</p>
          </div>

          {/* Esta Semana */}
          <div className="parchment-ultra rounded-2xl p-5 forge-border-success hover:shadow-torch-success transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <div className="parchment-success p-2 rounded-lg">
                <CalendarRange size={18} className="text-success" />
              </div>
              <span className="text-xs text-text-muted uppercase tracking-wider font-heading">Semana</span>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-gilded-success font-display mb-1">{weekStats.pomodoros}</p>
            <p className="text-text-secondary text-sm font-body">{weekStats.minutes} minutos</p>
          </div>

          {/* Total */}
          <div className="parchment-ultra rounded-2xl p-5 forge-border-accent hover:shadow-torch-accent transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <div className="parchment-accent p-2 rounded-lg">
                <Swords size={18} className="text-accent" />
              </div>
              <span className="text-xs text-text-muted uppercase tracking-wider font-heading">Total</span>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-gilded-accent font-display mb-1">{allStats.pomodoros}</p>
            <p className="text-text-secondary text-sm font-body">{allStats.minutes} minutos</p>
          </div>

          {/* Streak Atual */}
          <div className="parchment-ultra rounded-2xl p-5 forge-border-warning hover:shadow-torch-warning transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <div className="parchment-warning p-2 rounded-lg">
                <Flame size={18} className="text-warning" />
              </div>
              <span className="text-xs text-text-muted uppercase tracking-wider font-heading">Streak</span>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-gilded-warning font-display mb-1">{progress.currentStreak}</p>
            <p className="text-text-secondary text-sm font-body">dias seguidos</p>
          </div>

          {/* Melhor Streak */}
          <div className="parchment-ultra rounded-2xl p-5 forge-border-success hover:shadow-torch-success transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <div className="parchment-success p-2 rounded-lg">
                <Zap size={18} className="text-success" />
              </div>
              <span className="text-xs text-text-muted uppercase tracking-wider font-heading">Recorde</span>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-gilded-success font-display mb-1">{progress.bestStreak}</p>
            <p className="text-text-secondary text-sm font-body">melhor streak</p>
          </div>

          {/* Level */}
          <div className="parchment-ultra rounded-2xl p-5 forge-border-accent hover:shadow-torch-accent transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <div className="parchment-accent p-2 rounded-lg">
                <Award size={18} className="text-accent" />
              </div>
              <span className="text-xs text-text-muted uppercase tracking-wider font-heading">Nível</span>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-gilded-accent font-display mb-1">{level}</p>
            <p className="text-text-secondary text-sm font-body">{progress.totalXp} XP total</p>
          </div>
        </div>

        {/* Achievements - Selos de Honra */}
        <div className="parchment-ultra rounded-2xl p-6 forge-border-primary">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="parchment-warning p-2 rounded-lg">
                <Trophy size={24} className="text-warning" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-text font-display">Selos de Honra</h2>
                <p className="text-text-muted text-sm font-body">{unlockedCount} de {totalCount} desbloqueados</p>
              </div>
            </div>
            {/* Progress indicator */}
            <div className="hidden md:flex items-center gap-3">
              <div className="w-32 h-2 parchment-panel rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-warning to-success transition-all duration-500"
                  style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
                />
              </div>
              <span className="text-sm text-text-secondary font-body">{Math.round((unlockedCount / totalCount) * 100)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ACHIEVEMENTS.map((achievement) => {
              const isUnlocked = unlockedSet.has(achievement.id);

              return (
                <div
                  key={achievement.id}
                  className={`
                    parchment-panel rounded-xl p-4 transition-all duration-300
                    ${isUnlocked
                      ? 'forge-border-primary hover:shadow-torch-primary'
                      : 'border border-border/50 opacity-50'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`text-3xl flex-shrink-0 ${!isUnlocked && 'grayscale opacity-50'}`}>
                      {achievement.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-bold truncate font-heading ${isUnlocked ? 'text-text' : 'text-text-muted'}`}>
                          {achievement.name}
                        </h3>
                        {!isUnlocked && <Lock size={14} className="text-text-muted flex-shrink-0" />}
                      </div>
                      <p className="text-text-secondary text-sm mb-2 line-clamp-2 font-body">
                        {achievement.description}
                      </p>
                      <span className={`text-xs font-medium font-heading ${isUnlocked ? 'text-primary' : 'text-text-muted'}`}>
                        +{achievement.xp} XP
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Container>
  );
}
