import React from 'react';
import { RotateCw, UtensilsCrossed, Clock } from 'lucide-react';

interface KitchenHeaderProps {
  activeCount: number;
  pendingCount: number;
  preparingCount: number;
  readyCount: number;
  lastUpdated: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const KitchenHeader: React.FC<KitchenHeaderProps> = ({
  activeCount,
  pendingCount,
  preparingCount,
  readyCount,
  lastUpdated,
  isRefreshing,
  onRefresh,
}) => {
  const formattedTime = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  return (
    <header className="mb-6 rounded-2xl border border-[var(--gd-border)] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Brand & KDS Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--gd-charcoal)] text-white shadow-md">
            <UtensilsCrossed size={22} className="text-[var(--gd-forest)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--gd-charcoal)]">
                Kitchen Display System
              </h1>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                LIVE KDS
              </span>
            </div>
            <p className="text-xs text-[var(--gd-muted)]">
              Gaya Darbar — Iron & Fuel Operational Control
            </p>
          </div>
        </div>

        {/* Counter Badges & Refresh Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Metrics */}
          <div className="flex items-center gap-2 rounded-xl bg-zinc-100 p-1.5 text-xs font-semibold">
            <div className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-2.5 py-1 text-white">
              <span>Active Total: {activeCount}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-100 px-2.5 py-1 text-amber-800">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Pending: {pendingCount}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-blue-100 px-2.5 py-1 text-blue-800">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Preparing: {preparingCount}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-100 px-2.5 py-1 text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Ready: {readyCount}</span>
            </div>
          </div>

          {/* Last Updated Timestamp & Refresh Button */}
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1 text-[11px] font-medium text-zinc-500 lg:flex">
              <Clock size={13} />
              <span>Updated: {formattedTime}</span>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--gd-forest)] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[var(--gd-charcoal)] disabled:opacity-50"
              title="Refresh Kitchen Tickets"
            >
              <RotateCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
