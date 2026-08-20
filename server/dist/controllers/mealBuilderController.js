import { fetchMealBuilderOptions } from '../services/mealBuilderService.js';
import { AppError } from '../middleware/errorHandler.js';
const VALID_CATEGORIES = ['base', 'protein', 'carb', 'vegetables', 'sauce', 'extras'];
const VALID_DIETS = ['vegetarian', 'nonVegetarian', 'vegan', 'eggitarian'];
export async function getMealBuilderOptions(req, res, next) {
    try {
        const { category, diet } = req.query;
        if (category && typeof category === 'string' && !VALID_CATEGORIES.includes(category)) {
            throw new AppError(`Invalid category parameter '${category}'. Valid categories: ${VALID_CATEGORIES.join(', ')}`, 400);
        }
        if (diet && typeof diet === 'string' && !VALID_DIETS.includes(diet)) {
            throw new AppError(`Invalid diet parameter '${diet}'. Valid diets: ${VALID_DIETS.join(', ')}`, 400);
        }
        const options = await fetchMealBuilderOptions({
            category: category,
            diet: diet,
        });
        res.status(200).json({
            success: true,
            data: options,
        });
    }
    catch (error) {
        next(error);
    }
}
