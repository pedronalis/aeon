/**
 * Sistema de Achievements do Pomodore
 * 30 conquistas divididas em categorias
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  lore: string; // Texto narrativo medieval
  category: 'beginner' | 'consistency' | 'quantity' | 'modes' | 'special' | 'tasks';
  xp: number;
  icon: string; // emoji
  unlocksTitle?: string; // Título customizado desbloqueado (opcional)
}

export const ACHIEVEMENTS: Achievement[] = [
  // Iniciante
  {
    id: 'first_focus',
    name: 'Iniciação na Ordem',
    description: 'Complete seu primeiro Ritual de Foco',
    lore: 'A jornada de mil léguas começa com um único passo. Você acendeu sua primeira vela na Câmara dos Iniciados. Bem-vindo à Ordem dos Foconeiros.',
    category: 'beginner',
    xp: 10,
    icon: '🕯️',
  },
  {
    id: 'five_focuses',
    name: 'Dedicação Diária',
    description: 'Complete 5 Rituais em um dia',
    lore: 'Sua determinação em um único dia impressiona os veteranos da Ordem. A Chama queima forte em você.',
    category: 'beginner',
    xp: 25,
    icon: '🔥',
  },

  // Consistência
  {
    id: 'streak_3',
    name: 'Guardião da Chama',
    description: 'Mantenha a Chama acesa por 3 dias',
    lore: 'A Chama nunca apagou por três dias. Você demonstra a disciplina necessária para proteger o reino.',
    category: 'consistency',
    xp: 30,
    icon: '🔥',
  },
  {
    id: 'streak_7',
    name: 'Protetor da Luz',
    description: 'Mantenha a Chama acesa por 7 dias',
    lore: 'Uma semana de dedicação ininterrupta. A Ordem reconhece sua perseverança como digna de um verdadeiro protetor.',
    category: 'consistency',
    xp: 50,
    icon: '⭐',
  },
  {
    id: 'streak_14',
    name: 'Vigilante da Chama',
    description: 'Mantenha a Chama acesa por 14 dias',
    lore: 'Duas semanas de disciplina impecável. A chama reconhece seu zelo constante.',
    category: 'consistency',
    xp: 80,
    icon: '🛡️',
  },
  {
    id: 'streak_30',
    name: 'Guardião da Chama Eterna',
    description: 'Mantenha a Chama acesa por 30 dias',
    lore: 'Poucos conseguem manter a Chama viva por tanto tempo. Você demonstrou dedicação digna dos Guardiões Ancestrais. A Ordem o reconhece como protetor da luz perpétua.',
    category: 'consistency',
    xp: 200,
    icon: '🔥',
    unlocksTitle: 'Guardião da Chama',
  },
  {
    id: 'streak_60',
    name: 'Juramento Inquebrável',
    description: 'Mantenha a Chama acesa por 60 dias',
    lore: 'Sessenta dias sem vacilo. Sua promessa é inquebrável e ecoa como lenda.',
    category: 'consistency',
    xp: 300,
    icon: '🏅',
    unlocksTitle: 'Inquebrável',
  },

  // Quantidades
  {
    id: 'total_25',
    name: 'Guerreiro em Treinamento',
    description: 'Complete 25 Rituais no total',
    lore: 'Vinte e cinco rituais completados. Você não é mais um novato. A espada do foco começa a se forjar em suas mãos.',
    category: 'quantity',
    xp: 50,
    icon: '⚔️',
  },
  {
    id: 'total_100',
    name: 'Veterano da Ordem',
    description: 'Complete 100 Rituais no total',
    lore: 'Cem rituais! Sua experiência é notável. Você conquistou respeito entre os membros da Ordem.',
    category: 'quantity',
    xp: 100,
    icon: '🛡️',
  },
  {
    id: 'total_250',
    name: 'Campeão da Ordem',
    description: 'Complete 250 Rituais no total',
    lore: 'Duzentos e cinquenta rituais. Sua dedicação transforma disciplina em legado.',
    category: 'quantity',
    xp: 150,
    icon: '🏆',
  },
  {
    id: 'total_500',
    name: 'Lenda Viva',
    description: 'Complete 500 Rituais no total',
    lore: 'Quinhentos rituais. Seu nome entrou para a história da Ordem. Bardos cantarão sobre sua dedicação por gerações.',
    category: 'quantity',
    xp: 250,
    icon: '👑',
    unlocksTitle: 'Lenda Viva',
  },
  {
    id: 'total_1000',
    name: 'Mito da Chama',
    description: 'Complete 1000 Rituais no total',
    lore: 'Mil rituais. Você já não é apenas história — é mito vivo da Ordem.',
    category: 'quantity',
    xp: 500,
    icon: '🌋',
    unlocksTitle: 'Mito da Chama',
  },

  // Modos
  {
    id: 'try_all_modes',
    name: 'Mestre Versátil',
    description: 'Domine todos os 4 estilos de combate',
    lore: 'Você explorou todas as técnicas ancestrais da Ordem. Sua versatilidade em diferentes estilos é admirável.',
    category: 'modes',
    xp: 30,
    icon: '🧭',
    unlocksTitle: 'Versátil',
  },
  {
    id: 'custom_mode',
    name: 'Criador de Caminhos',
    description: 'Crie seu próprio estilo de combate',
    lore: 'Você não seguiu apenas os ensinamentos antigos - criou seu próprio caminho. Verdadeira maestria.',
    category: 'modes',
    xp: 20,
    icon: '🎨',
  },
  {
    id: 'mode_loyalist',
    name: 'Leal ao Estilo',
    description: 'Complete 50 Rituais em um mesmo estilo',
    lore: 'A repetição lapida a técnica. Sua fidelidade a um estilo elevou sua maestria.',
    category: 'modes',
    xp: 60,
    icon: '🎯',
  },

  // Especiais
  {
    id: 'early_bird',
    name: 'Arauto da Aurora',
    description: 'Complete Ritual antes das 7h',
    lore: 'O amanhecer testemunha sua disciplina. Poucos guerreiros têm a força de acender a Chama quando o mundo ainda dorme.',
    category: 'special',
    xp: 40,
    icon: '🌅',
    unlocksTitle: 'Arauto da Aurora',
  },
  {
    id: 'night_owl',
    name: 'Sentinela Noturna',
    description: 'Complete Ritual depois das 23h',
    lore: 'A noite profunda não detém sua determinação. Você é um guardião que protege a Chama nas horas mais sombrias.',
    category: 'special',
    xp: 40,
    icon: '🌙',
    unlocksTitle: 'Sentinela Noturna',
  },
  {
    id: 'weekend_warrior',
    name: 'Guerreiro Incansável',
    description: 'Complete 3 Rituais no sábado ou domingo',
    lore: 'Mesmo nos dias de descanso, você treina. Sua dedicação não conhece pausas. A Ordem admira sua ética de trabalho.',
    category: 'special',
    xp: 35,
    icon: '⚔️',
    unlocksTitle: 'Incansável',
  },
  {
    id: 'daily_10',
    name: 'Maratona de Foco',
    description: 'Complete 10 Rituais em um dia',
    lore: 'Um dia inteiro de devoção. Sua determinação acende a Chama com vigor raro.',
    category: 'special',
    xp: 60,
    icon: '🧨',
  },
  {
    id: 'perfect_week',
    name: 'Mestre da Disciplina',
    description: 'Complete pelo menos 2 Rituais todos os dias da semana',
    lore: 'Uma semana perfeita. Disciplina digna de um mestre. Você demonstrou que a consistência é a verdadeira força.',
    category: 'special',
    xp: 100,
    icon: '🌟',
    unlocksTitle: 'Mestre da Disciplina',
  },
  {
    id: 'export_data',
    name: 'Cronista da Ordem',
    description: 'Exporte seus registros pela primeira vez',
    lore: 'Você documenta sua jornada para as futuras gerações. Todo grande guerreiro mantém registros de suas batalhas.',
    category: 'special',
    xp: 15,
    icon: '📜',
  },

  // Tarefas (Pergaminhos)
  {
    id: 'first_task',
    name: 'Primeiro Pergaminho',
    description: 'Complete sua primeira tarefa',
    lore: 'Você selou seu primeiro pergaminho com sucesso. A tinta de suas conquistas começa a marcar a história.',
    category: 'tasks',
    xp: 10,
    icon: '📜',
  },
  {
    id: 'task_total_25',
    name: 'Arquivista',
    description: 'Complete 25 tarefas',
    lore: 'Vinte e cinco pergaminhos selados. Seus registros são dignos da biblioteca da Ordem.',
    category: 'tasks',
    xp: 40,
    icon: '🗂️',
  },
  {
    id: 'task_total_100',
    name: 'Mestre dos Pergaminhos',
    description: 'Complete 100 tarefas',
    lore: 'Cem pergaminhos cumpridos. Sua obra é vasta e respeitada.',
    category: 'tasks',
    xp: 120,
    icon: '📚',
    unlocksTitle: 'Mestre dos Pergaminhos',
  },
  {
    id: 'task_streak_5',
    name: 'Escriba Dedicado',
    description: 'Complete 5 tarefas sem atraso',
    lore: 'Cinco pergaminhos completados no prazo. Sua disciplina como escriba do reino é notável.',
    category: 'tasks',
    xp: 30,
    icon: '✍️',
    unlocksTitle: 'Escriba',
  },
  {
    id: 'task_streak_10',
    name: 'Escriba Implacável',
    description: 'Complete 10 tarefas sem atraso',
    lore: 'Dez pergaminhos sem falhas. Sua pontualidade se tornou lenda.',
    category: 'tasks',
    xp: 60,
    icon: '🪶',
    unlocksTitle: 'Implacável',
  },
  {
    id: 'task_early',
    name: 'Pontualidade Real',
    description: 'Complete 3 tarefas antes do prazo',
    lore: 'A antecipação é a marca dos grandes estrategistas. Você domina o tempo como poucos.',
    category: 'tasks',
    xp: 40,
    icon: '⏰',
  },
  {
    id: 'task_epic',
    name: 'Caçador de Épicos',
    description: 'Complete 10 tarefas épicas',
    lore: 'Dez pergaminhos épicos selados! Você é um verdadeiro caçador de desafios grandiosos.',
    category: 'tasks',
    xp: 50,
    icon: '👑',
    unlocksTitle: 'Caçador de Épicos',
  },
  {
    id: 'task_linked',
    name: 'Foco Direcionado',
    description: 'Vincule 10 pomodoros a uma única tarefa',
    lore: 'Dez rituais dedicados a um único pergaminho. Sua concentração é inabalável.',
    category: 'tasks',
    xp: 25,
    icon: '🎯',
  },
  {
    id: 'task_linked_25',
    name: 'Foco Consagrado',
    description: 'Vincule 25 pomodoros a uma única tarefa',
    lore: 'Vinte e cinco rituais em um único pergaminho. Sua devoção é absoluta.',
    category: 'tasks',
    xp: 60,
    icon: '🏹',
  },
];

/**
 * Encontra achievement por ID
 */
export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/**
 * Calcula nível baseado em XP total
 * Nível = floor(XP / 100) + 1
 */
export function calculateLevel(totalXp: number): number {
  return Math.floor(totalXp / 100) + 1;
}

/**
 * Calcula XP necessário para próximo nível
 */
export function xpForNextLevel(totalXp: number): number {
  const currentLevel = calculateLevel(totalXp);
  const nextLevelXp = currentLevel * 100;
  return nextLevelXp - totalXp;
}
