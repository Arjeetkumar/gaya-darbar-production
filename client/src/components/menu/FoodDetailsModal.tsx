import { useEffect, useState, useCallback } from 'react';
import {
  X,
  Clock,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import type { MenuItem } from '../../types/menu';
import { getRelatedMenuItems } from '../../services/menuService';
import { useCart } from '../../context/CartContext';
import DietaryBadge from './DietaryBadge';
import FuelScoreBadge from './FuelScoreBadge';
import FoodCard from './FoodCard';

interface FoodDetailsModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectRelatedItem?: (relatedItem: MenuItem) => void;
}

const goalLabels: Record<string, string> = {
  muscleGain: 'Build Muscle',
  fatLoss: 'Fat Loss',
  performance: 'Performance',
  eatClean: 'Eat Clean',
};

const categoryLabels: Record<string, string> = {
  highProtein: 'High Protein',
  muscleGain: 'Muscle Gain',
  fatLoss: 'Fat Loss',
  performance: 'Performance',
  preWorkout: 'Pre-Workout',
  postWorkout: 'Post-Workout',
  drinks: 'Drinks & Elixirs',
  desserts: 'Guilt-Free Desserts',
};

export default function FoodDetailsModal({
  item,
  isOpen,
  onClose,
  onSelectRelatedItem,
}: FoodDetailsModalProps) {
  const { addMenuItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);
  const [relatedMeals, setRelatedMeals] = useState<MenuItem[]>([]);

  // Customization options state
  const [selectedPortion, setSelectedPortion] = useState<'standard' | 'extraProtein'>('standard');
  const [selectedSauce, setSelectedSauce] = useState<string>('House Lemon-Herb');

  // Fetch related meals when active item changes
  useEffect(() => {
    if (!item) return;

    let isMounted = true;
    setQuantity(1);
    setSelectedPortion('standard');
    setSelectedSauce('House Lemon-Herb');

    getRelatedMenuItems(item, 3).then((res) => {
      if (isMounted) {
        setRelatedMeals(res);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [item]);

  // Handle Escape key navigation & Body scroll locking
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  // Invalid item state handling
  if (!item) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-gd-fade-in"
        role="dialog"
        aria-modal="true"
      >
        <div className="relative w-full max-w-md rounded-3xl border border-[var(--gd-border)] bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <AlertTriangle size={28} />
          </div>
          <h2 className="mt-5 font-display text-2xl font-semibold text-[var(--gd-charcoal)]">
            That fuel isn't on today's menu.
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-[var(--gd-muted)]">
            The requested item may have been moved or is currently out of stock.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[var(--gd-charcoal)] py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-[var(--gd-forest)]"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  const portionPriceMultiplier = selectedPortion === 'extraProtein' ? 60 : 0;
  const unitPrice = item.price + portionPriceMultiplier;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    addMenuItem(item, quantity, {
      portion: selectedPortion === 'extraProtein' ? 'Extra Protein (+₹60)' : 'Standard Portion',
      sauce: selectedSauce,
    });
    setAddedToast(true);
    setTimeout(() => {
      setAddedToast(false);
    }, 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/65 p-3 sm:p-6 backdrop-blur-sm animate-gd-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="food-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative my-auto flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-[var(--gd-border)] bg-white shadow-2xl">
        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-all hover:bg-black hover:scale-105"
          aria-label="Close food details"
        >
          <X size={18} />
        </button>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="overflow-y-auto p-5 sm:p-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* LEFT: LARGE FOOD PHOTOGRAPHY */}
            <div className="lg:col-span-5">
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-stone-100 shadow-md">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />

                {/* Overlays */}
                <div className="absolute left-3 top-3 right-3 flex items-center justify-between">
                  <DietaryBadge preference={item.dietaryPreference} />
                  <FuelScoreBadge score={item.fuelScore} size="sm" />
                </div>

                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1 text-xs text-white backdrop-blur-md">
                  <Clock size={13} className="text-amber-400" />
                  <span>Prep time: {item.preparationTime} min</span>
                </div>
              </div>

              {/* TAGS & CATEGORIES */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-lg bg-[var(--gd-sage)]/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--gd-forest)]">
                  {categoryLabels[item.category] || item.category}
                </span>

                {item.fitnessGoals.map((g) => (
                  <span
                    key={g}
                    className="rounded-lg bg-stone-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--gd-charcoal)]"
                  >
                    {goalLabels[g] || g}
                  </span>
                ))}
              </div>
            </div>

            {/* RIGHT: FOOD INFORMATION & NUTRITION CARD */}
            <div className="flex flex-col lg:col-span-7">
              {/* Header Title & Price */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="food-modal-title"
                    className="font-display text-2xl sm:text-3xl font-semibold leading-tight text-[var(--gd-charcoal)]"
                  >
                    {item.name}
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--gd-muted)]">
                    {item.description}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-2xl sm:text-3xl font-bold text-[var(--gd-charcoal)]">
                    ₹{item.price}
                  </p>
                </div>
              </div>

              {/* NUTRITION CARD */}
              <div className="mt-6 rounded-2xl border border-[var(--gd-border)] bg-[var(--gd-ivory)] p-4 sm:p-5">
                <div className="flex items-center justify-between border-b border-[var(--gd-border)] pb-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gd-forest)]">
                    NUTRITIONAL PROFILE
                  </p>
                  <span className="text-[10px] font-semibold text-[var(--gd-muted)]">Per Serving</span>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-xl bg-white p-3 border border-[var(--gd-border)]">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--gd-muted)]">
                      Energy
                    </p>
                    <p className="mt-1 font-display text-lg font-bold text-[var(--gd-charcoal)]">
                      {item.macros.calories}
                    </p>
                    <p className="text-[9px] font-semibold text-[var(--gd-muted)]">kcal</p>
                  </div>

                  <div className="rounded-xl bg-emerald-50/70 p-3 border border-emerald-200/60">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-800">
                      Protein
                    </p>
                    <p className="mt-1 font-display text-lg font-bold text-[var(--gd-forest)]">
                      {item.macros.protein}g
                    </p>
                    <p className="text-[9px] font-semibold text-emerald-700">Muscle Fuel</p>
                  </div>

                  <div className="rounded-xl bg-white p-3 border border-[var(--gd-border)]">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--gd-muted)]">
                      Carbs
                    </p>
                    <p className="mt-1 font-display text-lg font-bold text-[var(--gd-charcoal)]">
                      {item.macros.carbs}g
                    </p>
                    <p className="text-[9px] font-semibold text-[var(--gd-muted)]">Stamina</p>
                  </div>

                  <div className="rounded-xl bg-white p-3 border border-[var(--gd-border)]">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--gd-muted)]">
                      Fats
                    </p>
                    <p className="mt-1 font-display text-lg font-bold text-[var(--gd-charcoal)]">
                      {item.macros.fats}g
                    </p>
                    <p className="text-[9px] font-semibold text-[var(--gd-muted)]">Healthy</p>
                  </div>
                </div>
              </div>

              {/* INGREDIENTS */}
              <div className="mt-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--gd-charcoal)]">
                  Fresh Ingredients
                </h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {item.ingredients.map((ingredient) => (
                    <li
                      key={ingredient}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--gd-border)] bg-white px-3 py-1 text-xs text-[var(--gd-charcoal)]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--gd-forest)]" />
                      <span>{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ALLERGENS */}
              <div className="mt-5">
                <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--gd-charcoal)]">
                  Allergen Advisory
                </h3>
                <div className="mt-2.5">
                  {item.allergens.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {item.allergens.map((allergen) => (
                        <span
                          key={allergen}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900"
                        >
                          <AlertTriangle size={13} className="text-amber-600" />
                          <span className="capitalize">{allergen}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="inline-flex items-center gap-1.5 text-xs text-[var(--gd-muted)]">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      <span>No major allergens listed.</span>
                    </p>
                  )}
                </div>
              </div>

              {/* CUSTOMIZATION OPTIONS */}
              <div className="mt-6 rounded-2xl border border-[var(--gd-border)] bg-stone-50/70 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gd-muted)] mb-3">
                  Meal Customization
                </p>

                <div className="space-y-4">
                  {/* Portion Size Option */}
                  <div>
                    <label className="text-xs font-semibold text-[var(--gd-charcoal)] block mb-1.5">
                      Portion Choice
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPortion('standard')}
                        className={`rounded-xl border py-2 px-3 text-xs font-semibold transition-all ${
                          selectedPortion === 'standard'
                            ? 'border-[var(--gd-forest)] bg-white text-[var(--gd-forest)] shadow-sm'
                            : 'border-[var(--gd-border)] bg-white text-[var(--gd-muted)] hover:border-stone-300'
                        }`}
                      >
                        Standard Portion
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPortion('extraProtein')}
                        className={`rounded-xl border py-2 px-3 text-xs font-semibold transition-all ${
                          selectedPortion === 'extraProtein'
                            ? 'border-[var(--gd-forest)] bg-white text-[var(--gd-forest)] shadow-sm'
                            : 'border-[var(--gd-border)] bg-white text-[var(--gd-muted)] hover:border-stone-300'
                        }`}
                      >
                        Extra Protein (+₹60)
                      </button>
                    </div>
                  </div>

                  {/* Dressing / Sauce Choice Option */}
                  <div>
                    <label className="text-xs font-semibold text-[var(--gd-charcoal)] block mb-1.5">
                      House Sauce / Dressing
                    </label>
                    <select
                      value={selectedSauce}
                      onChange={(e) => setSelectedSauce(e.target.value)}
                      className="w-full rounded-xl border border-[var(--gd-border)] bg-white py-2 px-3 text-xs text-[var(--gd-charcoal)] font-medium focus:border-[var(--gd-forest)] focus:outline-none"
                    >
                      <option value="House Lemon-Herb">House Lemon-Herb Vinaigrette</option>
                      <option value="Tandoori Mint Yogurt">Tandoori Mint Yogurt</option>
                      <option value="Tahini Garlic">Tahini Garlic Paste</option>
                      <option value="No Dressing">No Dressing (Side Only)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* QUANTITY & ADD TO BAG ACTION BAR */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-[var(--gd-border)] pt-5">
                {/* Quantity selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--gd-muted)]">
                    Quantity
                  </span>
                  <div className="flex items-center rounded-xl border border-[var(--gd-border)] bg-white p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--gd-charcoal)] transition-colors hover:bg-stone-100 disabled:opacity-40"
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-9 text-center font-display text-sm font-bold text-[var(--gd-charcoal)]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--gd-charcoal)] transition-colors hover:bg-stone-100"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Add Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 px-6 text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md active:scale-[0.98] ${
                    addedToast
                      ? 'bg-emerald-700'
                      : 'bg-[var(--gd-charcoal)] hover:bg-[var(--gd-forest)]'
                  }`}
                >
                  {addedToast ? (
                    <>
                      <Check size={16} />
                      <span>Added to Fuel Bag!</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Add to Fuel Bag • ₹{totalPrice}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* RELATED MEALS SECTION */}
          {relatedMeals.length > 0 && (
            <div className="mt-12 border-t border-[var(--gd-border)] pt-8">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--gd-forest)]">
                    Similar Performance Fuel
                  </p>
                  <h3 className="font-display text-xl font-semibold text-[var(--gd-charcoal)]">
                    You Might Also Like
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedMeals.map((related) => (
                  <div
                    key={related.id}
                    onClick={() => onSelectRelatedItem?.(related)}
                    className="cursor-pointer"
                  >
                    <FoodCard item={related} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
