import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { LogOut, User } from 'lucide-react';

export function UserMenu() {
  const { email, signOut } = useAuthStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-heading text-text-secondary hover:text-text hover:bg-surface transition-colors"
        title="Conta"
      >
        <User size={16} />
        <span className="truncate">{email}</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 bottom-full mb-2 w-56 parchment-panel rounded-xl forge-border-primary shadow-elevation-2 z-50 py-2">
            <div className="px-4 py-2 border-b border-primary/10">
              <p className="text-xs text-text-muted font-body">Logado como</p>
              <p className="text-sm font-heading text-text truncate">{email}</p>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                void signOut();
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-error/10 font-heading transition-colors"
            >
              <LogOut size={16} />
              Sair do Reino
            </button>
          </div>
        </>
      )}
    </div>
  );
}
