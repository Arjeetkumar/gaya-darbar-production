import { Plus, RotateCcw, Check } from 'lucide-react';
import type { MealBuilderSelection } from '../../types/mealBuilder';
import {
  calculateMealNutrition,
  calculateMealPrice,
  calculateFuelScore,
  validateMealSelection,
  getSelectedOptionObjects,
} from '../../services/mealBuilderService';
import NutritionSummary from './NutritionSummary';
import BuilderValidation from './BuilderValidation';
import type { DietaryPreference } from '../../types/menu';

interface MealSummaryProps {
  selection: MealBuilderSelection;
  targetDiet?: DietaryPreference | 'all';
  onAddToCart: () => void;
  onReset: () => void;
  toastMessage?: string | null;
}

export default function MealSummary({
  selection,
  targetDiet,
  onAddToCart,
  onReset,
  toastMessage,
}: MealSummaryProps) {

  const activeDietTarget = targetDiet === 'all' ? undefined : targetDiet;

  const nutrition = calculateMealNutrition(selection);
  const price = calculateMealPrice(selection);
  const fuelScore = calculateFuelScore(selection);
  const validation = validateMealSelection(selection, activeDietTarget);
  const selectedOptions = getSelectedOptionObjects(selection);

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-[var(--gd-border)] bg-white p-5 sm:p-6 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--gd-border)] pb-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--gd-forest)]">
            LIVE FUEL SUMMARY
          </p>
          <h2 className="font-display text-2xl font-semibold text-[var(--gd-charcoal)]">
            Your Custom Bowl
          </h2>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--gd-border)] bg-stone-100 px-3 py-1.5 text-xs font-semibold text-[var(--gd-charcoal)] transition-colors hover:bg-stone-200"
          aria-label="Start over with clean selection"
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
      </div>

      {/* Selected Ingredients List */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gd-muted)] mb-3">
          Selected Ingredients ({selectedOptions.length})
        </p>

        {selectedOptions.length > 0 ? (
          <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {selectedOptions.map((opt) => (
              <li
                key={opt.id}
                className="flex items-center justify-between rounded-xl bg-[var(--gd-ivory)] px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--gd-forest)]" />
                  <span className="font-medium text-[var(--gd-charcoal)]">{opt.name}</span>
                </div>
                <span className="font-semibold text-[var(--gd-muted)]">
                  {opt.price > 0 ? `+₹${opt.price}` : 'Incl.'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-stone-200 bg-stone-50 p-4 text-center text-xs text-[var(--gd-muted)]">
            No ingredients selected yet. Start by choosing a base below.
          </p>
        )}
      </div>

      {/* NUTRITION & FUEL SCORE */}
      <NutritionSummary nutrition={nutrition} fuelScore={fuelScore} />

      {/* PRICE BREAKDOWN */}
      <div className="rounded-2xl border border-[var(--gd-border)] bg-stone-50/70 p-4 text-xs space-y-2">
        <div className="flex justify-between text-[var(--gd-muted)]">
          <span>Base Price</span>
          <span>₹{price.basePrice}</span>
        </div>
        <div className="flex justify-between text-[var(--gd-muted)]">
          <span>Add-on Options</span>
          <span>+₹{price.optionsPrice}</span>
        </div>
        <div className="flex justify-between border-t border-[var(--gd-border)] pt-2 font-display text-lg font-bold text-[var(--gd-charcoal)]">
          <span>Total Fuel Price</span>
          <span className="text-[var(--gd-forest)]">₹{price.totalPrice}</span>
        </div>
      </div>

      {/* VALIDATION FEEDBACK */}
      <BuilderValidation validation={validation} />

      {/* ACTION BUTTON */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={onAddToCart}
          disabled={!validation.isValid}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 px-6 text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md active:scale-[0.98] ${
            !validation.isValid
              ? 'bg-stone-300 cursor-not-allowed opacity-70'
              : toastMessage
              ? 'bg-emerald-700'
              : 'bg-[var(--gd-charcoal)] hover:bg-[var(--gd-forest)]'
          }`}
        >
          {toastMessage ? (
            <>
              <Check size={16} />
              <span>{toastMessage}</span>
            </>
          ) : (
            <>
              <Plus size={16} />
              <span>Add to Fuel Bag • ₹{price.totalPrice}</span>
            </>
          )}
        </button>

        {!validation.isValid && (
          <p className="text-center text-[10px] font-medium text-rose-600">
            Please complete base & protein selections to proceed.
          </p>
        )}
      </div>
    </div>
  );
}
