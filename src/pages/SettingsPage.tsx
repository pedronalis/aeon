import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useStatsStore } from '@/store/useStatsStore';
import { useUserProfileStore } from '@/store/useUserProfileStore';
import { MEDIEVAL_AVATARS, getAvatarById } from '@/domain/user/avatars';
import { calculateLevel } from '@/domain/scoring/achievements';
import { getTitleForLevel } from '@/domain/user/titles';
import { Bell, Trash2, AlertTriangle, Info, User, Volume2, Crown, Shield, Sword, ZoomIn, Zap } from 'lucide-react';
import { Container } from '@/components/shared/Container';
import { Switch } from '@/components/shared/Switch';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/shared/Button';

export function SettingsPage() {
  const { settings, updateSettings, loadSettings } = useSettingsStore();
  const { resetData, progress } = useStatsStore();
  const { profile, updateProfile } = useUserProfileStore();
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Local state para edicao de texto
  const [localUsername, setLocalUsername] = useState('');
  const [localBio, setLocalBio] = useState('');

  // Calcular level e título
  const totalXp = progress?.totalXp ?? 0;
  const level = calculateLevel(totalXp);
  const title = getTitleForLevel(level);
  const currentLevelXp = totalXp - (level - 1) * 100;
  const progressPercentage = (currentLevelXp / 100) * 100;

  useEffect(() => {
    loadSettings();
  }, []);

  // Sincronizar state local quando profile carrega
  useEffect(() => {
    if (profile) {
      setLocalUsername(profile.username);
      setLocalBio(profile.bio || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (field: string, value: string) => {
    await updateProfile({ [field]: value });
  };

  const handleUsernameBlur = async () => {
    if (localUsername !== profile?.username) {
      await updateProfile({ username: localUsername });
    }
  };

  const handleBioBlur = async () => {
    if (localBio !== profile?.bio) {
      await updateProfile({ bio: localBio });
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await resetData();
      setShowResetModal(false);
    } catch (error) {
      console.error('Erro ao resetar dados:', error);
    } finally {
      setIsResetting(false);
    }
  };


  const avatar = profile ? getAvatarById(profile.avatarId) : null;

  return (
    <>
      <Container maxWidth="2xl" className="animate-fade-in">
        <div className="py-4 md:py-6 lg:py-8">
          {/* Header da pagina */}
          <div className="flex items-center gap-3 mb-8">
            <div className="parchment-primary forge-border-primary p-3 rounded-xl">
              <Shield size={24} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gilded-primary font-display">
                Configurações do Reino
              </h1>
              <p className="text-text-secondary text-sm font-body">Personalize sua experiência</p>
            </div>
          </div>

          {/* Layout principal: 2 colunas em desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna esquerda - Configurações */}
            <div className="lg:col-span-2 space-y-6">
              {/* Perfil de Personagem */}
              <div className="parchment-ultra rounded-2xl p-6 forge-border-primary animate-slide-in-up">
                <div className="flex items-center gap-3 mb-6">
                  <div className="parchment-primary p-2 rounded-lg">
                    <User size={20} className="text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-text font-display">Perfil de Personagem</h2>
                </div>

                <div className="space-y-6">
                  {/* Nome de Usuario */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2 font-heading">
                      Nome do Personagem
                    </label>
                    <input
                      type="text"
                      value={localUsername}
                      onChange={(e) => setLocalUsername(e.target.value)}
                      onBlur={handleUsernameBlur}
                      placeholder="Digite seu nome"
                      maxLength={30}
                      className="w-full px-4 py-3 parchment-ultra forge-border-primary rounded-xl text-text placeholder:text-text-muted focus:shadow-torch-primary focus:outline-none transition-all duration-300 font-body"
                    />
                  </div>

                  {/* Seletor de Avatar */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-3 font-heading">
                      Escolha seu Avatar
                    </label>
                    <div className="grid grid-cols-6 md:grid-cols-7 gap-2">
                      {MEDIEVAL_AVATARS.map((av) => (
                        <button
                          key={av.id}
                          onClick={() => handleUpdateProfile('avatarId', av.id)}
                          className={`
                            relative p-2 rounded-xl transition-all duration-300
                            ${profile?.avatarId === av.id
                              ? 'parchment-primary forge-border-primary shadow-torch-primary scale-110 z-10'
                              : 'parchment-panel border border-transparent hover:border-primary/30 hover:scale-105'
                            }
                          `}
                          title={av.name}
                        >
                          <span className="text-2xl md:text-3xl block">{av.emoji}</span>
                          {profile?.avatarId === av.id && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bio/Motto */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2 font-heading">
                      Lema de Batalha
                    </label>
                    <textarea
                      value={localBio}
                      onChange={(e) => setLocalBio(e.target.value)}
                      onBlur={handleBioBlur}
                      placeholder="Ex: 'Foco e minha espada, disciplina meu escudo'"
                      maxLength={100}
                      rows={2}
                      className="w-full px-4 py-3 parchment-ultra forge-border-primary rounded-xl text-text placeholder:text-text-muted focus:shadow-torch-primary focus:outline-none transition-all duration-300 resize-none font-body"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-text-muted font-body">Aparece no seu perfil</span>
                      <span className="text-xs text-text-secondary font-body">{localBio.length}/100</span>
                    </div>
                    {!localBio.trim() && (
                      <div className="parchment-panel rounded-lg p-3 mt-3 flex items-start gap-3">
                        <div className="parchment-primary p-2 rounded-md">
                          <Crown size={14} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.3em] text-text-muted font-heading">
                            Sem juramento
                          </p>
                          <p className="text-xs text-text-secondary font-body mt-1">
                            Registre um lema para guiar sua jornada.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Preferências */}
              <div className="parchment-ultra rounded-2xl p-6 forge-border-accent animate-slide-in-up" style={{ animationDelay: '100ms' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="parchment-accent p-2 rounded-lg">
                    <Bell size={20} className="text-accent" />
                  </div>
                  <h2 className="text-xl font-bold text-text font-display">Preferências</h2>
                </div>

                <div className="space-y-4">
                  <div className="parchment-panel rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="parchment-primary p-2 rounded-lg">
                        <Bell size={18} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-text font-medium font-heading">Notificações</p>
                        <p className="text-text-muted text-xs font-body">Alertas ao completar fases</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.notificationsEnabled}
                      onChange={(e) =>
                        updateSettings({ notificationsEnabled: e.target.checked })
                      }
                    />
                  </div>

                  <div className="parchment-panel rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="parchment-success p-2 rounded-lg">
                        <Volume2 size={18} className="text-success" />
                      </div>
                      <div>
                        <p className="text-text font-medium font-heading">Efeitos Sonoros</p>
                        <p className="text-text-muted text-xs font-body">Sons ao completar fases</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.soundEnabled}
                      onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                    />
                  </div>

                  <div className="parchment-panel rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="parchment-warning p-2 rounded-lg">
                        <Zap size={18} className="text-warning" />
                      </div>
                      <div>
                        <p className="text-text font-medium font-heading">Modo de Performance</p>
                        <p className="text-text-muted text-xs font-body">Reduz animações e sombras pesadas</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.lowFx}
                      onChange={(e) => updateSettings({ lowFx: e.target.checked })}
                    />
                  </div>

                  {/* Zoom da Interface */}
                  <div className="parchment-panel rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="parchment-warning p-2 rounded-lg">
                          <ZoomIn size={18} className="text-warning" />
                        </div>
                        <div>
                          <p className="text-text font-medium font-heading">Zoom da Interface</p>
                          <p className="text-text-muted text-xs font-body">Ajuste o tamanho dos elementos</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-primary font-heading">{settings.uiZoom}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-muted font-body">80%</span>
                      <input
                        type="range"
                        min="80"
                        max="130"
                        step="10"
                        value={settings.uiZoom}
                        onChange={(e) => updateSettings({ uiZoom: parseInt(e.target.value, 10) })}
                        className="slider-medieval flex-1 h-2 rounded-full appearance-none cursor-pointer"
                      />
                      <span className="text-xs text-text-muted font-body">130%</span>
                    </div>
                    <div className="flex justify-center gap-2 mt-3">
                      {[80, 90, 100, 110, 120, 130].map((zoom) => (
                        <button
                          key={zoom}
                          onClick={() => updateSettings({ uiZoom: zoom })}
                          className={`px-2 py-1 rounded text-xs font-heading transition-all duration-200 ${
                            settings.uiZoom === zoom
                              ? 'parchment-primary forge-border-primary text-primary'
                              : 'parchment-panel text-text-muted hover:text-text'
                          }`}
                        >
                          {zoom}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Coluna direita - Card do Usuario */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-6">
                {/* Card Principal do Usuario */}
                <div className="parchment-ultra rounded-2xl overflow-hidden forge-border-primary shadow-torch-primary animate-slide-in-up">
                  {/* Header com gradiente */}
                  <div className="relative h-24 bg-gradient-to-br from-primary/30 via-accent/20 to-success/10">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                      <div className="parchment-ultra rounded-full p-2 forge-border-accent shadow-torch-accent">
                        <div className="w-20 h-20 rounded-full parchment-primary flex items-center justify-center text-5xl">
                          {avatar?.emoji || '&#129497;'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Conteudo do card */}
                  <div className="pt-14 pb-6 px-6 text-center">
                    <h3 className="text-xl font-bold text-text mb-1 font-display">
                      {profile?.username || 'Aventureiro'}
                    </h3>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Crown size={14} className="text-warning" />
                      <span className="text-primary font-medium text-sm font-heading">{title}</span>
                    </div>

                    {profile?.bio && (
                      <p className="text-text-secondary text-sm italic mb-4 parchment-panel rounded-lg p-3 font-body">
                        "{profile.bio}"
                      </p>
                    )}

                    {/* Stats rapidos */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="parchment-panel rounded-xl p-3">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Shield size={14} className="text-primary" />
                          <span className="text-xs text-text-muted font-heading">Nível</span>
                        </div>
                        <p className="text-2xl font-bold text-gilded-primary font-display">{level}</p>
                      </div>
                      <div className="parchment-panel rounded-xl p-3">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Sword size={14} className="text-accent" />
                          <span className="text-xs text-text-muted font-heading">XP Total</span>
                        </div>
                        <p className="text-2xl font-bold text-gilded-accent font-display">{totalXp}</p>
                      </div>
                    </div>

                    {/* Barra de XP */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-body">
                        <span className="text-text-muted">Progresso</span>
                        <span className="text-primary font-medium">{currentLevelXp}/100 XP</span>
                      </div>
                      <div className="relative h-3 parchment-panel rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-bronze to-primary transition-all duration-500 animate-xp-shimmer"
                          style={{
                            width: `${progressPercentage}%`,
                            boxShadow: 'inset 0 0 10px rgba(232, 220, 196, 0.3)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Sobre o App */}
                <div className="parchment-ultra rounded-2xl p-5 forge-border-primary animate-slide-in-up" style={{ animationDelay: '150ms' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Info size={16} className="text-primary" />
                    <h3 className="text-sm font-bold text-text font-display">Sobre o Aeon</h3>
                  </div>

                  <div className="space-y-3 text-sm font-body">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Versão</span>
                      <span className="text-text font-mono">1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Stack</span>
                      <span className="text-primary font-medium">React + Tauri</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Tema</span>
                      <span className="text-accent font-medium">Medieval Premium</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-primary/10">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-torch-flicker" />
                      <div className="w-2 h-2 rounded-full bg-accent" />
                      <div className="w-2 h-2 rounded-full bg-success" />
                    </div>
                  </div>
                </div>

                {/* Zona de Perigo */}
                <div className="parchment-ultra rounded-2xl p-5 forge-border-error animate-slide-in-up" style={{ animationDelay: '200ms' }}>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle size={16} className="text-error" />
                    <h3 className="text-sm font-bold text-error font-display">Zona de Perigo</h3>
                  </div>

                  <div className="parchment-panel rounded-xl p-4">
                    <p className="text-text font-medium mb-1 font-heading text-sm">Resetar Progresso</p>
                    <p className="text-text-muted text-xs font-body mb-3">
                      Apaga estatísticas, XP e conquistas.
                    </p>
                    <Button
                      onClick={() => setShowResetModal(true)}
                      variant="danger"
                      size="sm"
                      icon={<Trash2 size={14} />}
                      className="w-full justify-center"
                    >
                      Resetar Dados
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Modal de Confirmação de Reset */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Resetar Todos os Dados"
        size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <Button
              onClick={() => setShowResetModal(false)}
              variant="iron"
              disabled={isResetting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReset}
              variant="danger"
              icon={<Trash2 size={18} />}
              loading={isResetting}
            >
              Confirmar Reset
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 parchment-error forge-border-error rounded-xl">
            <AlertTriangle size={20} className="text-error flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-error font-semibold mb-1 font-heading">Esta ação é irreversível!</p>
              <p className="text-text-secondary text-sm font-body">
                Todos os seus dados serão permanentemente apagados.
              </p>
            </div>
          </div>

          <div className="parchment-panel rounded-xl p-4">
            <p className="text-text font-medium mb-3 font-heading">Será apagado:</p>
            <ul className="space-y-2 text-text-secondary text-sm font-body">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-error"></span>
                Todas as estatísticas e histórico
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-error"></span>
                Conquistas e selos de honra
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-error"></span>
                Progresso de XP e streaks
              </li>
            </ul>
          </div>

          <div className="p-4 parchment-success forge-border-success rounded-xl">
            <p className="text-text-secondary text-sm font-body">
              <span className="text-success font-medium">Os modos preset serão mantidos</span> e você poderá começar do zero.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
