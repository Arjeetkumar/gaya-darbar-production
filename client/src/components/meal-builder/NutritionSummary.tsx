import type { MealNutrition } from '../../types/mealBuilder';
import FuelScoreBadge from '../menu/FuelScoreBadge';

interface NutritionSummaryProps {
  nutrition: MealNutrition;
  fuelScore: number;
}

export default function NutritionSummary({
  nutrition,
  fuelScore,
}: NutritionSummaryProps) {
  return (
    <div className="rounded-2xl border border-[var(--gd-border)] bg-[var(--gd-ivory)] p-4 sm:p-5">
      <div className="flex items-center justify-between border-b border-[var(--gd-border)] pb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gd-forest)]">
          CUSTOM FUEL NUTRITION
        </p>
        <FuelScoreBadge score={fuelScore} size="sm" />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        <div className="rounded-xl bg-white p-2.5 sm:p-3 border border-[var(--gd-border)]">
          <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--gd-muted)]">
            Energy
          </p>
          <p className="mt-1 font-display text-lg font-bold text-[var(--gd-charcoal)]">
            {nutrition.calories}
          </p>
          <p className="text-[9px] font-semibold text-[var(--gd-muted)]">kcal</p>
        </div>

        <div className="rounded-xl bg-emerald-50/70 p-2.5 sm:p-3 border border-emerald-200/60">
          <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-800">
            Protein
          </p>
          <p className="mt-1 font-display text-lg font-bold text-[var(--gd-forest)]">
            {nutrition.protein}g
          </p>
          <p className="text-[9px] font-semibold text-emerald-700">Muscle Fuel</p>
        </div>

        <div className="rounded-xl bg-white p-2.5 sm:p-3 border border-[var(--gd-border)]">
          <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--gd-muted)]">
            Carbs
          </p>
          <p className="mt-1 font-display text-lg font-bold text-[var(--gd-charcoal)]">
            {nutrition.carbs}g
          </p>
          <p className="text-[9px] font-semibold text-[var(--gd-muted)]">Stamina</p>
        </div>

        <div className="rounded-xl bg-white p-2.5 sm:p-3 border border-[var(--gd-border)]">
          <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--gd-muted)]">
            Fats
          </p>
          <p className="mt-1 font-display text-lg font-bold text-[var(--gd-charcoal)]">
            {nutrition.fats}g
          </p>
          <p className="text-[9px] font-semibold text-[var(--gd-muted)]">Healthy</p>
        </div>
      </div>
    </div>
  );
}
