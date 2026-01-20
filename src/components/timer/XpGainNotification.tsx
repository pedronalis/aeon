import { useEffect, useState } from 'react';
import { useStatsStore } from '@/store/useStatsStore';
import { Sparkles } from 'lucide-react';

export function XpGainNotification() {
  const [showGain, setShowGain] = useState(false);
  const [lastXp, setLastXp] = useState(0);
  const [xpGained, setXpGained] = useState(0);
  const { progress } = useStatsStore();

  useEffect(() => {
    if (progress.totalXp > lastXp && lastXp > 0) {
      const gained = progress.totalXp - lastXp;
      setXpGained(gained);
      setShowGain(true);

      // Animar saida apos 3 segundos
      setTimeout(() => setShowGain(false), 3000);
    }
    setLastXp(progress.totalXp);
  }, [progress.totalXp, lastXp]);

  if (!showGain) return null;

  return (
    <div className="fixed top-24 right-4 z-50 animate-slide-in-right">
      <div className="parchment-primary forge-border-primary rounded-lg px-4 py-3 shadow-torch-primary">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-primary animate-gold-breathe" />
          <span className="text-lg font-bold text-primary font-heading">
            +{xpGained} XP
          </span>
        </div>
      </div>
    </div>
  );
}
