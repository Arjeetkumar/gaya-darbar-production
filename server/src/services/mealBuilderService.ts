import {
  MealBuilderOption,
  type IMealBuilderOption,
} from '../models/MealBuilderOption.js';

export interface MealBuilderQueryFilters {
  category?: string;
  diet?: string;
}

export async function fetchMealBuilderOptions(
  filters: MealBuilderQueryFilters
): Promise<IMealBuilderOption[]> {
  const query: Record<string, unknown> = {
    isAvailable: true,
    isDeleted: { $ne: true },
  };

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.diet) {
    query.dietaryPreference = filters.diet;
  }

  return MealBuilderOption.find(query).sort({ category: 1, price: 1 }).exec();
}
