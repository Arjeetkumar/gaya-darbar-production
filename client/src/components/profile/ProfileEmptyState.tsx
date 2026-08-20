import { Heart, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProfileEmptyStateProps {
  type: 'favorites' | 'orders';
}

export default function ProfileEmptyState({ type }: ProfileEmptyStateProps) {
  if (type === 'favorites') {
    return (
      <div className="rounded-3xl border border-[var(--gd-border)] bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
          <Heart size={24} />
        </div>
        <h3 className="mt-3 font-display text-lg font-semibold text-[var(--gd-charcoal)]">
          No favorite meals saved yet
        </h3>
        <p className="mt-1 text-xs text-[var(--gd-muted)] max-w-sm mx-auto">
          Save meals you love and they'll appear here for quick 1-click reordering.
        </p>
        <Link
          to="/menu"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[var(--gd-charcoal)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-[var(--gd-forest)]"
        >
          <span>Browse Menu</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-[var(--gd-border)] bg-white p-6 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-[var(--gd-muted)]">
        <Clock size={24} />
      </div>
      <h3 className="mt-3 font-display text-lg font-semibold text-[var(--gd-charcoal)]">
        Your recent orders will appear here
      </h3>
      <p className="mt-1 text-xs text-[var(--gd-muted)] max-w-sm mx-auto">
        Track your kitchen status, live delivery progress, and past performance fuel orders once placed.
      </p>
    </div>
  );
}
