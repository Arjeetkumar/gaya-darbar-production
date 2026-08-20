import { Plus, Minus, Trash2, Sparkles } from 'lucide-react';
import type { CartItem } from '../../types/cart';
import DietaryBadge from '../menu/DietaryBadge';

interface CartItemCardProps {
  item: CartItem;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function CartItemCard({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}: CartItemCardProps) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-[var(--gd-border)] bg-white p-4 sm:p-5 shadow-sm transition-all hover:border-[var(--gd-forest)]/30 sm:flex-row sm:items-center sm:justify-between">
      {/* Image & Main Info */}
      <div className="flex gap-4 items-start sm:items-center flex-1">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-stone-100">
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute top-1 left-1">
            <DietaryBadge preference={item.dietaryPreference} showLabel={false} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-semibold text-[var(--gd-charcoal)] truncate">
              {item.name}
            </h3>
            <span className="shrink-0 flex items-center gap-0.5 rounded-full bg-[var(--gd-charcoal)] px-2 py-0.5 text-[9px] font-bold text-white">
              <Sparkles size={10} className="text-amber-400" />
              <span>Fuel {item.fuelScore}</span>
            </span>
          </div>

          {/* Custom Meal Ingredients summary */}
          {item.itemType === 'CUSTOM_MEAL' && item.customIngredients && (
            <p className="mt-1 text-xs text-[var(--gd-muted)] line-clamp-2">
              <span className="font-medium text-[var(--gd-charcoal)]">Ingredients:</span>{' '}
              {item.customIngredients.join(', ')}
            </p>
          )}

          {/* Portion/Sauce options summary */}
          {item.itemType === 'MENU_ITEM' && (item.portionChoice || item.sauceChoice) && (
            <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-[var(--gd-muted)]">
              {item.portionChoice && <span>Portion: {item.portionChoice}</span>}
              {item.sauceChoice && <span>• Sauce: {item.sauceChoice}</span>}
            </div>
          )}

          {/* Macros Bar */}
          <div className="mt-2 flex items-center gap-3 text-xs text-[var(--gd-muted)]">
            <span className="font-semibold text-[var(--gd-forest)]">
              {item.nutrition.protein * item.quantity}g Protein
            </span>
            <span>•</span>
            <span>{item.nutrition.calories * item.quantity} kcal</span>
          </div>
        </div>
      </div>

      {/* Quantity & Pricing Controls */}
      <div className="flex items-center justify-between gap-4 border-t border-[var(--gd-border)] pt-3 sm:border-t-0 sm:pt-0 sm:justify-end">
        {/* Quantity Selector */}
        <div className="flex items-center rounded-xl border border-[var(--gd-border)] bg-[var(--gd-ivory)] p-1">
          <button
            type="button"
            onClick={() => onDecrease(item.id)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--gd-charcoal)] transition-colors hover:bg-stone-200"
            aria-label={`Decrease quantity of ${item.name}`}
          >
            <Minus size={13} />
          </button>

          <span className="w-8 text-center font-display text-sm font-bold text-[var(--gd-charcoal)]">
            {item.quantity}
          </span>

          <button
            type="button"
            onClick={() => onIncrease(item.id)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--gd-charcoal)] transition-colors hover:bg-stone-200"
            aria-label={`Increase quantity of ${item.name}`}
          >
            <Plus size={13} />
          </button>
        </div>

        {/* Price */}
        <div className="text-right shrink-0 min-w-[70px]">
          <p className="font-display text-base font-bold text-[var(--gd-charcoal)]">
            ₹{item.totalPrice}
          </p>
          {item.quantity > 1 && (
            <p className="text-[10px] font-medium text-[var(--gd-muted)]">
              ₹{item.unitPrice} each
            </p>
          )}
        </div>

        {/* Remove Button */}
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
          aria-label={`Remove ${item.name} from fuel bag`}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}
