import { MealBuilderOption, } from '../models/MealBuilderOption.js';
export async function fetchMealBuilderOptions(filters) {
    const query = {
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
