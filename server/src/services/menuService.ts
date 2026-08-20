import { MenuItem, type IMenuItem } from '../models/MenuItem.js';
import { escapeRegex } from '../utils/escapeRegex.js';

export interface MenuQueryFilters {
  goal?: string;
  diet?: string;
  category?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedMenuResult {
  items: IMenuItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const ALLOWED_SORT_MAP: Record<string, Record<string, 1 | -1>> = {
  recommended: { createdAt: -1 },
  protein_desc: { 'macros.protein': -1 },
  calories_asc: { 'macros.calories': 1 },
  fuelScore_desc: { fuelScore: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
};

export async function fetchMenuItems(
  filters: MenuQueryFilters
): Promise<PaginatedMenuResult> {
  const query: Record<string, unknown> = {
    isAvailable: true,
    isDeleted: { $ne: true },
  };

  // Filter: Goal
  if (filters.goal) {
    query.fitnessGoals = filters.goal;
  }

  // Filter: Diet
  if (filters.diet) {
    query.dietaryPreference = filters.diet;
  }

  // Filter: Category
  if (filters.category) {
    query.category = filters.category;
  }

  // Search filter with regex escaping safeguard
  if (filters.search && filters.search.trim()) {
    const escapedSearch = escapeRegex(filters.search.trim());
    const searchRegex = new RegExp(escapedSearch, 'i');
    query.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { ingredients: searchRegex },
      { tags: searchRegex },
    ];
  }

  // Sorting allowlist
  const sortOption =
    filters.sort && ALLOWED_SORT_MAP[filters.sort]
      ? ALLOWED_SORT_MAP[filters.sort]
      : ALLOWED_SORT_MAP.recommended;

  // Pagination defaults
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(50, Math.max(1, filters.limit || 12));
  const skip = (page - 1) * limit;

  // Execute Count & Query
  const [items, total] = await Promise.all([
    MenuItem.find(query).sort(sortOption).skip(skip).limit(limit).exec(),
    MenuItem.countDocuments(query).exec(),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export async function fetchMenuItemBySlug(slug: string): Promise<IMenuItem | null> {
  return MenuItem.findOne({
    slug: slug.toLowerCase(),
    isAvailable: true,
    isDeleted: { $ne: true },
  }).exec();
}
