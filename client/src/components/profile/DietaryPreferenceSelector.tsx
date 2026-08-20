import type { DietaryPreference } from '../../types/menu';

interface DietaryPreferenceSelectorProps {
  selectedDiet: DietaryPreference;
  onSelectDiet: (diet: DietaryPreference) => void;
}

const DIETS: { id: DietaryPreference; label: string; description: string }[] = [
  { id: 'vegetarian', label: 'Vegetarian', description: 'Plant-based with dairy inclusion.' },
  { id: 'nonVegetarian', label: 'Non-Vegetarian', description: 'Includes lean meats, chicken, and seafood.' },
  { id: 'vegan', label: 'Vegan', description: '100% plant-based food with zero animal products.' },
  { id: 'eggitarian', label: 'Eggitarian', description: 'Vegetarian meals plus farm eggs.' },
];

export default function DietaryPreferenceSelector({
  selectedDiet,
  onSelectDiet,
}: DietaryPreferenceSelectorProps) {
  return (
    <div className="rounded-3xl border border-[var(--gd-border)] bg-white p-6 shadow-sm">
      <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--gd-forest)]">
        DIETARY PREFERENCE
      </p>
      <h2 className="mt-1 font-display text-xl font-semibold text-[var(--gd-charcoal)]">
        Select your dietary choices
      </h2>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DIETS.map((diet) => {
          const isSelected = selectedDiet === diet.id;

          return (
            <button
              key={diet.id}
              type="button"
              onClick={() => onSelectDiet(diet.id)}
              className={`flex flex-col text-left rounded-2xl p-4 transition-all ${
                isSelected
                  ? 'border-2 border-[var(--gd-forest)] bg-emerald-50/50 shadow-sm font-semibold'
                  : 'border border-[var(--gd-border)] bg-[var(--gd-ivory)] hover:border-stone-300'
              }`}
              aria-pressed={isSelected}
            >
              <span className="font-display text-sm font-bold text-[var(--gd-charcoal)]">
                {diet.label}
              </span>
              <span className="mt-1 text-[11px] font-normal leading-relaxed text-[var(--gd-muted)]">
                {diet.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
