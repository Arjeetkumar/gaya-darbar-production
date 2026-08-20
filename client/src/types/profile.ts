import type { DietaryPreference, FitnessGoal } from './menu';

export interface UserProfile {
  name: string;
  email: string;
  fitnessGoal: FitnessGoal;
  dietaryPreference: DietaryPreference;
  dailyCalories: number; // in kcal
  dailyProtein: number; // in grams
  dailyCarbs: number; // in grams
  dailyFats: number; // in grams
  favorites: string[]; // array of menuItem IDs
}

export interface ProfileContextType {
  profile: UserProfile;
  updateProfile: (updated: Partial<UserProfile>) => void;
  setGoal: (goal: FitnessGoal) => void;
  setDietaryPreference: (diet: DietaryPreference) => void;
  setNutritionTargets: (targets: {
    dailyCalories: number;
    dailyProtein: number;
    dailyCarbs: number;
    dailyFats: number;
  }) => void;
  toggleFavorite: (itemId: string) => void;
}
