import { create } from 'zustand';
import type { UserProfile } from '@/domain/user/UserProfile';
import { getCurrentUserId, supaGetProfile, supaUpdateProfile } from '@/lib/supabaseStorage';

interface UserProfileStore {
  profile: UserProfile | null;
  loading: boolean;

  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
}

function mapProfile(data: Record<string, unknown>): UserProfile {
  return {
    id: 1,
    username: (data.username as string) || 'Aventureiro',
    avatarId: (data.avatar_id as string) || 'knight',
    bio: (data.bio as string) || null,
    displayTitle: (data.display_title as string) || null,
    createdAt: (data.created_at as string) || new Date().toISOString(),
    updatedAt: (data.updated_at as string) || new Date().toISOString(),
  };
}

export const useUserProfileStore = create<UserProfileStore>((set, get) => ({
  profile: null,
  loading: false,

  loadProfile: async () => {
    set({ loading: true });
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        set({ loading: false });
        return;
      }
      const data = await supaGetProfile(userId);
      const profile = mapProfile(data);
      set({ profile, loading: false });
    } catch (error) {
      console.error('Failed to load profile:', error);
      set({ loading: false });
    }
  },

  updateProfile: async (updates) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const current = get().profile;
      if (!current) return;

      const updated: UserProfile = {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await supaUpdateProfile(userId, {
        username: updates.username,
        avatar_id: updates.avatarId,
        bio: updates.bio,
        display_title: updates.displayTitle,
        updated_at: updated.updatedAt,
      });

      set({ profile: updated });
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  },
}));
