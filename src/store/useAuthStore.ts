import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface AuthStore {
  userId: string | null;
  email: string | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, username?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  userId: null,
  email: null,
  loading: true,
  initialized: false,
  error: null,

  initialize: async () => {
    set({ loading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({
        userId: session?.user?.id ?? null,
        email: session?.user?.email ?? null,
        loading: false,
        initialized: true,
      });

      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          userId: session?.user?.id ?? null,
          email: session?.user?.email ?? null,
        });
      });
    } catch {
      set({ loading: false, initialized: true });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    set({ loading: false });
    if (error) {
      set({ error: error.message });
      return { error: error.message };
    }
    set({ userId: data.user?.id ?? null, email: data.user?.email ?? null });
    return {};
  },

  signUp: async (email, password, username) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: username || 'Aventureiro' } },
    });
    set({ loading: false });
    if (error) {
      set({ error: error.message });
      return { error: error.message };
    }
    set({ userId: data.user?.id ?? null, email: data.user?.email ?? null });
    return {};
  },

  signOut: async () => {
    set({ loading: true });
    await supabase.auth.signOut();
    set({ userId: null, email: null, loading: false });
  },

  clearError: () => set({ error: null }),
}));
