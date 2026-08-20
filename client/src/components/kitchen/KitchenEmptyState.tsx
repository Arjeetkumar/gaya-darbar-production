import React from 'react';
import { CheckCircle } from 'lucide-react';

export const KitchenEmptyState: React.FC = () => {
  return (
    <div className="mx-auto my-12 max-w-md rounded-2xl border border-[var(--gd-border)] bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckCircle size={32} />
      </div>
      <h3 className="font-display text-xl font-bold text-[var(--gd-charcoal)] mb-1">
        All Clear in the Kitchen!
      </h3>
      <p className="text-xs text-[var(--gd-muted)]">
        No active kitchen tickets found matching your current filter criteria. New customer orders will automatically appear here in real time.
      </p>
    </div>
  );
};
