import { Check, AlertCircle } from 'lucide-react';
import type { MealBuilderOption } from '../../types/mealBuilder';
import type { DietaryPreference } from '../../types/menu';
import DietaryBadge from '../menu/DietaryBadge';

interface BuilderOptionCardProps {
  option: MealBuilderOption;
  isSelected: boolean;
  isDisabled: boolean;
  disabledReason?: string;
  targetDiet?: DietaryPreference | 'all';
  onToggleSelect: (option: MealBuilderOption) => void;
}

export default function BuilderOptionCard({
  option,
  isSelected,
  isDisabled,
  disabledReason,
  onToggleSelect,
}: BuilderOptionCardProps) {
  return (
    <div
      onClick={() => !isDisabled && onToggleSelect(option)}
      className={`group relative flex h-full flex-col justify-between rounded-2xl p-5 transition-all duration-200 ${
        isDisabled
          ? 'border border-dashed border-stone-300 bg-stone-100/70 opacity-60 cursor-not-allowed'
          : isSelected
          ? 'border-2 border-[var(--gd-forest)] bg-emerald-50/50 shadow-md cursor-pointer'
          : 'border border-[var(--gd-border)] bg-white hover:border-[var(--gd-forest)]/40 hover:shadow-sm cursor-pointer'
      }`}
      role="checkbox"
      aria-checked={isSelected}
      aria-disabled={isDisabled}
      tabIndex={isDisabled ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isDisabled) {
          e.preventDefault();
          onToggleSelect(option);
        }
      }}
    >
      <div>
        {/* Header: Title, Dietary Badge & Checkbox */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <DietaryBadge preference={option.dietaryPreference} showLabel={false} />
              <h3 className="font-display text-base font-semibold text-[var(--gd-charcoal)]">
                {option.name}
              </h3>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[var(--gd-muted)]">
              {option.description}
            </p>
          </div>

          <div
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${
              isSelected
                ? 'border-[var(--gd-forest)] bg-[var(--gd-forest)] text-white'
                : 'border-stone-300 bg-white group-hover:border-[var(--gd-forest)]'
            }`}
          >
            {isSelected && <Check size={14} strokeWidth={3} />}
          </div>
        </div>

        {/* Tags */}
        {option.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {option.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-stone-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--gd-muted)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer: Price, Calories & Protein */}
      <div className="mt-4 border-t border-[var(--gd-border)] pt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-display font-bold text-[var(--gd-charcoal)] text-sm">
            {option.price > 0 ? `+₹${option.price}` : 'Included'}
          </span>

          <div className="flex items-center gap-3 font-semibold text-[var(--gd-muted)]">
            <span className="text-[var(--gd-forest)]">{option.protein}g P</span>
            <span>{option.calories} kcal</span>
          </div>
        </div>

        {/* Disabled Warning Reason */}
        {isDisabled && disabledReason && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-50 p-2 text-[10px] font-semibold text-amber-800 border border-amber-200">
            <AlertCircle size={12} className="shrink-0 text-amber-600" />
            <span>{disabledReason}</span>
          </div>
        )}
      </div>
    </div>
  );
}
