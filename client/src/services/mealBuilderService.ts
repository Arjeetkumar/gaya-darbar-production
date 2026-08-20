import { MEAL_BUILDER_OPTIONS } from '../data/mealBuilderData';
import type {
  BuilderCategory,
  MealBuilderOption,
  MealBuilderSelection,
  MealNutrition,
  MealPrice,
  MealValidationResult,
} from '../types/mealBuilder';
import type { DietaryPreference } from '../types/menu';
import { buildApiUrl } from './apiConfig';

const IS_DEV = import.meta.env.DEV;

// Active dynamic options cache (initialized with fallback options)
let cachedOptions: MealBuilderOption[] = [...MEAL_BUILDER_OPTIONS];

/**
 * Asynchronously loads meal builder options from backend API (`GET /api/v1/meal-builder/options`).
 * In DEVELOPMENT mode: Falls back to local options if backend is offline.
 * In PRODUCTION mode: Surfaces real API errors to the caller.
 */
export async function loadMealBuilderOptionsFromApi(
  category?: BuilderCategory,
  diet?: DietaryPreference
): Promise<MealBuilderOption[]> {
  try {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (diet) params.append('diet', diet);

    const url = buildApiUrl(`/api/v1/meal-builder/options?${params.toString()}`);
    const response = await fetch(url);

    if (response.ok) {
      const json = await response.json();
      if (json.success && Array.isArray(json.data)) {
        const fetched = json.data.map((opt: any) => ({
          ...opt,
          id: opt._id || opt.id,
        }));
        cachedOptions = fetched;
        return fetched;
      }
    } else {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || `API error (${response.status})`);
    }
  } catch (error) {
    if (IS_DEV) {
      console.info(
        'Dev Mode Notice: Backend Meal Builder API unavailable. Serving local fallback options.',
        error
      );
    } else {
      console.error('Production Meal Builder Options API Failure:', error);
      throw error;
    }
  }

  return [...MEAL_BUILDER_OPTIONS];
}

/**
 * Returns all available meal builder options.
 */
export function getMealBuilderOptions(): MealBuilderOption[] {
  return cachedOptions.length > 0 ? cachedOptions : [...MEAL_BUILDER_OPTIONS];
}

/**
 * Returns options filtered by category.
 */
export function getOptionsByCategory(category: BuilderCategory): MealBuilderOption[] {
  const options = getMealBuilderOptions();
  return options.filter((opt) => opt.category === category);
}

/**
 * Looks up a single option by its unique ID.
 */
export function getOptionById(id: string): MealBuilderOption | undefined {
  const options = getMealBuilderOptions();
  return (
    options.find((opt) => opt.id === id) ||
    MEAL_BUILDER_OPTIONS.find((opt) => opt.id === id)
  );
}

/**
 * Helper function to gather all selected MealBuilderOption objects from a selection.
 */
export function getSelectedOptionObjects(selection: MealBuilderSelection): MealBuilderOption[] {
  const selectedIds: string[] = [];

  if (selection.baseId) selectedIds.push(selection.baseId);
  if (selection.proteinId) selectedIds.push(selection.proteinId);
  if (selection.carbId) selectedIds.push(selection.carbId);
  if (selection.vegetableIds) selectedIds.push(...selection.vegetableIds);
  if (selection.sauceIds) selectedIds.push(...selection.sauceIds);
  if (selection.extraIds) selectedIds.push(...selection.extraIds);

  const options: MealBuilderOption[] = [];
  for (const id of selectedIds) {
    const opt = getOptionById(id);
    if (opt) {
      options.push(opt);
    }
  }

  return options;
}

/**
 * Calculates the exact combined nutrition values (Calories, Protein, Carbs, Fats)
 * for a meal builder selection.
 */
export function calculateMealNutrition(selection: MealBuilderSelection): MealNutrition {
  const selectedOptions = getSelectedOptionObjects(selection);

  return selectedOptions.reduce<MealNutrition>(
    (acc, option) => {
      acc.calories += option.calories;
      acc.protein += option.protein;
      acc.carbs += option.carbs;
      acc.fats += option.fats;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
}

/**
 * Calculates the total cost breakdown for a meal builder selection.
 */
export function calculateMealPrice(selection: MealBuilderSelection): MealPrice {
  const baseOption = selection.baseId ? getOptionById(selection.baseId) : undefined;
  const basePrice = baseOption ? baseOption.price : 0;

  const selectedOptions = getSelectedOptionObjects(selection);
  const totalCost = selectedOptions.reduce((sum, opt) => sum + opt.price, 0);

  return {
    basePrice,
    optionsPrice: totalCost - basePrice,
    totalPrice: totalCost,
  };
}

/**
 * Deterministic Fuel Score Calculation Algorithm
 */
export function calculateFuelScore(selection: MealBuilderSelection): number {
  const nutrition = calculateMealNutrition(selection);
  const selectedOptions = getSelectedOptionObjects(selection);

  let score = 65;

  const hasBase = Boolean(selection.baseId);
  const hasProtein = Boolean(selection.proteinId);

  if (!hasBase || !hasProtein) {
    score -= 25;
  }

  const proteinBonus = Math.min(25, nutrition.protein * 0.5);
  score += proteinBonus;

  if (nutrition.protein >= 30 && nutrition.calories <= 650) {
    score += 5;
  }

  const vegCount = selectedOptions.filter((opt) => opt.category === 'vegetables').length;
  const vegBonus = Math.min(9, vegCount * 3);
  score += vegBonus;

  if (nutrition.fats >= 8 && nutrition.fats <= 22) {
    score += 4;
  }

  if (nutrition.fats > 35) {
    score -= 6;
  }

  if (nutrition.calories > 800) {
    score -= 5;
  }

  return Math.max(1, Math.min(100, Math.round(score)));
}

/**
 * Validates a meal builder selection against required categories, option availability,
 * and dietary compatibility.
 */
export function validateMealSelection(
  selection: MealBuilderSelection,
  targetDiet?: DietaryPreference
): MealValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!selection.baseId) {
    errors.push('A base selection is required to construct your fuel bowl.');
  } else {
    const baseOpt = getOptionById(selection.baseId);
    if (!baseOpt) {
      errors.push(`Invalid base option selected: '${selection.baseId}'.`);
    } else if (!baseOpt.isAvailable) {
      errors.push(`Base '${baseOpt.name}' is currently out of stock.`);
    }
  }

  if (!selection.proteinId) {
    errors.push('A protein source selection is required.');
  } else {
    const proteinOpt = getOptionById(selection.proteinId);
    if (!proteinOpt) {
      errors.push(`Invalid protein option selected: '${selection.proteinId}'.`);
    } else if (!proteinOpt.isAvailable) {
      errors.push(`Protein '${proteinOpt.name}' is currently out of stock.`);
    }
  }

  const selectedOptions = getSelectedOptionObjects(selection);

  for (const opt of selectedOptions) {
    if (!opt.isAvailable) {
      errors.push(`Selected option '${opt.name}' is currently unavailable.`);
    }
  }

  if (targetDiet && targetDiet !== 'nonVegetarian') {
    for (const opt of selectedOptions) {
      const pref = opt.dietaryPreference;

      let isCompatible = true;
      if (targetDiet === 'vegan' && pref !== 'vegan') {
        isCompatible = false;
      } else if (targetDiet === 'vegetarian' && pref !== 'vegetarian' && pref !== 'vegan') {
        isCompatible = false;
      } else if (
        targetDiet === 'eggitarian' &&
        pref !== 'eggitarian' &&
        pref !== 'vegetarian' &&
        pref !== 'vegan'
      ) {
        isCompatible = false;
      }

      if (!isCompatible) {
        errors.push(
          `Option '${opt.name}' (${pref}) is incompatible with your selected ${targetDiet} dietary target.`
        );
      }
    }
  }

  const nutrition = calculateMealNutrition(selection);
  if (nutrition.protein < 15 && selection.baseId && selection.proteinId) {
    warnings.push('Low protein total for a performance fuel meal (under 15g).');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    incompatibleDietaryPreference: errors.length > 0 ? targetDiet : undefined,
  };
}
