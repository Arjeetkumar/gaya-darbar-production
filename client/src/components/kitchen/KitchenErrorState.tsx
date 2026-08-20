import React from 'react';
import { AlertOctagon, RotateCw } from 'lucide-react';

interface KitchenErrorStateProps {
  message: string;
  onRetry: () => void;
}

export const KitchenErrorState: React.FC<KitchenErrorStateProps> = ({ message, onRetry }) => {
  return (
    <div className="mx-auto my-12 max-w-lg rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
        <AlertOctagon size={28} />
      </div>
      <h3 className="font-display text-lg font-bold text-red-900 mb-1">
        KDS Connection Failed
      </h3>
      <p className="text-xs font-medium text-red-700 mb-6">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-red-700"
      >
        <RotateCw size={14} />
        <span>Retry Connection</span>
      </button>
    </div>
  );
};
