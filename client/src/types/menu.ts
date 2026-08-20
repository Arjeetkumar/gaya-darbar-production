export type DietaryPreference = 'vegetarian' | 'nonVegetarian' | 'vegan' | 'eggitarian';

export type FitnessGoal = 'muscleGain' | 'fatLoss' | 'performance' | 'eatClean';

export type MealCategory =
  | 'highProtein'
  | 'muscleGain'
  | 'fatLoss'
  | 'performance'
  | 'preWorkout'
  | 'postWorkout'
  | 'drinks'
  | 'desserts';

export type Allergen =
  | 'dairy'
  | 'nuts'
  | 'peanuts'
  | 'soy'
  | 'gluten'
  | 'eggs'
  | 'fish'
  | 'sesame';

export interface MacroInfo {
  calories: number; // total energy in kcal
  protein: number;  // protein in grams
  carbs: number;    // carbohydrates in grams
  fats: number;     // fats in grams
}

export interface MenuItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number; // Price in INR (₹)
  image: string;
  category: MealCategory;
  dietaryPreference: DietaryPreference;
  fitnessGoals: FitnessGoal[];
  macros: MacroInfo;
  ingredients: string[];
  allergens: Allergen[];
  fuelScore: number; // Rating (1-100) indicating nutritional quality & goal alignment
  preparationTime: number; // Estimated preparation time in minutes
  isAvailable: boolean;
  tags: string[];
}

export interface MenuFilterOptions {
  goal?: FitnessGoal;
  diet?: DietaryPreference;
  category?: MealCategory;
  searchQuery?: string;
  minProtein?: number;
  maxCalories?: number;
  sortBy?: 'protein' | 'calories' | 'price' | 'fuelScore';
  sortOrder?: 'asc' | 'desc';
}
