/**
 * Utilitários de data para cálculo de streaks e estatísticas
 */

/**
 * Formata Date para string "YYYY-MM-DD"
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Verifica se duas datas são do mesmo dia
 */
export function isSameDay(a: Date, b: Date): boolean {
  return formatDate(a) === formatDate(b);
}

/**
 * Verifica se data B é o dia seguinte de data A
 */
export function isNextDay(a: Date, b: Date): boolean {
  const nextDay = new Date(a);
  nextDay.setDate(nextDay.getDate() + 1);
  return isSameDay(nextDay, b);
}

/**
 * Retorna início e fim da semana para uma data
 */
export function getWeekRange(date: Date): [Date, Date] {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para segunda-feira
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return [start, end];
}

/**
 * Retorna array com os últimos N dias (incluindo hoje)
 */
export function getLastNDays(n: number): Date[] {
  const days: Date[] = [];
  const today = new Date();

  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    date.setHours(0, 0, 0, 0);
    days.push(date);
  }

  return days;
}

/**
 * Parse string "YYYY-MM-DD" para Date
 */
export function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Calcula streak (dias consecutivos) baseado em array de datas
 * Retorna streak atual (considerando hoje) e melhor streak histórico
 */
export function calculateStreaks(dates: string[]): {
  current: number;
  best: number;
} {
  if (dates.length === 0) {
    return { current: 0, best: 0 };
  }

  // Ordenar datas em ordem decrescente (mais recente primeiro)
  const sortedDates = [...dates].sort((a, b) => b.localeCompare(a));

  const today = formatDate(new Date());
  const yesterday = formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

  // Verificar se hoje ou ontem está no array para streak atual
  const hasToday = sortedDates.includes(today);
  const hasYesterday = sortedDates.includes(yesterday);

  let currentStreak = 0;

  // Apenas contar streak atual se hoje ou ontem tem atividade
  if (hasToday || hasYesterday) {
    let checkDate = hasToday ? today : yesterday;

    for (const date of sortedDates) {
      if (date === checkDate) {
        currentStreak++;
        // Mover para o dia anterior
        const prevDate = new Date(parseDate(checkDate));
        prevDate.setDate(prevDate.getDate() - 1);
        checkDate = formatDate(prevDate);
      } else if (date < checkDate) {
        // Há um gap, streak quebrado
        break;
      }
    }
  }

  // Calcular melhor streak histórico
  let bestStreak = 0;
  let tempStreak = 0;
  let expectedDate: string | null = null;

  for (const date of sortedDates) {
    if (expectedDate === null || date === expectedDate) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);

      // Calcular próxima data esperada (dia anterior)
      const prevDate = new Date(parseDate(date));
      prevDate.setDate(prevDate.getDate() - 1);
      expectedDate = formatDate(prevDate);
    } else {
      // Gap encontrado, reiniciar streak temporário
      tempStreak = 1;
      const prevDate = new Date(parseDate(date));
      prevDate.setDate(prevDate.getDate() - 1);
      expectedDate = formatDate(prevDate);
    }
  }

  return {
    current: currentStreak,
    best: bestStreak,
  };
}

/**
 * Formata tempo em segundos para formato MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Formata tempo em minutos para formato legível
 * Ex: 125 -> "2h 5min"
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}
