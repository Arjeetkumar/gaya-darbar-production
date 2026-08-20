import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Dumbbell } from 'lucide-react';

export default function EmptyCart() {
  return (
    <div className="mx-auto my-12 max-w-md rounded-3xl border border-[var(--gd-border)] bg-white p-8 text-center shadow-sm animate-gd-fade-up">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--gd-sage)]/70 text-[var(--gd-forest)]">
        <ShoppingBag size={32} />
      </div>

      <h2 className="mt-5 font-display text-2xl sm:text-3xl font-semibold text-[var(--gd-charcoal)]">
        Your Fuel Bag is empty
      </h2>

      <p className="mt-2 text-xs leading-relaxed text-[var(--gd-muted)]">
        Fuel your training with chef-crafted performance meals or create your custom macro bowl.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/menu"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--gd-charcoal)] py-3.5 px-5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-[var(--gd-forest)] shadow-md"
        >
          <span>Explore Menu</span>
          <ArrowRight size={15} />
        </Link>

        <Link
          to="/meal-builder"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--gd-border)] bg-white py-3.5 px-5 text-xs font-bold uppercase tracking-wider text-[var(--gd-charcoal)] transition-all hover:border-[var(--gd-forest)] hover:shadow-sm"
        >
          <Dumbbell size={15} className="text-[var(--gd-forest)]" />
          <span>Build Your Meal</span>
        </Link>
      </div>
    </div>
  );
}
