import { MENU_ITEMS } from '../data/menuData';
import type {
  DietaryPreference,
  FitnessGoal,
  MealCategory,
  MenuFilterOptions,
  MenuItem,
} from '../types/menu';
import { buildApiUrl } from './apiConfig';

const IS_DEV = import.meta.env.DEV;

/**
 * Menu Service Layer
 *
 * Queries Gaya Darbar REST API (`GET /api/v1/menu`).
 * In DEVELOPMENT mode: Falls back to local data if backend is offline.
 * In PRODUCTION mode: Surfaces real API errors to the application layer.
 */
export async function getAllMenuItems(
  options?: MenuFilterOptions
): Promise<MenuItem[]> {
  try {
    const params = new URLSearchParams();

    if (options?.goal) params.append('goal', options.goal);
    if (options?.diet) params.append('diet', options.diet);
    if (options?.category) params.append('category', options.category);
    if (options?.searchQuery) params.append('search', options.searchQuery);

    if (options?.sortBy) {
      if (options.sortBy === 'protein') params.append('sort', 'protein_desc');
      if (options.sortBy === 'calories') params.append('sort', 'calories_asc');
      if (options.sortBy === 'fuelScore') params.append('sort', 'fuelScore_desc');
      if (options.sortBy === 'price') {
        params.append('sort', options.sortOrder === 'desc' ? 'price_desc' : 'price_asc');
      }
    }

    const url = buildApiUrl(`/api/v1/menu?${params.toString()}`);
    const response = await fetch(url);

    if (response.ok) {
      const json = await response.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data.map((item: any) => ({
          ...item,
          id: item._id || item.id,
        }));
      }
    } else {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || `API error (${response.status})`);
    }
  } catch (error) {
    if (IS_DEV) {
      console.info(
        'Dev Mode Notice: Backend API unavailable. Serving menu from local fallback data layer.',
        error
      );
    } else {
      console.error('Production Menu API Failure:', error);
      throw error;
    }
  }

  // LOCAL FALLBACK LAYER (DEVELOPMENT ONLY)
  let items = [...MENU_ITEMS];

  if (!options) {
    return items;
  }

  const { goal, diet, category, searchQuery, minProtein, maxCalories, sortBy, sortOrder } =
    options;

  if (goal) items = items.filter((item) => item.fitnessGoals.includes(goal));
  if (diet) items = items.filter((item) => item.dietaryPreference === diet);
  if (category) items = items.filter((item) => item.category === category);

  if (searchQuery && searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase().trim();
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.ingredients.some((ing) => ing.toLowerCase().includes(query)) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }

  if (typeof minProtein === 'number') {
    items = items.filter((item) => item.macros.protein >= minProtein);
  }

  if (typeof maxCalories === 'number') {
    items = items.filter((item) => item.macros.calories <= maxCalories);
  }

  if (sortBy) {
    const orderMultiplier = sortOrder === 'desc' ? -1 : 1;
    items.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'protein':
          comparison = a.macros.protein - b.macros.protein;
          break;
        case 'calories':
          comparison = a.macros.calories - b.macros.calories;
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'fuelScore':
          comparison = a.fuelScore - b.fuelScore;
          break;
      }
      return comparison * orderMultiplier;
    });
  }

  return items;
}

export async function getMenuItemById(id: string): Promise<MenuItem | null> {
  return getMenuItemBySlug(id);
}

export async function getMenuItemBySlug(slug: string): Promise<MenuItem | null> {
  try {
    const response = await fetch(buildApiUrl(`/api/v1/menu/${slug}`));
    if (response.ok) {
      const json = await response.json();
      if (json.success && json.data) {
        return {
          ...json.data,
          id: json.data._id || json.data.id,
        };
      }
    } else if (response.status === 404) {
      return null;
    } else {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.error?.message || `API error (${response.status})`);
    }
  } catch (error) {
    if (IS_DEV) {
      console.info('Dev Mode Notice: Backend API unavailable for slug query. Using local fallback.');
    } else {
      console.error('Production MenuItem Slug API Failure:', error);
      throw error;
    }
  }

  const item = MENU_ITEMS.find((m) => m.slug === slug || m.id === slug);
  return item || null;
}

export async function getMenuItemsByGoal(goal: FitnessGoal): Promise<MenuItem[]> {
  return getAllMenuItems({ goal });
}

export async function getMenuItemsByDiet(diet: DietaryPreference): Promise<MenuItem[]> {
  return getAllMenuItems({ diet });
}

export async function getMenuItemsByCategory(category: MealCategory): Promise<MenuItem[]> {
  return getAllMenuItems({ category });
}

export async function searchMenuItems(query: string): Promise<MenuItem[]> {
  return getAllMenuItems({ searchQuery: query });
}

export async function getRelatedMenuItems(
  targetItem: MenuItem,
  limit = 3
): Promise<MenuItem[]> {
  const allItems = await getAllMenuItems();
  return allItems
    .filter(
      (item) =>
        item.id !== targetItem.id &&
        item.slug !== targetItem.slug &&
        (item.category === targetItem.category ||
          item.dietaryPreference === targetItem.dietaryPreference ||
          item.fitnessGoals.some((g) => targetItem.fitnessGoals.includes(g)))
    )
    .slice(0, limit);
}
