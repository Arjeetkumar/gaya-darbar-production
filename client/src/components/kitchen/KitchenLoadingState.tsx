import React from 'react';

export const KitchenLoadingState: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((col) => (
        <div
          key={col}
          className="flex flex-col rounded-2xl border border-[var(--gd-border)] bg-zinc-50 p-4 min-h-[500px]"
        >
          <div className="mb-4 h-6 w-32 animate-pulse rounded-lg bg-zinc-200" />
          <div className="space-y-4">
            {[1, 2].map((card) => (
              <div
                key={card}
                className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4"
              >
                <div className="flex justify-between">
                  <div className="h-5 w-24 animate-pulse rounded bg-zinc-200" />
                  <div className="h-5 w-16 animate-pulse rounded bg-zinc-200" />
                </div>
                <div className="h-16 w-full animate-pulse rounded-xl bg-zinc-100" />
                <div className="h-9 w-full animate-pulse rounded-xl bg-zinc-200" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
