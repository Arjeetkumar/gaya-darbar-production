import { useEffect, useState } from 'react';
import type { UserProfile } from '../../types/profile';
import type { MenuItem } from '../../types/menu';
import { getAllMenuItems } from '../../services/menuService';
import FoodCard from '../menu/FoodCard';
import FoodCardSkeleton from '../menu/FoodCardSkeleton';

interface RecommendedMealsProps {
  profile: UserProfile;
  onSelectMeal?: (item: MenuItem) => void;
}

export default function RecommendedMeals({ profile, onSelectMeal }: RecommendedMealsProps) {
  const [meals, setMeals] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getAllMenuItems({
      goal: profile.fitnessGoal,
      diet: profile.dietaryPreference,
    }).then((res) => {
      if (isMounted) {
        // Fallback to general goal items if specific diet + goal combo yields < 2 items
        if (res.length < 2) {
          getAllMenuItems({ goal: profile.fitnessGoal }).then((fallback) => {
            if (isMounted) {
              setMeals(fallback.slice(0, 3));
              setLoading(false);
            }
          });
        } else {
          setMeals(res.slice(0, 3));
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [profile.fitnessGoal, profile.dietaryPreference]);

  return (
    <div className="rounded-3xl border border-[var(--gd-border)] bg-white p-6 shadow-sm">
      <div className="border-b border-[var(--gd-border)] pb-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--gd-forest)]">
          PERSONALIZED RECOMMENDED FUEL
        </p>
        <h2 className="font-display text-xl font-semibold text-[var(--gd-charcoal)]">
          Recommended for your target
        </h2>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FoodCardSkeleton />
            <FoodCardSkeleton />
            <FoodCardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {meals.map((meal) => (
              <FoodCard
                key={meal.id}
                item={meal}
                onSelect={onSelectMeal}
                onAddToCart={onSelectMeal}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
