import { useMemo, useState } from 'react';
import { useStatsStore } from '@/store/useStatsStore';
import { useTasksStore } from '@/store/useTasksStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { ScoreEngine } from '@/domain/scoring/ScoreEngine';
import { calculateLevel } from '@/domain/scoring/achievements';
import { ACHIEVEMENTS, type Achievement } from '@/domain/scoring/achievements';
import { formatDate, getWeekRange, parseDate } from '@/domain/utils/dateUtils';
import {
  Award,
  ArrowUpDown,
  Calendar,
  CalendarRange,
  Compass,
  Crown,
  Download,
  Flame,
  Lock,
  Unlock,
  Scroll,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Container } from '@/components/shared/Container';
import { XpBar } from '@/components/user/XpBar';

const ACHIEVEMENT_CATEGORIES = [
  {
    id: 'beginner',
    label: 'Iniciação',
    description: 'Primeiros feitos na Ordem',
    icon: Sparkles,
  },
  {
    id: 'consistency',
    label: 'Consistência',
    description: 'Ritual após ritual, sem falhar',
    icon: Flame,
  },
  {
    id: 'quantity',
    label: 'Quantidade',
    description: 'Marcos de volume e dedicação',
    icon: Swords,
  },
  {
    id: 'modes',
    label: 'Modos',
    description: 'Maestria entre estilos e técnicas',
    icon: Compass,
  },
  {
    id: 'special',
    label: 'Especiais',
    description: 'Desafios raros da Ordem',
    icon: Shield,
  },
  {
    id: 'tasks',
    label: 'Pergaminhos',
    description: 'Tarefas seladas com honra',
    icon: Scroll,
  },
] as const;

const CATEGORY_STYLES = {
  beginner: {
    border: 'forge-border-primary',
    iconWrap: 'parchment-primary',
    text: 'text-primary',
    badge: 'bg-primary/15 text-primary border-primary/30',
    progress: 'bg-gradient-to-r from-primary to-bronze',
    shadow: 'hover:shadow-torch-primary',
  },
  consistency: {
    border: 'forge-border-success',
    iconWrap: 'parchment-success',
    text: 'text-success',
    badge: 'bg-success/15 text-success border-success/30',
    progress: 'bg-gradient-to-r from-success to-success/70',
    shadow: 'hover:shadow-torch-success',
  },
  quantity: {
    border: 'forge-border-warning',
    iconWrap: 'parchment-warning',
    text: 'text-warning',
    badge: 'bg-warning/15 text-warning border-warning/30',
    progress: 'bg-gradient-to-r from-warning to-bronze',
    shadow: 'hover:shadow-torch-warning',
  },
  modes: {
    border: 'forge-border-accent',
    iconWrap: 'parchment-accent',
    text: 'text-accent',
    badge: 'bg-accent/15 text-accent border-accent/30',
    progress: 'bg-gradient-to-r from-accent to-accent/70',
    shadow: 'hover:shadow-torch-accent',
  },
  special: {
    border: 'forge-border-warning',
    iconWrap: 'parchment-warning',
    text: 'text-warning',
    badge: 'bg-warning/15 text-warning border-warning/30',
    progress: 'bg-gradient-to-r from-warning to-success',
    shadow: 'hover:shadow-torch-warning',
  },
  tasks: {
    border: 'forge-border-primary',
    iconWrap: 'parchment-primary',
    text: 'text-primary',
    badge: 'bg-primary/15 text-primary border-primary/30',
    progress: 'bg-gradient-to-r from-primary to-bronze',
    shadow: 'hover:shadow-torch-primary',
  },
} as const;

export function StatsPage() {
  const { dailyStats, achievements, progress, loading, exportCSV } = useStatsStore();
  const tasks = useTasksStore((state) => state.tasks);
  const modes = useSettingsStore((state) => state.modes);
  const [achievementFilter, setAchievementFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [achievementSort, setAchievementSort] = useState<'default' | 'progress'>('default');

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
  const lockedCount = Math.max(0, totalCount - unlockedCount);
  const achievementsByCategory = useMemo(() => {
    return ACHIEVEMENT_CATEGORIES.reduce<Record<string, Achievement[]>>((acc, category) => {
      acc[category.id] = ACHIEVEMENTS.filter((achievement) => achievement.category === category.id);
      return acc;
    }, {});
  }, []);

  const progressById = useMemo(() => {
    const progressMap = new Map<string, { current: number; target: number; label?: string }>();
    const dailyTotals = new Map<string, number>();
    let totalPomodoros = 0;

    for (const stat of dailyStats) {
      totalPomodoros += stat.pomodorosCompleted;
      dailyTotals.set(stat.date, (dailyTotals.get(stat.date) ?? 0) + stat.pomodorosCompleted);
    }

    const today = formatDate(new Date());
    const todayTotal = dailyTotals.get(today) ?? 0;
    const maxStreak = Math.max(progress.currentStreak, progress.bestStreak);
    const presetIds = ['traditional', 'sustainable', 'animedoro', 'mangadoro'];
    const modesUsed = new Set(dailyStats.map((stat) => stat.modeId));
    const usedPresets = presetIds.filter((id) => modesUsed.has(id)).length;
    const hasCustomMode = modes.some((mode) => mode.isCustom);
    const modeTotals = new Map<string, number>();

    for (const stat of dailyStats) {
      modeTotals.set(stat.modeId, (modeTotals.get(stat.modeId) ?? 0) + stat.pomodorosCompleted);
    }

    const maxModeTotal = Math.max(0, ...Array.from(modeTotals.values()));
    let weekendMax = 0;

    for (const [dateStr, count] of dailyTotals.entries()) {
      const day = parseDate(dateStr).getDay();
      if (day === 0 || day === 6) {
        weekendMax = Math.max(weekendMax, count);
      }
    }

    const [weekStart] = getWeekRange(new Date());
    let daysWithTwoPlus = 0;
    for (let i = 0; i < 7; i += 1) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      const dayStr = formatDate(day);
      if ((dailyTotals.get(dayStr) ?? 0) >= 2) {
        daysWithTwoPlus += 1;
      }
    }

    const completedTasks = tasks.filter((task) => task.status === 'completed');
    const totalCompleted = completedTasks.length;
    const tasksWithDeadline = completedTasks.filter((task) => task.deadline && task.completedAt);
    const onTimeTasks = tasksWithDeadline.filter((task) => {
      return (task.completedAt ?? '') <= (task.deadline ?? '');
    });
    const earlyTasks = tasksWithDeadline.filter((task) => {
      if (!task.deadline || !task.completedAt) return false;
      const deadlineDate = parseDate(task.deadline);
      const completedDate = parseDate(task.completedAt);
      return completedDate.getTime() < deadlineDate.getTime() - 24 * 60 * 60 * 1000;
    });
    const epicTasks = completedTasks.filter(
      (task) => task.effort === 'epic' || task.effort === 'legendary'
    );
    const maxLinked = tasks.reduce((max, task) => Math.max(max, task.linkedPomodoros), 0);

    const clamp = (value: number, target: number) => Math.min(value, target);

    progressMap.set('first_focus', { current: clamp(totalPomodoros, 1), target: 1, label: 'Rituais' });
    progressMap.set('five_focuses', { current: clamp(todayTotal, 5), target: 5, label: 'Rituais hoje' });
    progressMap.set('streak_3', { current: clamp(maxStreak, 3), target: 3, label: 'Melhor streak' });
    progressMap.set('streak_7', { current: clamp(maxStreak, 7), target: 7, label: 'Melhor streak' });
    progressMap.set('streak_14', { current: clamp(maxStreak, 14), target: 14, label: 'Melhor streak' });
    progressMap.set('streak_30', { current: clamp(maxStreak, 30), target: 30, label: 'Melhor streak' });
    progressMap.set('streak_60', { current: clamp(maxStreak, 60), target: 60, label: 'Melhor streak' });
    progressMap.set('total_25', { current: clamp(totalPomodoros, 25), target: 25, label: 'Rituais totais' });
    progressMap.set('total_100', { current: clamp(totalPomodoros, 100), target: 100, label: 'Rituais totais' });
    progressMap.set('total_250', { current: clamp(totalPomodoros, 250), target: 250, label: 'Rituais totais' });
    progressMap.set('total_500', { current: clamp(totalPomodoros, 500), target: 500, label: 'Rituais totais' });
    progressMap.set('total_1000', { current: clamp(totalPomodoros, 1000), target: 1000, label: 'Rituais totais' });
    progressMap.set('try_all_modes', { current: clamp(usedPresets, presetIds.length), target: presetIds.length, label: 'Estilos usados' });
    progressMap.set('custom_mode', { current: hasCustomMode ? 1 : 0, target: 1, label: 'Modo custom' });
    progressMap.set('mode_loyalist', { current: clamp(maxModeTotal, 50), target: 50, label: 'Rituais no mesmo estilo' });
    progressMap.set('early_bird', { current: 0, target: 1, label: 'Ritual matinal' });
    progressMap.set('night_owl', { current: 0, target: 1, label: 'Ritual noturno' });
    progressMap.set('weekend_warrior', { current: clamp(weekendMax, 3), target: 3, label: 'Rituais no fim de semana' });
    progressMap.set('daily_10', { current: clamp(todayTotal, 10), target: 10, label: 'Rituais hoje' });
    progressMap.set('perfect_week', { current: daysWithTwoPlus, target: 7, label: 'Dias com 2+ rituais' });
    progressMap.set('export_data', { current: 0, target: 1, label: 'Exportação' });
    progressMap.set('first_task', { current: clamp(totalCompleted, 1), target: 1, label: 'Pergaminhos selados' });
    progressMap.set('task_total_25', { current: clamp(totalCompleted, 25), target: 25, label: 'Pergaminhos selados' });
    progressMap.set('task_total_100', { current: clamp(totalCompleted, 100), target: 100, label: 'Pergaminhos selados' });
    progressMap.set('task_streak_5', { current: clamp(onTimeTasks.length, 5), target: 5, label: 'No prazo' });
    progressMap.set('task_streak_10', { current: clamp(onTimeTasks.length, 10), target: 10, label: 'No prazo' });
    progressMap.set('task_early', { current: clamp(earlyTasks.length, 3), target: 3, label: 'Antes do prazo' });
    progressMap.set('task_epic', { current: clamp(epicTasks.length, 10), target: 10, label: 'Épicos selados' });
    progressMap.set('task_linked', { current: clamp(maxLinked, 10), target: 10, label: 'Pomodoros no mesmo pergaminho' });
    progressMap.set('task_linked_25', { current: clamp(maxLinked, 25), target: 25, label: 'Pomodoros no mesmo pergaminho' });

    return progressMap;
  }, [dailyStats, progress.currentStreak, progress.bestStreak, tasks, modes]);

  const getProgressPercent = (achievement: Achievement, isUnlocked: boolean) => {
    if (isUnlocked) return 100;
    const progressInfo = progressById.get(achievement.id);
    if (!progressInfo) return 0;
    return Math.min(100, Math.round((progressInfo.current / progressInfo.target) * 100));
  };

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
        <div className="parchment-ultra rounded-2xl p-6 md:p-7 forge-border-primary">
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

          <div className="space-y-10">
            <div className="flex flex-wrap items-center gap-2">
              {([
                { id: 'all', label: 'Todos', count: totalCount },
                { id: 'unlocked', label: 'Desbloqueados', count: unlockedCount },
                { id: 'locked', label: 'Selados', count: lockedCount },
              ] as const).map((option) => {
                const isActive = achievementFilter === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setAchievementFilter(option.id)}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-lg
                      text-xs font-heading transition-all duration-fast
                      ${isActive
                        ? 'parchment-primary text-primary forge-border-primary'
                        : 'parchment-panel text-text-secondary hover:text-text hover:parchment-ultra'
                      }
                    `}
                  >
                    <span>{option.label}</span>
                    <span
                      className={`
                        ml-1 px-1.5 py-0.5 rounded text-[10px]
                        ${isActive ? 'bg-primary/20 text-primary' : 'bg-surface text-text-muted'}
                      `}
                    >
                      {option.count}
                    </span>
                  </button>
                );
              })}
              <button
                onClick={() =>
                  setAchievementSort(achievementSort === 'progress' ? 'default' : 'progress')
                }
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg
                  text-xs font-heading transition-all duration-fast md:ml-auto
                  ${achievementSort === 'progress'
                    ? 'parchment-primary text-primary forge-border-primary'
                    : 'parchment-panel text-text-secondary hover:text-text hover:parchment-ultra'
                  }
                `}
              >
                <ArrowUpDown size={12} />
                Ordenar por progresso
              </button>
            </div>

            {ACHIEVEMENT_CATEGORIES.map((category) => {
              const items = achievementsByCategory[category.id] ?? [];
              if (items.length === 0) return null;
              const unlockedInCategory = items.filter((achievement) => unlockedSet.has(achievement.id)).length;
              const filteredItems = items.filter((achievement) => {
                if (achievementFilter === 'all') return true;
                const isUnlocked = unlockedSet.has(achievement.id);
                return achievementFilter === 'unlocked' ? isUnlocked : !isUnlocked;
              });
              if (filteredItems.length === 0) return null;
              const sortedItems = achievementSort === 'progress'
                ? filteredItems
                  .map((achievement, index) => {
                    const isUnlocked = unlockedSet.has(achievement.id);
                    const progressPercent = getProgressPercent(achievement, isUnlocked);
                    const weight = achievementFilter === 'all'
                      ? (isUnlocked ? 1000 + progressPercent : progressPercent)
                      : progressPercent;
                    return { achievement, index, weight };
                  })
                  .sort((a, b) => {
                    if (b.weight !== a.weight) return b.weight - a.weight;
                    return a.index - b.index;
                  })
                  .map((entry) => entry.achievement)
                : filteredItems;
              const progressPercent = Math.round((unlockedInCategory / items.length) * 100);
              const styles = CATEGORY_STYLES[category.id];
              const CategoryIcon = category.icon;

              return (
                <section key={category.id} className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${styles.iconWrap} ${styles.border}`}>
                        <CategoryIcon size={18} className={styles.text} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-text font-display">
                          {category.label}
                        </h3>
                        <p className="text-xs text-text-muted font-body">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-28 h-2 parchment-panel rounded-full overflow-hidden">
                        <div
                          className={`h-full ${styles.progress} transition-all duration-500`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className={`text-xs font-heading ${styles.text}`}>
                        {unlockedInCategory}/{items.length}
                      </span>
                    </div>
                  </div>

                  <div className="ornate-divider opacity-70" />

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                    {sortedItems.length === 0 ? (
                      <div className="parchment-panel rounded-xl p-6 text-center border border-border/60 md:col-span-2 xl:col-span-3">
                        <div className={`mx-auto mb-3 w-12 h-12 rounded-full flex items-center justify-center ${styles.iconWrap}`}>
                          <Icon size={20} className={styles.text} />
                        </div>
                        <h4 className="text-sm font-heading text-text mb-2">Nenhuma conquista visível</h4>
                        <p className="text-text-secondary text-sm font-body">
                          Ajuste o selo de filtro para revelar outras crônicas.
                        </p>
                        <div className="ornate-divider opacity-50 my-3" />
                        <p className="text-[11px] text-text-muted font-body">
                          Cada feito permanece aguardando sua chama.
                        </p>
                      </div>
                    ) : (
                      sortedItems.map((achievement, index) => {
                        const isUnlocked = unlockedSet.has(achievement.id);
                        const progressInfo = progressById.get(achievement.id);
                        const progressPercent = progressInfo
                          ? Math.min(100, Math.round((progressInfo.current / progressInfo.target) * 100))
                          : 0;
                        const nearUnlock = !isUnlocked && progressInfo && progressPercent >= 70;

                        return (
                          <div
                            key={achievement.id}
                            className={`
                              parchment-panel rounded-xl p-5 transition-all duration-300 relative overflow-hidden hover-forge-lift animate-slide-in-up
                              ${isUnlocked
                                ? `${styles.border} ${styles.shadow}`
                                : nearUnlock
                                  ? `${styles.border} shadow-torch-sm opacity-90`
                                  : 'border border-border/50 opacity-75'
                              }
                            `}
                            style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'both' }}
                          >
                            <div className="absolute top-3 right-3">
                              {isUnlocked ? (
                                <Unlock size={14} className={styles.text} />
                              ) : (
                                <Lock size={14} className="text-text-muted" />
                              )}
                            </div>
                            <div className="flex items-start gap-3">
                              <div
                                className={`
                                  w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0
                                  ${isUnlocked ? styles.iconWrap : 'parchment-panel border border-border/50'}
                                `}
                              >
                                <span className={`text-2xl ${!isUnlocked ? 'grayscale opacity-60' : ''}`}>
                                  {achievement.icon}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <h4
                                    className={`font-bold truncate font-heading ${isUnlocked ? 'text-text' : 'text-text-muted'}`}
                                  >
                                    {achievement.name}
                                  </h4>
                                  <span
                                    className={`
                                      text-[11px] font-heading px-2 py-0.5 rounded-full border
                                      ${isUnlocked ? styles.badge : 'bg-surface/60 text-text-muted border-border/60'}
                                    `}
                                  >
                                    +{achievement.xp} XP
                                  </span>
                                </div>
                                <p className="text-text-secondary text-sm line-clamp-3 font-body leading-relaxed">
                                  {achievement.description}
                                </p>
                                {isUnlocked ? (
                                  <p className="text-[11px] text-text-muted italic mt-2 line-clamp-3">
                                    &ldquo;{achievement.lore}&rdquo;
                                  </p>
                                ) : (
                                  <p className="text-[11px] text-text-muted mt-2">
                                    Selo selado. Complete o desafio para revelar a crônica.
                                  </p>
                                )}
                                {!isUnlocked && progressInfo && (
                                  <div className="mt-3">
                                    <div className="flex items-center justify-between text-[11px] text-text-muted font-body">
                                      <span>{progressInfo.label ?? 'Progresso'}</span>
                                      <span className={`font-heading ${styles.text}`}>
                                        {progressInfo.current}/{progressInfo.target}
                                      </span>
                                    </div>
                                    <div className="relative h-1.5 mt-1.5 parchment-panel rounded-full overflow-hidden">
                                      <div
                                        className={`absolute inset-y-0 left-0 ${styles.progress}`}
                                        style={{ width: `${progressPercent}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                                {nearUnlock && (
                                  <div className={`mt-2 text-[10px] font-heading uppercase tracking-[0.2em] ${styles.text}`}>
                                    Quase selado
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </Container>
  );
}
