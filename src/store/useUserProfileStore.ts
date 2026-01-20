import { create } from 'zustand';
import Database from '@tauri-apps/plugin-sql';
import type { UserProfile, UserProfileRow } from '@/domain/user/UserProfile';
import { userProfileFromRow } from '@/domain/user/UserProfile';

interface UserProfileStore {
  profile: UserProfile | null;
  loading: boolean;
  db: Database | null;

  // Actions
  initDb: () => Promise<void>;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
}

export const useUserProfileStore = create<UserProfileStore>((set, get) => ({
  profile: null,
  loading: false,
  db: null,

  initDb: async () => {
    if (get().db) return;
    try {
      const db = await Database.load('sqlite:pomodore.db');
      set({ db });
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  },

  loadProfile: async () => {
    set({ loading: true });
    try {
      await get().initDb();
      const db = get().db;
      if (!db) {
        set({ loading: false });
        return; // Não conseguiu conectar
      }

      const rows = await db.select<UserProfileRow[]>(
        'SELECT * FROM user_profile WHERE id = 1'
      );

      if (rows.length > 0) {
        const profile = userProfileFromRow(rows[0]);
        set({ profile, loading: false });
      } else {
        // Criar perfil padrão se não existir
        await db.execute(`
          INSERT INTO user_profile (id, username, avatar_id, created_at, updated_at)
          VALUES (1, 'Aventureiro', 'knight', datetime('now'), datetime('now'))
        `);
        // Recarregar perfil diretamente sem chamar loadProfile recursivamente
        const newRows = await db.select<UserProfileRow[]>(
          'SELECT * FROM user_profile WHERE id = 1'
        );
        if (newRows.length > 0) {
          const profile = userProfileFromRow(newRows[0]);
          set({ profile, loading: false });
        } else {
          set({ loading: false });
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      set({ loading: false });
    }
  },

  updateProfile: async (updates) => {
    try {
      await get().initDb();
      const db = get().db;
      if (!db) return;
      const current = get().profile;
      if (!current) return;

      // Usar valores atuais como fallback
      const username = updates.username !== undefined ? updates.username : current.username;
      const avatarId = updates.avatarId !== undefined ? updates.avatarId : current.avatarId;
      const bio = updates.bio !== undefined ? updates.bio : current.bio;
      const displayTitle = updates.displayTitle !== undefined ? updates.displayTitle : current.displayTitle;

      await db.execute(
        'UPDATE user_profile SET username = $1, avatar_id = $2, bio = $3, display_title = $4, updated_at = datetime(\'now\') WHERE id = 1',
        [username, avatarId, bio, displayTitle]
      );

      // Recarregar perfil
      await get().loadProfile();
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  },
}));
