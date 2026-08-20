import { Dumbbell, Flame, Target, Leaf, Check } from 'lucide-react';
import type { FitnessGoal } from '../../types/menu';

interface GoalSelectorProps {
  selectedGoal: FitnessGoal;
  onSelectGoal: (goal: FitnessGoal) => void;
}

const GOALS: { id: FitnessGoal; label: string; description: string; icon: typeof Dumbbell }[] = [
  {
    id: 'muscleGain',
    label: 'Build Muscle',
    description: 'High-protein meals tailored for muscle hyper-trophy & strength recovery.',
    icon: Dumbbell,
  },
  {
    id: 'fatLoss',
    label: 'Lose Fat',
    description: 'Calorie-controlled meals with fiber density for fat oxidation.',
    icon: Flame,
  },
  {
    id: 'performance',
    label: 'Performance',
    description: 'Balanced macronutrients for high stamina and athletic training.',
    icon: Target,
  },
  {
    id: 'eatClean',
    label: 'Eat Clean',
    description: 'Whole foods nutrition for daily wellness and vital digestion.',
    icon: Leaf,
  },
];

export default function GoalSelector({ selectedGoal, onSelectGoal }: GoalSelectorProps) {
  return (
    <div className="rounded-3xl border border-[var(--gd-border)] bg-white p-6 shadow-sm">
      <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--gd-forest)]">
        PRIMARY FITNESS GOAL
      </p>
      <h2 className="mt-1 font-display text-xl font-semibold text-[var(--gd-charcoal)]">
        Choose your training objective
      </h2>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {GOALS.map((goal) => {
          const Icon = goal.icon;
          const isSelected = selectedGoal === goal.id;

          return (
            <div
              key={goal.id}
              onClick={() => onSelectGoal(goal.id)}
              className={`group relative flex cursor-pointer flex-col justify-between rounded-2xl p-5 transition-all duration-200 ${
                isSelected
                  ? 'border-2 border-[var(--gd-forest)] bg-emerald-50/50 shadow-md'
                  : 'border border-[var(--gd-border)] bg-[var(--gd-ivory)] hover:border-[var(--gd-forest)]/40 hover:bg-white'
              }`}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectGoal(goal.id);
                }
              }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                      isSelected
                        ? 'bg-[var(--gd-forest)] text-white'
                        : 'bg-white text-[var(--gd-forest)]'
                    }`}
                  >
                    <Icon size={20} />
                  </div>

                  {isSelected && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--gd-forest)] text-white">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>

                <h3 className="mt-4 font-display text-base font-semibold text-[var(--gd-charcoal)]">
                  {goal.label}
                </h3>

                <p className="mt-1.5 text-xs leading-relaxed text-[var(--gd-muted)]">
                  {goal.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
