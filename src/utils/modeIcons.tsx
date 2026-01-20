import { Timer, Zap, Film, BookOpen, Settings } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Mapeia IDs de modos para seus respectivos ícones do lucide-react
 */
export function getModeIcon(modeId: string, size: number = 24): ReactNode {
  const iconMap: Record<string, ReactNode> = {
    traditional: <Timer size={size} />,
    sustainable: <Zap size={size} />,
    animedoro: <Film size={size} />,
    mangadoro: <BookOpen size={size} />,
  };

  // Retorna ícone customizado para modos personalizados
  if (modeId.startsWith('custom_')) {
    return <Settings size={size} />;
  }

  return iconMap[modeId] || <Timer size={size} />;
}

/**
 * Retorna a cor hex para cada modo (baseado no accentColor do preset)
 */
export function getModeColor(modeId: string): string {
  const colorMap: Record<string, string> = {
    traditional: '#c9a227', // Ouro medieval
    sustainable: '#2d6a4f', // Esmeralda
    animedoro: '#722f37',   // Vinho
    mangadoro: '#c77c0e',   // Âmbar
  };

  // Cor padrão para modos customizados
  if (modeId.startsWith('custom_')) {
    return '#b5a68a';
  }

  return colorMap[modeId] || '#c9a227';
}
