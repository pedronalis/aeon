import { Suspense, lazy, useEffect, useState } from 'react';
import { useAuthStore } from './store/useAuthStore';

const TimerPage = lazy(() => import('./pages/TimerPage').then((m) => ({ default: m.TimerPage })));
const StatsPage = lazy(() => import('./pages/StatsPage').then((m) => ({ default: m.StatsPage })));
const QuestsPage = lazy(() => import('./pages/QuestsPage').then((m) => ({ default: m.QuestsPage })));
const TasksPage = lazy(() => import('./pages/TasksPage').then((m) => ({ default: m.TasksPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const AuthPage = lazy(() => import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })));

import { useSettingsStore } from './store/useSettingsStore';
import { useStatsStore } from './store/useStatsStore';
import { useUserProfileStore } from './store/useUserProfileStore';
import { useQuestsStore } from './store/useQuestsStore';
import { useTasksStore } from './store/useTasksStore';
import { XpBar } from './components/user/XpBar';
import { UserMenu } from './components/user/UserMenu';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { LoadingFallback } from './components/shared/LoadingFallback';
import { Flame, Monitor, BarChart3, Shield, FileText, Target, Menu, X } from 'lucide-react';

type Tab = 'timer' | 'stats' | 'quests' | 'tasks' | 'settings';

const NAV_ITEMS: { id: Tab; label: string; icon: typeof Monitor; mobileLabel: string }[] = [
  { id: 'timer', label: 'Timer', icon: Monitor, mobileLabel: 'Timer' },
  { id: 'stats', label: 'Crônica', icon: BarChart3, mobileLabel: 'Crônica' },
  { id: 'quests', label: 'Missões', icon: Target, mobileLabel: 'Missões' },
  { id: 'tasks', label: 'Pergaminhos', icon: FileText, mobileLabel: 'Pergaminhos' },
  { id: 'settings', label: 'Reino', icon: Shield, mobileLabel: 'Reino' },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('timer');
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userId, initialized, initialize: initAuth } = useAuthStore();

  useEffect(() => {
    void initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!initialized) return;
    if (!userId) {
      setIsInitializing(false);
      return;
    }
    const initializeApp = async () => {
      try {
        await useSettingsStore.getState().loadSettings();
        await useSettingsStore.getState().loadModes();
        await useStatsStore.getState().loadStats();
        await useUserProfileStore.getState().loadProfile();
        await useQuestsStore.getState().loadQuests();
        await useTasksStore.getState().loadTasks();
        await useTasksStore.getState().applyOverduePenalties();
      } catch (error) {
        console.error('[App] Error initializing app:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsInitializing(false);
      }
    };
    void initializeApp();
  }, [initialized, userId]);

  useEffect(() => {
    if (!initialized || !userId || isInitializing || initError) return;
    const intervalId = setInterval(() => {
      void useTasksStore.getState().applyOverduePenalties();
    }, 10 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [initialized, userId, isInitializing, initError]);

  // Close sidebar on mobile when tab changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [activeTab]);

  // Auth screen
  if (!userId) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <AuthPage />
      </Suspense>
    );
  }

  // Error screen
  if (initError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4 p-8">
          <div className="text-4xl">&#9760;</div>
          <p className="text-xl font-display font-bold text-error">Erro ao inicializar</p>
          <p className="font-body text-text-secondary">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded bg-primary text-background font-heading"
          >
            Recarregar
          </button>
        </div>
      </div>
    );
  }

  // Loading screen
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-torch-flicker">&#128293;</div>
          <p className="font-heading text-text-secondary">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-text">
      <NotificationCenter />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          flex flex-col
          w-64 bg-background-lighter border-r border-primary/10
          transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          shadow-elevation-3 md:shadow-none
        `}
      >
        {/* Sidebar Header - Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="parchment-primary forge-border-primary p-1.5 rounded-lg">
              <Flame size={20} className="text-primary animate-gold-breathe" />
            </div>
            <h1 className="text-xl font-bold text-gilded-primary font-display">Aeon</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-surface transition-colors"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" role="navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                  font-heading text-sm transition-all duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
                  ${isActive
                    ? 'parchment-primary forge-border-primary text-primary shadow-torch-sm'
                    : 'text-text-secondary hover:text-text hover:bg-surface/60'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  size={18}
                  className={`flex-shrink-0 transition-transform duration-300 ${
                    isActive ? 'text-primary' : ''
                  }`}
                />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer - User + Theme */}
        <div className="px-3 py-4 border-t border-primary/10 space-y-3">
          <div className="px-3">
            <XpBar variant="compact" showTitle />
          </div>
          <div className="px-3">
            <UserMenu />
          </div>
          <div className="px-3 pt-1">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-torch-flicker" />
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
              </div>
              <span className="font-heading">v1.0.0</span>
            </div>
            <p className="text-[10px] text-text-muted/70 italic font-body mt-1 flex items-center gap-1">
              Pela Chama Eterna
              <Flame size={10} className="text-primary/60" />
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar - Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-primary/10 bg-background-lighter flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-text-secondary hover:text-text hover:bg-surface transition-colors"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-primary animate-gold-breathe" />
            <span className="font-bold text-gilded-primary font-display text-lg">Aeon</span>
          </div>
          <div className="w-10" /> {/* spacer */}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<LoadingFallback />}>
            <div key={activeTab} className="animate-fade-in">
              {activeTab === 'timer' && <TimerPage />}
              {activeTab === 'stats' && <StatsPage />}
              {activeTab === 'quests' && <QuestsPage />}
              {activeTab === 'tasks' && <TasksPage />}
              {activeTab === 'settings' && <SettingsPage />}
            </div>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default App;
