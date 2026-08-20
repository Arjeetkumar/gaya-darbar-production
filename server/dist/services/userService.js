import { User } from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
const VALID_GOALS = ['muscleGain', 'fatLoss', 'performance', 'eatClean'];
const VALID_DIETS = ['vegetarian', 'nonVegetarian', 'vegan', 'eggitarian'];
export async function updateUserProfile(userId, input) {
    const user = await User.findById(userId);
    if (!user || user.isDeleted || !user.isActive) {
        throw new AppError('User not found or inactive.', 404);
    }
    // Sanitize & Validate updates
    if (typeof input.name === 'string') {
        const trimmed = input.name.trim();
        if (!trimmed) {
            throw new AppError('Name cannot be empty.', 400);
        }
        user.name = trimmed;
    }
    if (input.fitnessGoal) {
        if (!VALID_GOALS.includes(input.fitnessGoal)) {
            throw new AppError(`Invalid fitnessGoal parameter '${input.fitnessGoal}'. Valid options: ${VALID_GOALS.join(', ')}`, 400);
        }
        user.fitnessGoal = input.fitnessGoal;
    }
    if (input.dietaryPreference) {
        if (!VALID_DIETS.includes(input.dietaryPreference)) {
            throw new AppError(`Invalid dietaryPreference parameter '${input.dietaryPreference}'. Valid options: ${VALID_DIETS.join(', ')}`, 400);
        }
        user.dietaryPreference = input.dietaryPreference;
    }
    if (input.nutritionTargets) {
        const { calories, protein, carbs, fats } = input.nutritionTargets;
        user.nutritionTargets = {
            calories: typeof calories === 'number' ? Math.max(500, Math.min(10000, calories)) : user.nutritionTargets.calories,
            protein: typeof protein === 'number' ? Math.max(0, Math.min(500, protein)) : user.nutritionTargets.protein,
            carbs: typeof carbs === 'number' ? Math.max(0, Math.min(1000, carbs)) : user.nutritionTargets.carbs,
            fats: typeof fats === 'number' ? Math.max(0, Math.min(300, fats)) : user.nutritionTargets.fats,
        };
    }
    await user.save();
    return user.toSafeObject();
}
