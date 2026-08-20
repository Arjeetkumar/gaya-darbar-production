import { useCart } from '../../context/CartContext';
import type { UserProfile } from '../../types/profile';
import FuelScoreBadge from '../menu/FuelScoreBadge';
import { Flame, Dumbbell, Sparkles } from 'lucide-react';

interface NutritionProgressProps {
  profile: UserProfile;
}

export default function NutritionProgress({ profile }: NutritionProgressProps) {
  const { items, totalCalories, totalProtein, totalCarbs, totalFats } = useCart();

  const hasLoggedMeals = items.length > 0;

  // Compute average Fuel Score of active items in bag
  const avgFuelScore = hasLoggedMeals
    ? Math.round(
        items.reduce((sum, i) => sum + i.fuelScore * i.quantity, 0) /
          items.reduce((sum, i) => sum + i.quantity, 0)
      )
    : 0;

  // Percentages against daily targets
  const calPercent = Math.min(100, Math.round((totalCalories / profile.dailyCalories) * 100));
  const proteinPercent = Math.min(100, Math.round((totalProtein / profile.dailyProtein) * 100));
  const carbsPercent = Math.min(100, Math.round((totalCarbs / profile.dailyCarbs) * 100));
  const fatsPercent = Math.min(100, Math.round((totalFats / profile.dailyFats) * 100));

  return (
    <div className="rounded-3xl border border-[var(--gd-border)] bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--gd-border)] pb-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--gd-forest)]">
            TODAY'S FUEL LOG
          </p>
          <h2 className="font-display text-xl font-semibold text-[var(--gd-charcoal)]">
            Macro Progress Dashboard
          </h2>
        </div>

        {hasLoggedMeals ? (
          <FuelScoreBadge score={avgFuelScore} size="md" />
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-2xl bg-[var(--gd-ivory)] px-3.5 py-1.5 text-xs font-semibold text-[var(--gd-muted)]">
            <Sparkles size={14} className="text-amber-500" />
            <span>Build your first meal to see your Fuel Score</span>
          </div>
        )}
      </div>

      {!hasLoggedMeals ? (
        <div className="my-6 rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Flame size={20} />
          </div>
          <h3 className="mt-3 font-display text-base font-semibold text-[var(--gd-charcoal)]">
            No meals logged yet today
          </h3>
          <p className="mt-1 text-xs text-[var(--gd-muted)]">
            Items added to your Fuel Bag will automatically update your daily macro progress here.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {/* CALORIES PROGRESS */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-[var(--gd-charcoal)]">Calories Consumed</span>
              <span className="text-[var(--gd-muted)]">
                {totalCalories} / {profile.dailyCalories} kcal ({calPercent}%)
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-stone-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--gd-charcoal)] transition-all duration-500"
                style={{ width: `${calPercent}%` }}
              />
            </div>
          </div>

          {/* PROTEIN PROGRESS */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-[var(--gd-forest)] flex items-center gap-1">
                <Dumbbell size={13} />
                <span>Protein Consumed</span>
              </span>
              <span className="text-[var(--gd-forest)] font-bold">
                {totalProtein} / {profile.dailyProtein} g ({proteinPercent}%)
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-emerald-100/70 overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--gd-forest)] transition-all duration-500"
                style={{ width: `${proteinPercent}%` }}
              />
            </div>
          </div>

          {/* CARBS & FATS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-[var(--gd-charcoal)]">Carbs</span>
                <span className="text-[var(--gd-muted)]">
                  {totalCarbs} / {profile.dailyCarbs} g ({carbsPercent}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-stone-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-stone-600 transition-all duration-500"
                  style={{ width: `${carbsPercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-[var(--gd-charcoal)]">Fats</span>
                <span className="text-[var(--gd-muted)]">
                  {totalFats} / {profile.dailyFats} g ({fatsPercent}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-stone-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${fatsPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
