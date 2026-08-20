export default function FoodCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--gd-border)] bg-white animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-[4/3] w-full bg-stone-200" />

      {/* Content Skeleton */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex justify-between items-center gap-3">
          <div className="h-5 w-3/4 rounded bg-stone-200" />
          <div className="h-5 w-12 rounded bg-stone-200" />
        </div>

        <div className="mt-3 space-y-2">
          <div className="h-3 w-full rounded bg-stone-200" />
          <div className="h-3 w-2/3 rounded bg-stone-200" />
        </div>

        {/* Macros Box Skeleton */}
        <div className="mt-4 h-12 rounded-xl bg-stone-100" />

        {/* Button Skeleton */}
        <div className="mt-5 h-10 w-full rounded-xl bg-stone-200" />
      </div>
    </div>
  );
}
