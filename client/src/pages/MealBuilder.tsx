import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import type {
  BuilderCategory,
  MealBuilderOption,
  MealBuilderSelection,
} from '../types/mealBuilder';
import type { DietaryPreference } from '../types/menu';
import {
  getOptionsByCategory,
  validateMealSelection,
  loadMealBuilderOptionsFromApi,
} from '../services/mealBuilderService';
import { useCart } from '../context/CartContext';
import BuilderProgress from '../components/meal-builder/BuilderProgress';
import DietarySelector from '../components/meal-builder/DietarySelector';
import BuilderOptionCard from '../components/meal-builder/BuilderOptionCard';
import MealSummary from '../components/meal-builder/MealSummary';

const CATEGORIES: { id: BuilderCategory; label: string; number: string; isMulti: boolean }[] = [
  { id: 'base', label: 'Base', number: '01', isMulti: false },
  { id: 'protein', label: 'Protein', number: '02', isMulti: false },
  { id: 'carb', label: 'Carb', number: '03', isMulti: false },
  { id: 'vegetables', label: 'Vegetables', number: '04', isMulti: true },
  { id: 'sauce', label: 'Sauce', number: '05', isMulti: true },
  { id: 'extras', label: 'Extras', number: '06', isMulti: true },
];

export default function MealBuilder() {
  const { addCustomMeal } = useCart();
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [targetDiet, setTargetDiet] = useState<DietaryPreference | 'all'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [, setOptionsVersion] = useState<number>(0);

  // Meal selection state
  const [selection, setSelection] = useState<MealBuilderSelection>({
    vegetableIds: [],
    sauceIds: [],
    extraIds: [],
  });

  // Fetch builder options from backend API (with local fallback)
  useEffect(() => {
    const activeDietTarget = targetDiet === 'all' ? undefined : targetDiet;
    loadMealBuilderOptionsFromApi(undefined, activeDietTarget).then(() => {
      setOptionsVersion((v) => v + 1);
    });
  }, [targetDiet]);

  const currentCategoryObj = CATEGORIES[currentStepIndex] || CATEGORIES[0];
  const currentCategory = currentCategoryObj.id;

  // Options fetched from service for active step category
  const availableCategoryOptions = getOptionsByCategory(currentCategory);

  // Toggle selection handler
  const handleToggleOption = (option: MealBuilderOption) => {
    setSelection((prev) => {
      switch (option.category) {
        case 'base':
          return { ...prev, baseId: prev.baseId === option.id ? undefined : option.id };
        case 'protein':
          return { ...prev, proteinId: prev.proteinId === option.id ? undefined : option.id };
        case 'carb':
          return { ...prev, carbId: prev.carbId === option.id ? undefined : option.id };
        case 'vegetables': {
          const exists = prev.vegetableIds.includes(option.id);
          return {
            ...prev,
            vegetableIds: exists
              ? prev.vegetableIds.filter((id) => id !== option.id)
              : [...prev.vegetableIds, option.id],
          };
        }
        case 'sauce': {
          const exists = prev.sauceIds.includes(option.id);
          return {
            ...prev,
            sauceIds: exists
              ? prev.sauceIds.filter((id) => id !== option.id)
              : [...prev.sauceIds, option.id],
          };
        }
        case 'extras': {
          const exists = prev.extraIds.includes(option.id);
          return {
            ...prev,
            extraIds: exists
              ? prev.extraIds.filter((id) => id !== option.id)
              : [...prev.extraIds, option.id],
          };
        }
        default:
          return prev;
      }
    });

    // Mark current step as visited/completed
    if (!completedSteps.includes(currentStepIndex)) {
      setCompletedSteps((prev) => [...prev, currentStepIndex]);
    }
  };

  // Check if option is selected
  const isOptionSelected = (opt: MealBuilderOption): boolean => {
    switch (opt.category) {
      case 'base':
        return selection.baseId === opt.id;
      case 'protein':
        return selection.proteinId === opt.id;
      case 'carb':
        return selection.carbId === opt.id;
      case 'vegetables':
        return selection.vegetableIds.includes(opt.id);
      case 'sauce':
        return selection.sauceIds.includes(opt.id);
      case 'extras':
        return selection.extraIds.includes(opt.id);
      default:
        return false;
    }
  };

  // Check if option is disabled due to dietary incompatibility
  const isOptionDisabled = (opt: MealBuilderOption): { disabled: boolean; reason?: string } => {
    if (!opt.isAvailable) {
      return { disabled: true, reason: 'Out of Stock' };
    }

    if (targetDiet && targetDiet !== 'all' && targetDiet !== 'nonVegetarian') {
      const pref = opt.dietaryPreference;
      if (targetDiet === 'vegan' && pref !== 'vegan') {
        return { disabled: true, reason: `Contains ${pref}` };
      }
      if (targetDiet === 'vegetarian' && pref !== 'vegetarian' && pref !== 'vegan') {
        return { disabled: true, reason: `Contains ${pref}` };
      }
      if (
        targetDiet === 'eggitarian' &&
        pref !== 'eggitarian' &&
        pref !== 'vegetarian' &&
        pref !== 'vegan'
      ) {
        return { disabled: true, reason: `Contains ${pref}` };
      }
    }

    return { disabled: false };
  };

  // Navigation Handlers
  const handleNextStep = () => {
    if (currentStepIndex < CATEGORIES.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      if (!completedSteps.includes(currentStepIndex)) {
        setCompletedSteps((prev) => [...prev, currentStepIndex]);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setSelection({
      vegetableIds: [],
      sauceIds: [],
      extraIds: [],
    });
    setCurrentStepIndex(0);
    setCompletedSteps([]);
    setToastMessage(null);
  };

  const handleAddToCart = () => {
    const activeDietTarget = targetDiet === 'all' ? undefined : targetDiet;
    const validation = validateMealSelection(selection, activeDietTarget);

    if (validation.isValid) {
      addCustomMeal(selection, 1);
      setToastMessage('Added Custom Fuel Bowl to Fuel Bag!');
      setTimeout(() => {
        setToastMessage(null);
      }, 3000);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--gd-ivory)] py-12 lg:py-16">
      <div className="gd-container">
        {/* HEADER SECTION */}
        <header className="max-w-3xl">
          <p className="inline-block rounded-full bg-[var(--gd-sage)]/60 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--gd-forest)]">
            BUILD YOUR FUEL
          </p>

          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-[var(--gd-charcoal)] md:text-5xl lg:text-6xl">
            Create a meal that <span className="text-[var(--gd-forest)]">works for you.</span>
          </h1>

          <p className="mt-4 text-base leading-relaxed text-[var(--gd-muted)] md:text-lg">
            Choose your base, protein, veggies, and house dressings. We calculate your macros and price live as you build.
          </p>
        </header>

        {/* DIETARY PREFERENCE & STEP PROGRESS BAR */}
        <div className="mt-10 space-y-6 rounded-3xl border border-[var(--gd-border)] bg-white p-5 sm:p-6 shadow-sm">
          <DietarySelector selectedDiet={targetDiet} onSelectDiet={setTargetDiet} />

          <div className="h-px w-full bg-[var(--gd-border)]" />

          <BuilderProgress
            categories={CATEGORIES}
            currentStepIndex={currentStepIndex}
            completedStepIndices={completedSteps}
            onSelectStep={(idx) => setCurrentStepIndex(idx)}
          />
        </div>

        {/* MAIN BUILDER WORKSPACE (2-COLUMN ON DESKTOP) */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* LEFT: INGREDIENTS SELECTION GRID (8 COLS) */}
          <section className="lg:col-span-7 xl:col-span-8">
            <div className="flex items-center justify-between border-b border-[var(--gd-border)] pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gd-forest)]">
                  STEP {currentCategoryObj.number} OF 06
                </p>
                <h2 className="font-display text-2xl font-semibold text-[var(--gd-charcoal)]">
                  Select {currentCategoryObj.label}
                </h2>
              </div>

              <span className="text-xs font-semibold text-[var(--gd-muted)]">
                {currentCategoryObj.isMulti ? 'Select 1 or more' : 'Select 1 option'}
              </span>
            </div>

            {/* OPTIONS GRID */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {availableCategoryOptions.map((option) => {
                const isSelected = isOptionSelected(option);
                const { disabled, reason } = isOptionDisabled(option);

                return (
                  <BuilderOptionCard
                    key={option.id}
                    option={option}
                    isSelected={isSelected}
                    isDisabled={disabled}
                    disabledReason={reason}
                    targetDiet={targetDiet}
                    onToggleSelect={handleToggleOption}
                  />
                );
              })}
            </div>

            {/* STEP NAVIGATION BUTTONS */}
            <div className="mt-8 flex items-center justify-between border-t border-[var(--gd-border)] pt-6">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--gd-border)] bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--gd-charcoal)] transition-all hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              {currentStepIndex < CATEGORIES.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--gd-charcoal)] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-[var(--gd-forest)] shadow-md"
                >
                  <span>Next: {CATEGORIES[currentStepIndex + 1]?.label}</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--gd-forest)] px-7 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-[var(--gd-forest-dark)] shadow-md"
                >
                  <Sparkles size={16} />
                  <span>Review & Add to Bag</span>
                </button>
              )}
            </div>
          </section>

          {/* RIGHT: STICKY LIVE MEAL SUMMARY (5 COLS) */}
          <aside className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-28 lg:h-fit">
            <MealSummary
              selection={selection}
              targetDiet={targetDiet}
              onAddToCart={handleAddToCart}
              onReset={handleReset}
              toastMessage={toastMessage}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
