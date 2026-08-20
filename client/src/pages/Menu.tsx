import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  X,
  Dumbbell,
  Flame,
  Target,
  Leaf,
  RotateCcw,
  AlertCircle,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';
import type {
  DietaryPreference,
  FitnessGoal,
  MealCategory,
  MenuFilterOptions,
  MenuItem,
} from '../types/menu';
import { getAllMenuItems, getMenuItemBySlug } from '../services/menuService';
import FoodCard from '../components/menu/FoodCard';
import FoodCardSkeleton from '../components/menu/FoodCardSkeleton';
import FoodDetailsModal from '../components/menu/FoodDetailsModal';

// Filter configuration constants
const GOALS: { id: FitnessGoal | 'all'; label: string; icon: typeof Dumbbell }[] = [
  { id: 'all', label: 'All Goals', icon: SlidersHorizontal },
  { id: 'muscleGain', label: 'Build Muscle', icon: Dumbbell },
  { id: 'fatLoss', label: 'Lose Fat', icon: Flame },
  { id: 'performance', label: 'Performance', icon: Target },
  { id: 'eatClean', label: 'Eat Clean', icon: Leaf },
];

const DIETS: { id: DietaryPreference | 'all'; label: string }[] = [
  { id: 'all', label: 'All Diets' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'nonVegetarian', label: 'Non-Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'eggitarian', label: 'Eggitarian' },
];

const CATEGORIES: { id: MealCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Categories' },
  { id: 'highProtein', label: 'High Protein' },
  { id: 'muscleGain', label: 'Muscle Gain' },
  { id: 'fatLoss', label: 'Fat Loss' },
  { id: 'performance', label: 'Performance' },
  { id: 'preWorkout', label: 'Pre-Workout' },
  { id: 'postWorkout', label: 'Post-Workout' },
  { id: 'drinks', label: 'Drinks & Elixirs' },
  { id: 'desserts', label: 'Guilt-Free Desserts' },
];

type SortKey =
  | 'recommended'
  | 'highestProtein'
  | 'lowestCalories'
  | 'highestFuelScore'
  | 'priceLowHigh'
  | 'priceHighLow';

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'highestProtein', label: 'Highest Protein' },
  { id: 'lowestCalories', label: 'Lowest Calories' },
  { id: 'highestFuelScore', label: 'Highest Fuel Score' },
  { id: 'priceLowHigh', label: 'Price: Low to High' },
  { id: 'priceHighLow', label: 'Price: High to Low' },
];

export default function Menu() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract filter parameters from URL or set defaults
  const [selectedGoal, setSelectedGoal] = useState<FitnessGoal | 'all'>(
    (searchParams.get('goal') as FitnessGoal) || 'all'
  );
  const [selectedDiet, setSelectedDiet] = useState<DietaryPreference | 'all'>(
    (searchParams.get('diet') as DietaryPreference) || 'all'
  );
  const [selectedCategory, setSelectedCategory] = useState<MealCategory | 'all'>(
    (searchParams.get('category') as MealCategory) || 'all'
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get('search') || ''
  );
  const [selectedSort, setSelectedSort] = useState<SortKey>('recommended');

  // Food details modal state
  const [selectedModalItem, setSelectedModalItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Async data state
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sync state to URL search parameters for linkability
  const updateUrlParams = useCallback(
    (
      goal: FitnessGoal | 'all',
      diet: DietaryPreference | 'all',
      category: MealCategory | 'all',
      search: string,
      itemSlug?: string
    ) => {
      const params = new URLSearchParams();
      if (goal !== 'all') params.set('goal', goal);
      if (diet !== 'all') params.set('diet', diet);
      if (category !== 'all') params.set('category', category);
      if (search.trim()) params.set('search', search.trim());
      if (itemSlug) params.set('item', itemSlug);
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  // Handle URL deep linking to specific food item
  useEffect(() => {
    const itemParam = searchParams.get('item');
    if (itemParam) {
      getMenuItemBySlug(itemParam).then((found) => {
        if (found) {
          setSelectedModalItem(found);
        } else {
          // Trigger invalid item state modal
          setSelectedModalItem(null);
        }
        setIsModalOpen(true);
      });
    }
  }, [searchParams]);

  // Fetch items from menuService using configured filters
  const fetchMenuData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const options: MenuFilterOptions = {};

      if (selectedGoal !== 'all') options.goal = selectedGoal;
      if (selectedDiet !== 'all') options.diet = selectedDiet;
      if (selectedCategory !== 'all') options.category = selectedCategory;
      if (searchQuery.trim()) options.searchQuery = searchQuery.trim();

      // Configure sorting options
      switch (selectedSort) {
        case 'highestProtein':
          options.sortBy = 'protein';
          options.sortOrder = 'desc';
          break;
        case 'lowestCalories':
          options.sortBy = 'calories';
          options.sortOrder = 'asc';
          break;
        case 'highestFuelScore':
          options.sortBy = 'fuelScore';
          options.sortOrder = 'desc';
          break;
        case 'priceLowHigh':
          options.sortBy = 'price';
          options.sortOrder = 'asc';
          break;
        case 'priceHighLow':
          options.sortBy = 'price';
          options.sortOrder = 'desc';
          break;
        default:
          break;
      }

      const result = await getAllMenuItems(options);
      setItems(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load menu items.');
    } finally {
      setLoading(false);
    }
  }, [selectedGoal, selectedDiet, selectedCategory, searchQuery, selectedSort]);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  // Handlers for modal opening/closing
  const handleOpenModal = (item: MenuItem) => {
    setSelectedModalItem(item);
    setIsModalOpen(true);
    updateUrlParams(selectedGoal, selectedDiet, selectedCategory, searchQuery, item.slug);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedModalItem(null);
    updateUrlParams(selectedGoal, selectedDiet, selectedCategory, searchQuery, undefined);
  };

  // Handler for resetting all filters
  const handleResetFilters = () => {
    setSelectedGoal('all');
    setSelectedDiet('all');
    setSelectedCategory('all');
    setSearchQuery('');
    setSelectedSort('recommended');
    updateUrlParams('all', 'all', 'all', '');
  };

  // Handler for goal change
  const handleGoalChange = (goal: FitnessGoal | 'all') => {
    setSelectedGoal(goal);
    updateUrlParams(goal, selectedDiet, selectedCategory, searchQuery);
  };

  // Handler for diet change
  const handleDietChange = (diet: DietaryPreference | 'all') => {
    setSelectedDiet(diet);
    updateUrlParams(selectedGoal, diet, selectedCategory, searchQuery);
  };

  // Handler for category change
  const handleCategoryChange = (category: MealCategory | 'all') => {
    setSelectedCategory(category);
    updateUrlParams(selectedGoal, selectedDiet, category, searchQuery);
  };

  const hasActiveFilters =
    selectedGoal !== 'all' ||
    selectedDiet !== 'all' ||
    selectedCategory !== 'all' ||
    searchQuery.trim() !== '' ||
    selectedSort !== 'recommended';

  return (
    <main className="min-h-screen bg-[var(--gd-ivory)] py-12 lg:py-16">
      <div className="gd-container">
        {/* HEADER SECTION */}
        <header className="max-w-3xl">
          <p className="inline-block rounded-full bg-[var(--gd-sage)]/60 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--gd-forest)]">
            THE FUEL MENU
          </p>

          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-[var(--gd-charcoal)] md:text-5xl lg:text-6xl">
            Eat for the way <span className="text-[var(--gd-forest)]">you train.</span>
          </h1>

          <p className="mt-4 text-base leading-relaxed text-[var(--gd-muted)] md:text-lg">
            Chef-crafted, performance-focused nutrition designed around your macro targets,
            workout recovery, and dietary preferences.
          </p>
        </header>

        {/* GOAL SELECTOR BAR */}
        <section className="mt-10" aria-label="Fitness Goal Filter">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gd-muted)] mb-3">
            Select Your Goal
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {GOALS.map((goal) => {
              const Icon = goal.icon;
              const isSelected = selectedGoal === goal.id;

              return (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => handleGoalChange(goal.id)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-semibold transition-all duration-300 ${
                    isSelected
                      ? 'bg-[var(--gd-charcoal)] text-white shadow-md'
                      : 'border border-[var(--gd-border)] bg-white text-[var(--gd-charcoal)] hover:border-[var(--gd-forest)] hover:shadow-sm'
                  }`}
                  aria-pressed={isSelected}
                >
                  <Icon size={16} className={isSelected ? 'text-amber-400' : 'text-[var(--gd-forest)]'} />
                  <span>{goal.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* DIETARY PREFERENCE & CATEGORY TOOLBAR */}
        <div className="mt-8 space-y-5 rounded-3xl border border-[var(--gd-border)] bg-white p-5 sm:p-6 shadow-sm">
          {/* DIET PILLS */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gd-muted)] mb-3">
              Dietary Preference
            </p>
            <div className="flex flex-wrap gap-2">
              {DIETS.map((diet) => {
                const isSelected = selectedDiet === diet.id;
                return (
                  <button
                    key={diet.id}
                    type="button"
                    onClick={() => handleDietChange(diet.id)}
                    className={`rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 ${
                      isSelected
                        ? 'bg-[var(--gd-forest)] text-white font-semibold shadow-sm'
                        : 'bg-[var(--gd-ivory)] text-[var(--gd-charcoal)] hover:bg-stone-200/70'
                    }`}
                    aria-pressed={isSelected}
                  >
                    {diet.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px w-full bg-[var(--gd-border)]" />

          {/* SEARCH & SORT & CATEGORY BAR */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--gd-muted)]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  updateUrlParams(selectedGoal, selectedDiet, selectedCategory, e.target.value);
                }}
                placeholder="Search meals, ingredients, or tags..."
                className="w-full rounded-xl border border-[var(--gd-border)] bg-[var(--gd-ivory)] py-2.5 pl-10 pr-9 text-xs text-[var(--gd-charcoal)] placeholder-[var(--gd-muted)] transition-colors focus:border-[var(--gd-forest)] focus:bg-white focus:outline-none"
                aria-label="Search meals"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    updateUrlParams(selectedGoal, selectedDiet, selectedCategory, '');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gd-muted)] hover:text-[var(--gd-charcoal)]"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Sort & Reset Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Dropdown/Scroll */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value as MealCategory | 'all')}
                  className="appearance-none rounded-xl border border-[var(--gd-border)] bg-[var(--gd-ivory)] py-2.5 pl-3.5 pr-8 text-xs font-semibold text-[var(--gd-charcoal)] transition-colors focus:border-[var(--gd-forest)] focus:outline-none"
                  aria-label="Filter by category"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gd-muted)]"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value as SortKey)}
                  className="appearance-none rounded-xl border border-[var(--gd-border)] bg-[var(--gd-ivory)] py-2.5 pl-3.5 pr-8 text-xs font-semibold text-[var(--gd-charcoal)] transition-colors focus:border-[var(--gd-forest)] focus:outline-none"
                  aria-label="Sort meals"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gd-muted)]"
                />
              </div>

              {/* Clear All Filters Button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--gd-border)] bg-stone-100 px-3 py-2.5 text-xs font-semibold text-[var(--gd-charcoal)] transition-all hover:bg-stone-200"
                  aria-label="Reset all filters"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RESULTS METRICS SUMMARY */}
        <div className="mt-8 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--gd-muted)]">
            Showing {!loading ? items.length : '...'} Performance Meals
          </p>
        </div>

        {/* CONTENT AREA: LOADING / ERROR / EMPTY / FOOD GRID */}
        <section className="mt-6">
          {/* LOADING STATE */}
          {loading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <FoodCardSkeleton key={index} />
              ))}
            </div>
          )}

          {/* ERROR STATE */}
          {!loading && error && (
            <div className="mx-auto my-12 max-w-md rounded-3xl border border-rose-200 bg-rose-50/50 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <AlertCircle size={24} />
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold text-rose-950">
                Failed to Load Menu
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-rose-700">{error}</p>
              <button
                type="button"
                onClick={fetchMenuData}
                className="mt-6 rounded-xl bg-rose-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-rose-950"
              >
                Try Again
              </button>
            </div>
          )}

          {/* EMPTY STATE */}
          {!loading && !error && items.length === 0 && (
            <div className="mx-auto my-12 max-w-md rounded-3xl border border-[var(--gd-border)] bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--gd-sage)] text-[var(--gd-forest)]">
                <Search size={28} />
              </div>
              <h2 className="mt-5 font-display text-2xl font-semibold text-[var(--gd-charcoal)]">
                No fuel matched your filters
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-[var(--gd-muted)]">
                Try adjusting your fitness goal, dietary preferences, or search keywords to explore more options.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--gd-charcoal)] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-[var(--gd-forest)] hover:shadow-md"
              >
                <RotateCcw size={14} />
                <span>Reset Filters</span>
              </button>
            </div>
          )}

          {/* FOOD CARDS GRID */}
          {!loading && !error && items.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <FoodCard
                  key={item.id}
                  item={item}
                  onSelect={handleOpenModal}
                  onAddToCart={handleOpenModal}
                />
              ))}
            </div>
          )}
        </section>

        {/* FOOD DETAILS MODAL */}
        <FoodDetailsModal
          item={selectedModalItem}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSelectRelatedItem={(related) => handleOpenModal(related)}
        />
      </div>
    </main>
  );
}
