import React from 'react';
import { Search, Filter } from 'lucide-react';

interface KitchenFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedPriority: string;
  onPriorityChange: (priority: string) => void;
  activeOnly: boolean;
  onActiveOnlyToggle: () => void;
}

export const KitchenFilters: React.FC<KitchenFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedPriority,
  onPriorityChange,
  activeOnly,
  onActiveOnlyToggle,
}) => {
  const statusOptions: { label: string; value: string }[] = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'Pending', value: 'pending' },
    { label: 'Preparing', value: 'preparing' },
    { label: 'Ready', value: 'ready' },
    { label: 'Completed', value: 'completed' },
  ];

  const priorityOptions: { label: string; value: string }[] = [
    { label: 'All Priorities', value: 'ALL' },
    { label: 'Normal Priority', value: 'normal' },
    { label: 'High Priority', value: 'high' },
    { label: 'Urgent Only', value: 'urgent' },
  ];

  return (
    <div className="mb-6 rounded-2xl border border-[var(--gd-border)] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search Order Number Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search order number (e.g. #GD-8492)..."
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-4 text-xs font-medium text-zinc-800 placeholder-zinc-400 transition-all focus:border-[var(--gd-forest)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--gd-forest)]/20"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active Only Toggle */}
          <button
            type="button"
            onClick={onActiveOnlyToggle}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
              activeOnly
                ? 'bg-[var(--gd-forest)] text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            <Filter size={13} />
            <span>Active Tickets Only</span>
          </button>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs font-semibold text-zinc-700 transition-colors focus:border-[var(--gd-forest)] focus:outline-none"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Priority Dropdown */}
          <select
            value={selectedPriority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs font-semibold text-zinc-700 transition-colors focus:border-[var(--gd-forest)] focus:outline-none"
          >
            {priorityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
