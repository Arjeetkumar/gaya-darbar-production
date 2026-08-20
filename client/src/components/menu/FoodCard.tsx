import type { MenuItem } from '../../types/menu';
import DietaryBadge from './DietaryBadge';
import { Clock, Plus, Sparkles } from 'lucide-react';

interface FoodCardProps {
  item: MenuItem;
  onSelect?: (item: MenuItem) => void;
  onAddToCart?: (item: MenuItem) => void;
}

const goalLabels: Record<string, string> = {
  muscleGain: 'Build Muscle',
  fatLoss: 'Fat Loss',
  performance: 'Performance',
  eatClean: 'Eat Clean',
};

export default function FoodCard({ item, onSelect, onAddToCart }: FoodCardProps) {
  const primaryGoal = item.fitnessGoals[0] ? goalLabels[item.fitnessGoals[0]] : null;

  return (
    <article
      onClick={() => onSelect?.(item)}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--gd-border)] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[var(--gd-forest)]/40 hover:shadow-xl"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Top Badges overlay */}
        <div className="absolute left-3 top-3 right-3 flex items-center justify-between gap-2">
          <DietaryBadge preference={item.dietaryPreference} />

          {/* Fuel Score Badge */}
          <div className="flex items-center gap-1 rounded-full bg-[var(--gd-charcoal)]/90 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
            <Sparkles size={11} className="text-amber-400" />
            <span>Fuel {item.fuelScore}</span>
          </div>
        </div>

        {/* Bottom image overlay: prep time & primary goal tag */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white">
          <div className="flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-0.5 backdrop-blur-sm">
            <Clock size={12} className="text-white/80" />
            <span>{item.preparationTime} min</span>
          </div>

          {primaryGoal && (
            <span className="rounded-full bg-[var(--gd-forest)]/90 px-2.5 py-0.5 font-semibold text-white backdrop-blur-sm">
              {primaryGoal}
            </span>
          )}
        </div>
      </div>

      {/* Content Container */}
      <div className="flex flex-1 flex-col p-5">
        {/* Title and Price */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold leading-tight text-[var(--gd-charcoal)] group-hover:text-[var(--gd-forest)] transition-colors">
            {item.name}
          </h3>
          <span className="shrink-0 font-display text-lg font-bold text-[var(--gd-charcoal)]">
            ₹{item.price}
          </span>
        </div>

        {/* Description */}
        <p className="mt-2 text-xs leading-relaxed text-[var(--gd-muted)] line-clamp-2">
          {item.description}
        </p>

        {/* Macros Breakdown Bar */}
        <div className="mt-4 rounded-xl border border-[var(--gd-border)] bg-[var(--gd-ivory)] p-3">
          <div className="grid grid-cols-4 gap-1 text-center text-xs">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--gd-muted)]">Protein</p>
              <p className="font-bold text-[var(--gd-forest)]">{item.macros.protein}g</p>
            </div>
            <div className="border-l border-[var(--gd-border)]">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--gd-muted)]">Carbs</p>
              <p className="font-semibold text-[var(--gd-charcoal)]">{item.macros.carbs}g</p>
            </div>
            <div className="border-l border-[var(--gd-border)]">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--gd-muted)]">Fats</p>
              <p className="font-semibold text-[var(--gd-charcoal)]">{item.macros.fats}g</p>
            </div>
            <div className="border-l border-[var(--gd-border)]">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--gd-muted)]">Energy</p>
              <p className="font-semibold text-[var(--gd-charcoal)]">{item.macros.calories}</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-auto pt-5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onAddToCart) {
                onAddToCart(item);
              } else if (onSelect) {
                onSelect(item);
              }
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gd-charcoal)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all duration-300 hover:bg-[var(--gd-forest)] hover:shadow-md active:scale-[0.98]"
            aria-label={`View or add ${item.name} to fuel bag`}
          >
            <Plus size={15} />
            <span>Add to Fuel Bag</span>
          </button>
        </div>
      </div>
    </article>
  );
}
