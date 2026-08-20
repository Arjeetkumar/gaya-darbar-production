import { useState } from 'react';
import { Target, Edit2, Check, X } from 'lucide-react';
import type { UserProfile } from '../../types/profile';

interface NutritionTargetsProps {
  profile: UserProfile;
  onSaveTargets: (targets: {
    dailyCalories: number;
    dailyProtein: number;
    dailyCarbs: number;
    dailyFats: number;
  }) => void;
}

export default function NutritionTargets({ profile, onSaveTargets }: NutritionTargetsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [calories, setCalories] = useState(profile.dailyCalories);
  const [protein, setProtein] = useState(profile.dailyProtein);
  const [carbs, setCarbs] = useState(profile.dailyCarbs);
  const [fats, setFats] = useState(profile.dailyFats);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (calories <= 0 || protein <= 0 || carbs <= 0 || fats <= 0) {
      setError('Nutrition target values must be positive numbers.');
      return;
    }
    setError(null);
    onSaveTargets({
      dailyCalories: Number(calories),
      dailyProtein: Number(protein),
      dailyCarbs: Number(carbs),
      dailyFats: Number(fats),
    });
    setIsEditing(false);
  };

  return (
    <div className="rounded-3xl border border-[var(--gd-border)] bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--gd-border)] pb-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--gd-forest)]">
            DAILY TARGET MACROS
          </p>
          <h2 className="font-display text-xl font-semibold text-[var(--gd-charcoal)]">
            Personalized Goal Metrics
          </h2>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--gd-border)] bg-[var(--gd-ivory)] px-3 py-1.5 text-xs font-semibold text-[var(--gd-charcoal)] transition-colors hover:bg-stone-200"
          >
            <Edit2 size={13} />
            <span>Edit Targets</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1 rounded-xl bg-[var(--gd-forest)] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[var(--gd-forest-dark)]"
            >
              <Check size={14} />
              <span>Save</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="inline-flex items-center gap-1 rounded-xl border border-[var(--gd-border)] bg-stone-100 px-3 py-1.5 text-xs font-medium text-[var(--gd-muted)] hover:bg-stone-200"
            >
              <X size={14} />
              <span>Cancel</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
          {error}
        </p>
      )}

      {/* TARGET VALUES GRID */}
      {!isEditing ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-[var(--gd-border)] bg-[var(--gd-ivory)] p-4 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--gd-muted)]">
              Daily Energy
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-[var(--gd-charcoal)]">
              {profile.dailyCalories}
            </p>
            <p className="text-[10px] font-semibold text-[var(--gd-muted)]">kcal / day</p>
          </div>

          <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/70 p-4 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-800">
              Daily Protein
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-[var(--gd-forest)]">
              {profile.dailyProtein}g
            </p>
            <p className="text-[10px] font-semibold text-emerald-700">Muscle Target</p>
          </div>

          <div className="rounded-2xl border border-[var(--gd-border)] bg-[var(--gd-ivory)] p-4 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--gd-muted)]">
              Daily Carbs
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-[var(--gd-charcoal)]">
              {profile.dailyCarbs}g
            </p>
            <p className="text-[10px] font-semibold text-[var(--gd-muted)]">Energy Reserve</p>
          </div>

          <div className="rounded-2xl border border-[var(--gd-border)] bg-[var(--gd-ivory)] p-4 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--gd-muted)]">
              Daily Fats
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-[var(--gd-charcoal)]">
              {profile.dailyFats}g
            </p>
            <p className="text-[10px] font-semibold text-[var(--gd-muted)]">Healthy Fats</p>
          </div>
        </div>
      ) : (
        /* EDITING FORM */
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--gd-muted)] mb-1">
              Calories (kcal)
            </label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(Number(e.target.value))}
              className="w-full rounded-xl border border-[var(--gd-border)] p-2.5 text-xs font-bold text-[var(--gd-charcoal)] focus:border-[var(--gd-forest)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--gd-forest)] mb-1">
              Protein (grams)
            </label>
            <input
              type="number"
              value={protein}
              onChange={(e) => setProtein(Number(e.target.value))}
              className="w-full rounded-xl border border-emerald-300 p-2.5 text-xs font-bold text-[var(--gd-forest)] focus:border-[var(--gd-forest)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--gd-muted)] mb-1">
              Carbs (grams)
            </label>
            <input
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(Number(e.target.value))}
              className="w-full rounded-xl border border-[var(--gd-border)] p-2.5 text-xs font-bold text-[var(--gd-charcoal)] focus:border-[var(--gd-forest)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--gd-muted)] mb-1">
              Fats (grams)
            </label>
            <input
              type="number"
              value={fats}
              onChange={(e) => setFats(Number(e.target.value))}
              className="w-full rounded-xl border border-[var(--gd-border)] p-2.5 text-xs font-bold text-[var(--gd-charcoal)] focus:border-[var(--gd-forest)] focus:outline-none"
            />
          </div>
        </div>
      )}

      <p className="mt-4 flex items-center gap-1.5 text-[11px] text-[var(--gd-muted)]">
        <Target size={13} className="text-[var(--gd-forest)] shrink-0" />
        <span>Custom nutrition target guidelines for training & recovery.</span>
      </p>
    </div>
  );
}
