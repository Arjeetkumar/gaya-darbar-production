import { useNavigate } from 'react-router-dom';
import { ArrowRight, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import type { CartTotals } from '../../types/cart';
import { useAuth } from '../../context/AuthContext';

interface CartSummaryPanelProps extends CartTotals {
  onClearCart: () => void;
}

export default function CartSummaryPanel({
  itemCount,
  subtotal,
  totalCalories,
  totalProtein,
  totalCarbs,
  totalFats,
  onClearCart,
}: CartSummaryPanelProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleCheckoutClick = () => {
    if (isAuthenticated) {
      navigate('/checkout');
    } else {
      navigate('/login', { state: { from: '/checkout' } });
    }
  };

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-[var(--gd-border)] bg-white p-5 sm:p-6 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--gd-border)] pb-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--gd-forest)]">
            ORDER OVERVIEW
          </p>
          <h2 className="font-display text-2xl font-semibold text-[var(--gd-charcoal)]">
            Fuel Bag Summary
          </h2>
        </div>

        <button
          type="button"
          onClick={onClearCart}
          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors"
          aria-label="Clear all items from fuel bag"
        >
          <RotateCcw size={13} />
          <span>Clear All</span>
        </button>
      </div>

      {/* Item count & Subtotal */}
      <div className="space-y-2 text-xs">
        <div className="flex justify-between text-[var(--gd-muted)]">
          <span>Items Selected</span>
          <span className="font-semibold text-[var(--gd-charcoal)]">{itemCount} items</span>
        </div>
        <div className="flex justify-between border-t border-[var(--gd-border)] pt-2 font-display text-xl font-bold text-[var(--gd-charcoal)]">
          <span>Subtotal</span>
          <span className="text-[var(--gd-forest)]">₹{subtotal}</span>
        </div>
      </div>

      {/* COMBINED NUTRITION SUMMARY */}
      <div className="rounded-2xl border border-[var(--gd-border)] bg-[var(--gd-ivory)] p-4">
        <div className="flex items-center justify-between border-b border-[var(--gd-border)] pb-2.5">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--gd-forest)]">
            BAG NUTRITION TOTALS
          </p>
          <div className="flex items-center gap-1 text-[10px] font-bold text-[var(--gd-charcoal)]">
            <Sparkles size={11} className="text-amber-400" />
            <span>Optimal Fuel</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
          <div className="rounded-xl bg-white p-2.5 border border-[var(--gd-border)]">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--gd-muted)]">Energy</p>
            <p className="font-bold text-[var(--gd-charcoal)] text-sm mt-0.5">{totalCalories}</p>
            <p className="text-[8px] font-medium text-[var(--gd-muted)]">kcal</p>
          </div>

          <div className="rounded-xl bg-emerald-50/80 p-2.5 border border-emerald-200/60">
            <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-800">Protein</p>
            <p className="font-bold text-[var(--gd-forest)] text-sm mt-0.5">{totalProtein}g</p>
            <p className="text-[8px] font-medium text-emerald-700">Muscle</p>
          </div>

          <div className="rounded-xl bg-white p-2.5 border border-[var(--gd-border)]">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--gd-muted)]">Carbs</p>
            <p className="font-bold text-[var(--gd-charcoal)] text-sm mt-0.5">{totalCarbs}g</p>
            <p className="text-[8px] font-medium text-[var(--gd-muted)]">Stamina</p>
          </div>

          <div className="rounded-xl bg-white p-2.5 border border-[var(--gd-border)]">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--gd-muted)]">Fats</p>
            <p className="font-bold text-[var(--gd-charcoal)] text-sm mt-0.5">{totalFats}g</p>
            <p className="text-[8px] font-medium text-[var(--gd-muted)]">Healthy</p>
          </div>
        </div>
      </div>

      {/* Trust & Guarantee */}
      <div className="flex items-center gap-2 text-[11px] text-[var(--gd-muted)]">
        <ShieldCheck size={16} className="text-[var(--gd-forest)] shrink-0" />
        <span>Freshly prepared daily with macro-tracked precision.</span>
      </div>

      {/* CHECKOUT ACTION BUTTON */}
      <div>
        <button
          type="button"
          onClick={handleCheckoutClick}
          disabled={itemCount === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 px-6 text-xs font-bold uppercase tracking-wider text-white bg-[var(--gd-charcoal)] hover:bg-[var(--gd-forest)] transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
        >
          <span>Continue to Checkout • ₹{subtotal}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
