import type { DietaryPreference } from '../../types/menu';
import { Filter } from 'lucide-react';

interface DietarySelectorProps {
  selectedDiet: DietaryPreference | 'all';
  onSelectDiet: (diet: DietaryPreference | 'all') => void;
}

const DIET_OPTIONS: { id: DietaryPreference | 'all'; label: string }[] = [
  { id: 'all', label: 'All Ingredients' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'nonVegetarian', label: 'Non-Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'eggitarian', label: 'Eggitarian' },
];

export default function DietarySelector({
  selectedDiet,
  onSelectDiet,
}: DietarySelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gd-muted)] mr-1">
        <Filter size={12} className="text-[var(--gd-forest)]" />
        <span>Target Diet:</span>
      </span>

      {DIET_OPTIONS.map((diet) => {
        const isSelected = selectedDiet === diet.id;
        return (
          <button
            key={diet.id}
            type="button"
            onClick={() => onSelectDiet(diet.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              isSelected
                ? 'bg-[var(--gd-forest)] text-white shadow-sm'
                : 'bg-white border border-[var(--gd-border)] text-[var(--gd-charcoal)] hover:bg-stone-100'
            }`}
            aria-pressed={isSelected}
          >
            {diet.label}
          </button>
        );
      })}
    </div>
  );
}
