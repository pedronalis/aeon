import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Input } from '@/components/shared/Input';
import { Button } from '@/components/shared/Button';
import { Flame, Mail, Lock, Sword, Shield, Scroll, AlertTriangle } from 'lucide-react';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const auth = useAuthStore();
  const isDisabled = auth.loading || auth.isConfigError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      await auth.signIn(email, password);
    } else {
      await auth.signUp(email, password, username || undefined);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="parchment-panel rounded-2xl forge-border-primary p-8 shadow-elevation-2">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full parchment-primary forge-border-primary mb-4">
              <Flame size={32} className="text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-gilded-primary font-display">
              {isLogin ? 'Entrar no Reino' : 'Forjar Conta'}
            </h1>
            <p className="text-text-secondary font-body mt-2">
              {isLogin
                ? 'Apresente suas credenciais, cavaleiro.'
                : 'Crie sua conta para juntar-se ao Reino.'}
            </p>
          </div>

          {auth.isConfigError && (
            <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/30 text-error text-sm font-body flex items-start gap-3">
              <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">O Reino está fechado</p>
                <p>
                  {auth.error ?? 'O servidor de autenticação não está configurado. Entre em contato com o administrador do Reino.'}
                </p>
              </div>
            </div>
          )}

          {!auth.isConfigError && auth.error && (
            <div className="mb-6 p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm font-body flex items-center gap-2">
              <AlertTriangle size={16} />
              {auth.error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <Input
                label="Nome do Cavaleiro"
                placeholder="Como deseja ser chamado?"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                leftIcon={<Sword size={18} className="text-text-secondary" />}
                disabled={isDisabled}
              />
            )}

            <Input
              label="E-mail"
              type="email"
              placeholder="seu.nome@reino.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail size={18} className="text-text-secondary" />}
              disabled={isDisabled}
            />

            <Input
              label="Senha Secreta"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={<Lock size={18} className="text-text-secondary" />}
              helperText={!isLogin ? 'Mínimo 6 caracteres' : undefined}
              disabled={isDisabled}
            />

            <Button
              type="submit"
              variant="royal"
              size="lg"
              fullWidth
              loading={auth.loading}
              disabled={isDisabled}
              icon={isLogin ? <Shield size={18} /> : <Scroll size={18} />}
            >
              {isLogin ? 'Entrar no Reino' : 'Forjar Conta'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                auth.clearError();
              }}
              className="text-sm text-primary hover:text-primary-light font-heading transition-colors"
            >
              {isLogin
                ? 'Nao possui uma conta? Forje agora'
                : 'Ja possui uma conta? Entre agora'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
