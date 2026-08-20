import { Sparkles } from 'lucide-react';

interface FuelScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function FuelScoreBadge({ score, size = 'md' }: FuelScoreBadgeProps) {
  const isLarge = size === 'lg';

  return (
    <div
      className={`inline-flex items-center gap-2.5 rounded-2xl border border-stone-800 bg-[var(--gd-charcoal)] text-white shadow-sm ${
        isLarge ? 'px-4 py-2.5' : 'px-3.5 py-1.5'
      }`}
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400">
        <Sparkles size={16} />
      </div>
      <div>
        <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-stone-400">Fuel Score</p>
        <p className={`font-display font-bold leading-none text-white ${isLarge ? 'text-lg' : 'text-sm'}`}>
          {score} <span className="text-xs font-normal text-stone-400">/ 100</span>
        </p>
      </div>
    </div>
  );
}
