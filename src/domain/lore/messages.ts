import type { TimerState } from '../timer/types';

/**
 * Sistema de Lore - Mensagens contextuais baseadas em estado
 *
 * Lore do Mundo:
 * Em tempos antigos, quando a Era da Distração ameaçava consumir o reino,
 * um grupo de sábios fundou a Ordem dos Foconeiros - guerreiros dedicados
 * à arte da concentração. Armados com a Chama do Foco, eles protegem a
 * mente contra as forças do Caos e da Dispersão.
 */

export const GUILD_LORE = {
  welcome: `Em tempos antigos, quando a Era da Distração ameaçava
consumir o reino, um grupo de sábios fundou a Ordem dos
Foconeiros - guerreiros dedicados à arte da concentração.

Armados com a Chama do Foco, eles protegem a mente contra
as forças do Caos e da Dispersão. Cada sessão completada
alimenta a Chama Eterna no coração da Guilda.

Você é um iniciado desta ordem ancestral. Sua jornada
começa agora...`,

  purpose: 'Alimentar a Chama Eterna e proteger o reino da Era da Distração',
};

/**
 * Retorna mensagem contextual para o Dashboard baseado no estado
 */
export function getDashboardMessage(
  state: TimerState,
  streak: number,
  username: string,
  lastXpGained?: number
): string {
  // Após completar foco
  if (state === 'FINISHED' && lastXpGained !== undefined) {
    const streakBonus = streak >= 7
      ? ' A Ordem te observa com admiração.'
      : streak >= 3
      ? ' Continue assim, guerreiro.'
      : '';
    return `Ritual consumado. A Chama brilha mais forte. +${lastXpGained} XP.${streakBonus}`;
  }

  // Durante foco
  if (state === 'RUNNING') {
    if (streak >= 7) {
      return `A Chama arde intensamente, ${username}. Sua dedicação honra a Ordem.`;
    } else if (streak >= 3) {
      return `Continue alimentando a Chama, ${username}. Você está no caminho certo.`;
    }
    return `A Chama do Foco queima. Mantenha sua concentração, ${username}.`;
  }

  // Durante break
  if (state === 'FINISHED') {
    return 'Descanse, guerreiro. Até os maiores precisam de pausa.';
  }

  // Pausado
  if (state === 'PAUSED') {
    return 'O ritual foi suspenso. Retorne quando estiver pronto.';
  }

  // IDLE - sem streak
  if (streak === 0) {
    return 'A Chama aguarda. Inicie seu Ritual de Foco.';
  }

  // IDLE - com streak
  if (streak >= 7) {
    return `Impressionante dedicação, ${username}. A Ordem te observa.`;
  } else if (streak >= 3) {
    return `A Chama queima forte, ${username}. Continue alimentando-a.`;
  }

  return 'Pronto para mais um ritual? A Chama te aguarda.';
}

/**
 * Retorna mensagem para quando completar um achievement
 */
export function getAchievementFlavorText(achievementId: string): string {
  const flavors: Record<string, string> = {
    first_focus: 'Você acendeu sua primeira vela na Câmara dos Iniciados.',
    five_focuses: 'Sua determinação em um único dia impressiona os veteranos.',
    streak_3: 'A Chama nunca apagou por três dias. Continue assim.',
    streak_7: 'Uma semana de dedicação. A Ordem reconhece sua perseverança.',
    streak_14: 'Duas semanas de disciplina. Você vigia a Chama com honra.',
    streak_30: 'Poucos conseguem manter a Chama viva por tanto tempo.',
    streak_60: 'Sessenta dias de voto inquebrável. Sua lenda cresce.',
    total_25: 'Vinte e cinco rituais completados. Você não é mais um novato.',
    total_100: 'Cem rituais! Sua experiência é notável.',
    total_250: 'Duzentos e cinquenta rituais. Sua dedicação virou legado.',
    total_500: 'Quinhentos rituais. Você entrou para a história da Ordem.',
    total_1000: 'Mil rituais. Você é mito vivo da Chama.',
    try_all_modes: 'Sua versatilidade em diferentes técnicas é admirável.',
    custom_mode: 'Você criou seu próprio caminho. Verdadeira maestria.',
    mode_loyalist: 'Sua lealdade a um estilo moldou verdadeira maestria.',
    early_bird: 'O amanhecer testemunha sua disciplina.',
    night_owl: 'A noite profunda não detém sua determinação.',
    weekend_warrior: 'Mesmo nos dias de descanso, você treina.',
    daily_10: 'Um dia de maratona. A Chama brilhou sem descanso.',
    perfect_week: 'Uma semana perfeita. Disciplina digna de um mestre.',
    first_task: 'Seu primeiro pergaminho foi selado. A tinta da Ordem marca seu nome.',
    task_total_25: 'Vinte e cinco pergaminhos selados. Sua escrita já é respeitada.',
    task_total_100: 'Cem pergaminhos cumpridos. Você domina a arte do registro.',
    task_streak_5: 'Cinco pergaminhos no prazo. Disciplina digna de um escriba.',
    task_streak_10: 'Dez pergaminhos no prazo. Pontualidade digna da Ordem.',
    task_early: 'Você antecipa o destino. A Ordem aprecia sua prontidão.',
    task_epic: 'Dez épicos selados. Você caçou desafios grandiosos.',
    task_linked: 'Dez rituais num único pergaminho. Foco inabalável.',
    task_linked_25: 'Vinte e cinco rituais em um único pergaminho. Devoção absoluta.',
  };

  return flavors[achievementId] || 'A Ordem reconhece sua conquista.';
}

/**
 * Retorna mensagem para timer controls baseada no estado
 */
export function getControlMessage(action: 'start' | 'pause' | 'skip' | 'reset'): string {
  const messages = {
    start: 'Acender a Chama',
    pause: 'Pausar Ritual',
    skip: 'Avançar Fase',
    reset: 'Extinguir Chama',
  };

  return messages[action];
}

/**
 * Retorna tooltip temático para ação
 */
export function getControlTooltip(action: 'start' | 'pause' | 'skip' | 'reset'): string {
  const tooltips = {
    start: 'Inicie seu Ritual de Foco',
    pause: 'Suspenda temporariamente o ritual',
    skip: 'Pule para a próxima etapa do ritual',
    reset: 'Reinicie o ritual do início',
  };

  return tooltips[action];
}
