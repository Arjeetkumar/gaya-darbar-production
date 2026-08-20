import { Check } from 'lucide-react';
import type { BuilderCategory } from '../../types/mealBuilder';

interface BuilderProgressProps {
  categories: { id: BuilderCategory; label: string; number: string }[];
  currentStepIndex: number;
  completedStepIndices: number[];
  onSelectStep: (index: number) => void;
}

export default function BuilderProgress({
  categories,
  currentStepIndex,
  completedStepIndices,
  onSelectStep,
}: BuilderProgressProps) {
  return (
    <nav aria-label="Meal Builder Steps" className="w-full overflow-x-auto pb-2">
      <ol className="flex items-center gap-2 min-w-max">
        {categories.map((cat, idx) => {
          const isCurrent = currentStepIndex === idx;
          const isCompleted = completedStepIndices.includes(idx);
          const isAccessible = isCompleted || idx <= currentStepIndex;

          return (
            <li key={cat.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => isAccessible && onSelectStep(idx)}
                disabled={!isAccessible}
                className={`flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-xs font-semibold transition-all duration-200 ${
                  isCurrent
                    ? 'bg-[var(--gd-charcoal)] text-white shadow-md'
                    : isCompleted
                    ? 'bg-[var(--gd-sage)]/60 text-[var(--gd-forest)] hover:bg-[var(--gd-sage)]'
                    : 'bg-white border border-[var(--gd-border)] text-[var(--gd-muted)] opacity-60 cursor-not-allowed'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`Step ${cat.number}: ${cat.label}`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    isCurrent
                      ? 'bg-amber-400 text-[var(--gd-charcoal)]'
                      : isCompleted
                      ? 'bg-[var(--gd-forest)] text-white'
                      : 'bg-stone-200 text-[var(--gd-muted)]'
                  }`}
                >
                  {isCompleted ? <Check size={12} strokeWidth={3} /> : cat.number}
                </span>

                <span>{cat.label}</span>
              </button>

              {idx < categories.length - 1 && (
                <div
                  className={`h-0.5 w-4 rounded-full transition-colors ${
                    isCompleted ? 'bg-[var(--gd-forest)]/40' : 'bg-[var(--gd-border)]'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
