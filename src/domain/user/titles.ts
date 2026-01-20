export function getTitleForLevel(level: number): string {
  if (level >= 100) return 'Imortal';
  if (level >= 75) return 'Guardião Ancestral';
  if (level >= 50) return 'Lenda';
  if (level >= 40) return 'Grão-Mestre';
  if (level >= 30) return 'Lorde';
  if (level >= 20) return 'Campeão';
  if (level >= 15) return 'Cavaleiro Veterano';
  if (level >= 10) return 'Cavaleiro';
  if (level >= 5) return 'Escudeiro';
  if (level >= 2) return 'Aprendiz';
  return 'Novato';
}

// Retorna string formatada: "Nível X - Título"
export function getFullTitle(level: number): string {
  const title = getTitleForLevel(level);
  return `Nível ${level} - ${title}`;
}
