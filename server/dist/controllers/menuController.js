import { fetchMenuItems, fetchMenuItemBySlug } from '../services/menuService.js';
import { AppError } from '../middleware/errorHandler.js';
const VALID_GOALS = ['muscleGain', 'fatLoss', 'performance', 'eatClean'];
const VALID_DIETS = ['vegetarian', 'nonVegetarian', 'vegan', 'eggitarian'];
const VALID_CATEGORIES = [
    'highProtein',
    'muscleGain',
    'fatLoss',
    'performance',
    'preWorkout',
    'postWorkout',
    'drinks',
    'desserts',
];
const VALID_SORTS = [
    'recommended',
    'protein_desc',
    'calories_asc',
    'fuelScore_desc',
    'price_asc',
    'price_desc',
];
export async function getMenu(req, res, next) {
    try {
        const { goal, diet, category, search, sort, page, limit } = req.query;
        // Validation: Goal
        if (goal && typeof goal === 'string' && !VALID_GOALS.includes(goal)) {
            throw new AppError(`Invalid goal parameter '${goal}'. Valid goals: ${VALID_GOALS.join(', ')}`, 400);
        }
        // Validation: Diet
        if (diet && typeof diet === 'string' && !VALID_DIETS.includes(diet)) {
            throw new AppError(`Invalid diet parameter '${diet}'. Valid diets: ${VALID_DIETS.join(', ')}`, 400);
        }
        // Validation: Category
        if (category && typeof category === 'string' && !VALID_CATEGORIES.includes(category)) {
            throw new AppError(`Invalid category parameter '${category}'. Valid categories: ${VALID_CATEGORIES.join(', ')}`, 400);
        }
        // Validation: Sort
        if (sort && typeof sort === 'string' && !VALID_SORTS.includes(sort)) {
            throw new AppError(`Invalid sort parameter '${sort}'. Valid sorts: ${VALID_SORTS.join(', ')}`, 400);
        }
        // Validation: Page & Limit
        let parsedPage;
        if (page) {
            parsedPage = parseInt(page, 10);
            if (isNaN(parsedPage) || parsedPage < 1) {
                throw new AppError('Page parameter must be a positive integer.', 400);
            }
        }
        let parsedLimit;
        if (limit) {
            parsedLimit = parseInt(limit, 10);
            if (isNaN(parsedLimit) || parsedLimit < 1) {
                throw new AppError('Limit parameter must be a positive integer.', 400);
            }
        }
        const result = await fetchMenuItems({
            goal: typeof goal === 'string' ? goal : undefined,
            diet: typeof diet === 'string' ? diet : undefined,
            category: typeof category === 'string' ? category : undefined,
            search: typeof search === 'string' ? search : undefined,
            sort: typeof sort === 'string' ? sort : undefined,
            page: parsedPage,
            limit: parsedLimit,
        });
        res.status(200).json({
            success: true,
            data: result.items,
            pagination: result.pagination,
        });
    }
    catch (error) {
        next(error);
    }
}
export async function getMenuItem(req, res, next) {
    try {
        const rawSlug = req.params.slug;
        const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
        if (!slug || typeof slug !== 'string' || !slug.trim()) {
            throw new AppError('Slug parameter is required.', 400);
        }
        const item = await fetchMenuItemBySlug(slug.trim());
        if (!item) {
            throw new AppError(`Menu item with slug '${slug}' not found.`, 404);
        }
        res.status(200).json({
            success: true,
            data: item,
        });
    }
    catch (error) {
        next(error);
    }
}
