import type { Allergen, DietaryPreference } from './menu';

export type BuilderCategory =
  | 'base'
  | 'protein'
  | 'carb'
  | 'vegetables'
  | 'sauce'
  | 'extras';

export interface MealBuilderOption {
  id: string;
  name: string;
  description: string;
  category: BuilderCategory;
  price: number; // in INR (₹)
  calories: number; // in kcal
  protein: number; // in grams
  carbs: number; // in grams
  fats: number; // in grams
  dietaryPreference: DietaryPreference;
  allergens: Allergen[];
  tags: string[];
  isAvailable: boolean;
}

export interface MealBuilderSelection {
  baseId?: string;
  proteinId?: string;
  carbId?: string;
  vegetableIds: string[];
  sauceIds: string[];
  extraIds: string[];
}

export interface MealNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface MealPrice {
  basePrice: number;
  optionsPrice: number;
  totalPrice: number;
}

export interface MealValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  incompatibleDietaryPreference?: DietaryPreference;
}

export interface MealBuilderState {
  selection: MealBuilderSelection;
  activeCategory: BuilderCategory;
  targetDiet?: DietaryPreference;
}
