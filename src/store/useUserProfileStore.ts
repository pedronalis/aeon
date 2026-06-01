import { create } from 'zustand';
import type { UserProfile } from '@/domain/user/UserProfile';
import { dbGet, dbSet, DB_KEYS } from '@/lib/storage';

interface UserProfileStore {
  profile: UserProfile | null;
  loading: boolean;

  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
}

export const useUserProfileStore = create<UserProfileStore>((set, get) => ({
  profile: null,
  loading: false,

  loadProfile: async () => {
    set({ loading: true });
    try {
      const profile = await dbGet<UserProfile>(DB_KEYS.userProfile);
      if (profile) {
        set({ profile, loading: false });
      } else {
        // Perfil padrão
        const newProfile: UserProfile = {
          id: 1,
          username: 'Aventureiro',
          avatarId: 'knight',
          bio: '',
          displayTitle: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await dbSet(DB_KEYS.userProfile, newProfile);
        set({ profile: newProfile, loading: false });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      set({ loading: false });
    }
  },

  updateProfile: async (updates) => {
    try {
      const current = get().profile ?? await dbGet<UserProfile>(DB_KEYS.userProfile);
      if (!current) return;

      const updated: UserProfile = {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await dbSet(DB_KEYS.userProfile, updated);
      set({ profile: updated });
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  },
}));
