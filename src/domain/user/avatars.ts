export interface Avatar {
  id: string;
  name: string;
  emoji: string;
  category: 'warrior' | 'mage' | 'rogue' | 'support' | 'special';
}

export const AVATARS: Avatar[] = [
  // Warriors
  { id: 'knight', name: 'Cavaleiro', emoji: '⚔️', category: 'warrior' },
  { id: 'paladin', name: 'Paladino', emoji: '🛡️', category: 'warrior' },
  { id: 'viking', name: 'Viking', emoji: '🪓', category: 'warrior' },
  { id: 'gladiator', name: 'Gladiador', emoji: '🔱', category: 'warrior' },
  { id: 'barbarian', name: 'Bárbaro', emoji: '💪', category: 'warrior' },

  // Mages
  { id: 'wizard', name: 'Mago', emoji: '🧙', category: 'mage' },
  { id: 'alchemist', name: 'Alquimista', emoji: '⚗️', category: 'mage' },
  { id: 'oracle', name: 'Oráculo', emoji: '🔮', category: 'mage' },
  { id: 'fairy', name: 'Fada', emoji: '🧚', category: 'mage' },
  { id: 'genie', name: 'Gênio', emoji: '🧞', category: 'mage' },

  // Rogues
  { id: 'assassin', name: 'Assassino', emoji: '🗡️', category: 'rogue' },
  { id: 'archer', name: 'Arqueiro', emoji: '🏹', category: 'rogue' },
  { id: 'bard', name: 'Bardo', emoji: '🎭', category: 'rogue' },
  { id: 'ninja', name: 'Ninja', emoji: '🥷', category: 'rogue' },
  { id: 'thief', name: 'Ladrão', emoji: '🦝', category: 'rogue' },

  // Support
  { id: 'scribe', name: 'Escriba', emoji: '📜', category: 'support' },
  { id: 'elf', name: 'Elfo', emoji: '🧝', category: 'support' },
  { id: 'king', name: 'Monarca', emoji: '👑', category: 'support' },
  { id: 'cleric', name: 'Clérigo', emoji: '✨', category: 'support' },
  { id: 'dwarf', name: 'Anão', emoji: '⛏️', category: 'support' },

  // Special - Criaturas
  { id: 'dragon', name: 'Dragão', emoji: '🐉', category: 'special' },
  { id: 'vampire', name: 'Vampiro', emoji: '🧛', category: 'special' },
  { id: 'wolf', name: 'Lobo', emoji: '🐺', category: 'special' },
  { id: 'zombie', name: 'Zumbi', emoji: '🧟', category: 'special' },
  { id: 'orc', name: 'Orc', emoji: '👹', category: 'special' },
  { id: 'troll', name: 'Troll', emoji: '👺', category: 'special' },
  { id: 'ghost', name: 'Fantasma', emoji: '👻', category: 'special' },
  { id: 'skull', name: 'Caveira', emoji: '💀', category: 'special' },
  { id: 'phoenix', name: 'Fênix', emoji: '🔥', category: 'special' },
  { id: 'unicorn', name: 'Unicórnio', emoji: '🦄', category: 'special' },
  { id: 'owl', name: 'Coruja', emoji: '🦉', category: 'special' },
  { id: 'raven', name: 'Corvo', emoji: '🐦‍⬛', category: 'special' },
  { id: 'bat', name: 'Morcego', emoji: '🦇', category: 'special' },
  { id: 'spider', name: 'Aranha', emoji: '🕷️', category: 'special' },
  { id: 'snake', name: 'Serpente', emoji: '🐍', category: 'special' },
  { id: 'castle', name: 'Castelo', emoji: '🏰', category: 'special' },
];

export function getAvatarById(id: string): Avatar | null {
  return AVATARS.find(avatar => avatar.id === id) || null;
}

export function getAvatarsByCategory(category: Avatar['category']): Avatar[] {
  return AVATARS.filter(avatar => avatar.category === category);
}

// Alias para compatibilidade
export const MEDIEVAL_AVATARS = AVATARS;
