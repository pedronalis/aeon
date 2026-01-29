import { useEffect, useState } from 'react';
import { TimerPage } from './pages/TimerPage';
import { StatsPage } from './pages/StatsPage';
import { QuestsPage } from './pages/QuestsPage';
import { TasksPage } from './pages/TasksPage';
import { SettingsPage } from './pages/SettingsPage';
import { useSettingsStore } from './store/useSettingsStore';
import { useStatsStore } from './store/useStatsStore';
import { useUserProfileStore } from './store/useUserProfileStore';
import { useQuestsStore } from './store/useQuestsStore';
import { useTasksStore } from './store/useTasksStore';
import { XpBar } from './components/user/XpBar';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { Clock, BarChart3, Flame, Scroll, Shield, FileText } from 'lucide-react';

type Tab = 'timer' | 'stats' | 'quests' | 'tasks' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('timer');
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const isTopAlignedTab = activeTab === 'tasks' || activeTab === 'quests' || activeTab === 'stats';

  console.log('[App] Rendering, isInitializing:', isInitializing);

  // Carregar dados iniciais
  useEffect(() => {
    const initializeApp = async () => {
      console.log('[App] Starting initialization...');
      try {
        console.log('[App] Loading settings...');
        await useSettingsStore.getState().loadSettings();
        console.log('[App] Loading modes...');
        await useSettingsStore.getState().loadModes();
        console.log('[App] Loading stats...');
        await useStatsStore.getState().loadStats();
        console.log('[App] Loading profile...');
        await useUserProfileStore.getState().loadProfile();
        console.log('[App] Loading quests...');
        await useQuestsStore.getState().loadQuests();
        console.log('[App] Loading tasks...');
        await useTasksStore.getState().loadTasks();
        await useTasksStore.getState().applyOverduePenalties();
        console.log('[App] Initialization complete!');
      } catch (error) {
        console.error('[App] Error initializing app:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsInitializing(false);
      }
    };
    initializeApp();
  }, []);

  useEffect(() => {
    if (isInitializing || initError) return;
    const intervalId = setInterval(() => {
      void useTasksStore.getState().applyOverduePenalties();
    }, 10 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [isInitializing, initError]);

  // Error screen
  if (initError) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#0f0d0b', color: '#e8dcc4' }}>
        <div className="text-center space-y-4 p-8">
          <div className="text-4xl">&#9760;</div>
          <p className="text-xl font-display font-bold" style={{ color: '#9b2335' }}>Erro ao inicializar</p>
          <p className="font-body" style={{ color: '#b5a68a' }}>{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded font-heading"
            style={{ backgroundColor: '#c9a227', color: '#0f0d0b' }}
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
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#0f0d0b', color: '#e8dcc4' }}>
        <div className="text-center space-y-4">
          <div className="text-4xl animate-torch-flicker">&#128293;</div>
          <p className="font-heading" style={{ color: '#b5a68a' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-text">
      <NotificationCenter />
      {/* Header Premium Medieval */}
      <header className="parchment-panel border-b border-primary/20 shadow-elevation-2 flex-shrink-0">
        <div className="container mx-auto px-4 py-4 md:py-5">
          <div className="flex items-center justify-between gap-4">
            {/* Logo + Nome */}
            <div className="flex items-center gap-3">
              <Flame
                size={26}
                className="text-primary animate-gold-breathe flex-shrink-0"
              />
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gilded-primary font-display drop-shadow-lg">
                Aeon
              </h1>
            </div>

            {/* User Card - Avatar + Level + XP */}
            <XpBar variant="header-card" />
          </div>
        </div>
      </header>

      {/* Tab Navigation Medieval */}
      <nav className="border-b border-primary/10 bg-background/80 flex-shrink-0" role="tablist">
        <div className="container mx-auto px-4">
          <div className="flex gap-3 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
            <button
              onClick={() => setActiveTab('timer')}
              className={`tab group min-h-[44px] focus-visible:!ring-2 focus-visible:!ring-primary focus-visible:!ring-offset-2 focus-visible:!ring-offset-background focus-visible:!outline-none ${activeTab === 'timer' ? 'tab-active font-semibold' : 'font-medium hover:text-primary-light'}`}
              role="tab"
              aria-selected={activeTab === 'timer'}
            >
              <Clock
                size={18}
                className={`transition-transform duration-normal ${
                  activeTab === 'timer' ? 'scale-110 animate-gold-breathe' : 'group-hover:scale-105'
                }`}
              />
              <span className="hidden md:inline font-heading">Timer</span>
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`tab group min-h-[44px] focus-visible:!ring-2 focus-visible:!ring-primary focus-visible:!ring-offset-2 focus-visible:!ring-offset-background focus-visible:!outline-none ${activeTab === 'stats' ? 'tab-active font-semibold' : 'font-medium hover:text-primary-light'}`}
              role="tab"
              aria-selected={activeTab === 'stats'}
            >
              <BarChart3
                size={18}
                className={`transition-transform duration-normal ${
                  activeTab === 'stats' ? 'scale-110 animate-gold-breathe' : 'group-hover:scale-105'
                }`}
              />
              <span className="hidden md:inline font-heading">Crônica</span>
            </button>
            <button
              onClick={() => setActiveTab('quests')}
              className={`tab group min-h-[44px] focus-visible:!ring-2 focus-visible:!ring-primary focus-visible:!ring-offset-2 focus-visible:!ring-offset-background focus-visible:!outline-none ${activeTab === 'quests' ? 'tab-active font-semibold' : 'font-medium hover:text-primary-light'}`}
              role="tab"
              aria-selected={activeTab === 'quests'}
            >
              <Scroll
                size={18}
                className={`transition-transform duration-normal ${
                  activeTab === 'quests' ? 'scale-110 animate-gold-breathe' : 'group-hover:scale-105'
                }`}
              />
              <span className="hidden md:inline font-heading">Missões</span>
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`tab group min-h-[44px] focus-visible:!ring-2 focus-visible:!ring-primary focus-visible:!ring-offset-2 focus-visible:!ring-offset-background focus-visible:!outline-none ${activeTab === 'tasks' ? 'tab-active font-semibold' : 'font-medium hover:text-primary-light'}`}
              role="tab"
              aria-selected={activeTab === 'tasks'}
            >
              <FileText
                size={18}
                className={`transition-transform duration-normal ${
                  activeTab === 'tasks' ? 'scale-110 animate-gold-breathe' : 'group-hover:scale-105'
                }`}
              />
              <span className="hidden md:inline font-heading">Pergaminhos</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`tab group min-h-[44px] focus-visible:!ring-2 focus-visible:!ring-primary focus-visible:!ring-offset-2 focus-visible:!ring-offset-background focus-visible:!outline-none ${activeTab === 'settings' ? 'tab-active font-semibold' : 'font-medium hover:text-primary-light'}`}
              role="tab"
              aria-selected={activeTab === 'settings'}
            >
              <Shield
                size={18}
                className={`transition-transform duration-normal ${
                  activeTab === 'settings' ? 'scale-110 animate-gold-breathe' : 'group-hover:scale-105'
                }`}
              />
              <span className="hidden md:inline font-heading">Reino</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main role="tabpanel" className="flex-1 flex overflow-y-auto">
        <div
          className={`
            flex-1 w-full flex flex-col items-center
            ${isTopAlignedTab ? 'justify-start' : 'justify-center'}
          `}
        >
          <div key={activeTab} className="animate-fade-in w-full">
            {activeTab === 'timer' && <TimerPage />}
            {activeTab === 'stats' && <StatsPage />}
            {activeTab === 'quests' && <QuestsPage />}
            {activeTab === 'tasks' && <TasksPage />}
            {activeTab === 'settings' && <SettingsPage />}
          </div>
        </div>
      </main>

      {/* Footer Medieval */}
      <footer className="parchment-panel border-t border-primary/10 py-4 md:py-5 flex-shrink-0 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Branding */}
            <div className="flex items-center gap-3 text-sm font-heading">
              <span className="text-gilded-primary font-semibold">Aeon</span>
              <span className="text-text-muted">|</span>
              <span className="text-text-secondary">v1.0.0</span>
            </div>

            {/* Medieval phrase */}
            <div className="flex items-center gap-2 text-sm text-text-secondary font-body italic">
              Pela Chama Eterna
              <Flame size={14} className="text-primary animate-torch-flicker" />
            </div>

            {/* Theme indicator */}
            <div className="hidden md:flex items-center gap-2 text-sm font-heading">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-primary animate-torch-flicker" />
                <div className="w-2 h-2 rounded-full bg-accent" />
                <div className="w-2 h-2 rounded-full bg-success" />
              </div>
              <span className="text-text-muted">Medieval Premium</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
