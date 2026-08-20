import { AlertCircle, AlertTriangle } from 'lucide-react';
import type { MealValidationResult } from '../../types/mealBuilder';

interface BuilderValidationProps {
  validation: MealValidationResult;
}

export default function BuilderValidation({ validation }: BuilderValidationProps) {
  if (validation.isValid && validation.warnings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Validation Errors */}
      {validation.errors.map((err, idx) => (
        <div
          key={idx}
          className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-900"
          role="alert"
        >
          <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-950">Incomplete Meal Selection</p>
            <p className="mt-0.5 text-rose-800">{err}</p>
          </div>
        </div>
      ))}

      {/* Validation Warnings */}
      {validation.warnings.map((warn, idx) => (
        <div
          key={idx}
          className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900"
        >
          <AlertTriangle size={16} className="shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-950">Nutritional Advice</p>
            <p className="mt-0.5 text-amber-800">{warn}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
