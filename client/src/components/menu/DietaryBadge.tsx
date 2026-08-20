import type { DietaryPreference } from '../../types/menu';

interface DietaryBadgeProps {
  preference: DietaryPreference;
  showLabel?: boolean;
}

export default function DietaryBadge({ preference, showLabel = true }: DietaryBadgeProps) {
  switch (preference) {
    case 'vegetarian':
      return (
        <div
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-50/90 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 backdrop-blur-sm"
          title="Vegetarian"
          aria-label="Vegetarian"
        >
          <span className="flex h-3 w-3 items-center justify-center rounded-sm border border-emerald-600 p-[1px]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
          </span>
          {showLabel && <span>Veg</span>}
        </div>
      );
    case 'nonVegetarian':
      return (
        <div
          className="inline-flex items-center gap-1.5 rounded-full border border-rose-600/30 bg-rose-50/90 px-2.5 py-0.5 text-[11px] font-semibold text-rose-800 backdrop-blur-sm"
          title="Non-Vegetarian"
          aria-label="Non-Vegetarian"
        >
          <span className="flex h-3 w-3 items-center justify-center rounded-sm border border-rose-600 p-[1px]">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
          </span>
          {showLabel && <span>Non-Veg</span>}
        </div>
      );
    case 'vegan':
      return (
        <div
          className="inline-flex items-center gap-1.5 rounded-full border border-teal-600/30 bg-teal-50/90 px-2.5 py-0.5 text-[11px] font-semibold text-teal-800 backdrop-blur-sm"
          title="Vegan"
          aria-label="Vegan"
        >
          <span className="flex h-3 w-3 items-center justify-center rounded-sm border border-teal-600 p-[1px]">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
          </span>
          {showLabel && <span>Vegan</span>}
        </div>
      );
    case 'eggitarian':
      return (
        <div
          className="inline-flex items-center gap-1.5 rounded-full border border-amber-600/30 bg-amber-50/90 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 backdrop-blur-sm"
          title="Eggitarian"
          aria-label="Eggitarian"
        >
          <span className="flex h-3 w-3 items-center justify-center rounded-sm border border-amber-600 p-[1px]">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
          </span>
          {showLabel && <span>Eggitarian</span>}
        </div>
      );
    default:
      return null;
  }
}
