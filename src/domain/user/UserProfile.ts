export interface UserProfile {
  id: number;
  username: string;
  avatarId: string;
  bio: string | null;
  displayTitle: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileRow {
  id: number;
  username: string;
  avatar_id: string;
  bio: string | null;
  display_title: string | null;
  created_at: string;
  updated_at: string;
}

export function userProfileFromRow(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    username: row.username,
    avatarId: row.avatar_id,
    bio: row.bio,
    displayTitle: row.display_title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
