import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import { getUserOrders } from '../services/orderService';
import type { Order } from '../types/order';
import ProfileHeader from '../components/profile/ProfileHeader';
import GoalSelector from '../components/profile/GoalSelector';
import DietaryPreferenceSelector from '../components/profile/DietaryPreferenceSelector';
import NutritionTargets from '../components/profile/NutritionTargets';
import NutritionProgress from '../components/profile/NutritionProgress';
import RecommendedMeals from '../components/profile/RecommendedMeals';
import ProfileEmptyState from '../components/profile/ProfileEmptyState';
import FoodDetailsModal from '../components/menu/FoodDetailsModal';
import type { MenuItem } from '../types/menu';
import { X, Check, PackageCheck, ArrowRight } from 'lucide-react';
import type { DietaryPreference, FitnessGoal } from '../types/menu';

export default function Profile() {
  const { profile, updateProfile, setGoal, setDietaryPreference, setNutritionTargets } =
    useProfile();
  const { isAuthenticated } = useAuth();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editGoal, setEditGoal] = useState<FitnessGoal>(profile.fitnessGoal);
  const [editDiet, setEditDiet] = useState<DietaryPreference>(profile.dietaryPreference);

  // Live order history state
  const [orders, setOrders] = useState<Order[]>([]);

  // Recommended meal detail modal
  const [selectedMeal, setSelectedMeal] = useState<MenuItem | null>(null);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      if (!isAuthenticated) return;
      try {
        const userOrders = await getUserOrders();
        setOrders(userOrders);
      } catch (err) {
        console.warn('Failed to load user order history:', err);
      }
    }

    fetchHistory();
  }, [isAuthenticated]);

  const handleOpenEdit = () => {
    setEditName(profile.name);
    setEditGoal(profile.fitnessGoal);
    setEditDiet(profile.dietaryPreference);
    setIsEditModalOpen(true);
  };

  const handleSaveEditProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: editName.trim() || 'Athlete Guest',
      fitnessGoal: editGoal,
      dietaryPreference: editDiet,
    });
    setIsEditModalOpen(false);
  };

  return (
    <main className="min-h-screen bg-[var(--gd-ivory)] py-12 lg:py-16">
      <div className="gd-container space-y-8">
        {/* PAGE HEADER */}
        <header className="max-w-3xl">
          <p className="inline-block rounded-full bg-[var(--gd-sage)]/60 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--gd-forest)]">
            NUTRITION DASHBOARD
          </p>

          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-[var(--gd-charcoal)] md:text-5xl lg:text-6xl">
            Your food should <span className="text-[var(--gd-forest)]">work around your goals.</span>
          </h1>

          <p className="mt-4 text-base leading-relaxed text-[var(--gd-muted)] md:text-lg">
            Manage your daily macro targets, training objectives, dietary preferences, and personalized fuel recommendations.
          </p>
        </header>

        {/* PROFILE HEADER CARD */}
        <ProfileHeader profile={profile} onEditClick={handleOpenEdit} />

        {/* TODAY'S MACRO PROGRESS DASHBOARD */}
        <NutritionProgress profile={profile} />

        {/* TARGET MACROS SECTION */}
        <NutritionTargets profile={profile} onSaveTargets={setNutritionTargets} />

        {/* GOAL SELECTOR */}
        <GoalSelector selectedGoal={profile.fitnessGoal} onSelectGoal={setGoal} />

        {/* DIETARY PREFERENCE SELECTOR */}
        <DietaryPreferenceSelector
          selectedDiet={profile.dietaryPreference}
          onSelectDiet={setDietaryPreference}
        />

        {/* RECOMMENDED MEALS */}
        <RecommendedMeals
          profile={profile}
          onSelectMeal={(item) => {
            setSelectedMeal(item);
            setIsMealModalOpen(true);
          }}
        />

        {/* FAVORITES & RECENT ORDERS SECTIONS */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h2 className="mb-4 font-display text-xl font-semibold text-[var(--gd-charcoal)]">
              Favorite Meals
            </h2>
            <ProfileEmptyState type="favorites" />
          </div>

          <div>
            <h2 className="mb-4 font-display text-xl font-semibold text-[var(--gd-charcoal)]">
              Recent Orders
            </h2>
            {isAuthenticated && orders.length > 0 ? (
              <div className="space-y-3">
                {orders.map((ord) => (
                  <Link
                    key={ord.id}
                    to={`/order/${ord.orderNumber}`}
                    className="flex items-center justify-between p-4 rounded-2xl border border-[var(--gd-border)] bg-white hover:border-[var(--gd-forest)] transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-800 flex items-center justify-center font-bold text-xs">
                        <PackageCheck size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-xs text-[var(--gd-charcoal)] group-hover:text-[var(--gd-forest)] transition-colors">
                          {ord.orderNumber}
                        </p>
                        <p className="text-[10px] text-[var(--gd-muted)]">
                          {ord.items.length} items • ₹{ord.total} • {ord.orderType}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        {ord.status}
                      </span>
                      <ArrowRight size={14} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <ProfileEmptyState type="orders" />
            )}
          </div>
        </div>

        {/* EDIT PROFILE MODAL */}
        {isEditModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-gd-fade-in"
            role="dialog"
            aria-modal="true"
          >
            <div className="relative w-full max-w-lg rounded-3xl border border-[var(--gd-border)] bg-white p-6 sm:p-8 shadow-2xl">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="absolute right-4 top-4 text-stone-400 hover:text-[var(--gd-charcoal)]"
                aria-label="Close edit profile modal"
              >
                <X size={20} />
              </button>

              <h2 className="font-display text-2xl font-semibold text-[var(--gd-charcoal)]">
                Edit Profile Settings
              </h2>
              <p className="mt-1 text-xs text-[var(--gd-muted)]">
                Update your display name, primary goal, and dietary preference.
              </p>

              <form onSubmit={handleSaveEditProfile} className="mt-6 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[var(--gd-charcoal)] mb-1.5">
                    Customer / Athlete Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-xl border border-[var(--gd-border)] bg-[var(--gd-ivory)] p-3 text-xs font-bold text-[var(--gd-charcoal)] focus:border-[var(--gd-forest)] focus:bg-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--gd-charcoal)] mb-1.5">
                    Primary Goal
                  </label>
                  <select
                    value={editGoal}
                    onChange={(e) => setEditGoal(e.target.value as FitnessGoal)}
                    className="w-full rounded-xl border border-[var(--gd-border)] bg-[var(--gd-ivory)] p-3 text-xs font-semibold text-[var(--gd-charcoal)] focus:border-[var(--gd-forest)] focus:outline-none"
                  >
                    <option value="muscleGain">Build Muscle</option>
                    <option value="fatLoss">Lose Fat</option>
                    <option value="performance">Performance</option>
                    <option value="eatClean">Eat Clean</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--gd-charcoal)] mb-1.5">
                    Dietary Preference
                  </label>
                  <select
                    value={editDiet}
                    onChange={(e) => setEditDiet(e.target.value as DietaryPreference)}
                    className="w-full rounded-xl border border-[var(--gd-border)] bg-[var(--gd-ivory)] p-3 text-xs font-semibold text-[var(--gd-charcoal)] focus:border-[var(--gd-forest)] focus:outline-none"
                  >
                    <option value="vegetarian">Vegetarian</option>
                    <option value="nonVegetarian">Non-Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="eggitarian">Eggitarian</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--gd-border)]">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="rounded-xl border border-[var(--gd-border)] bg-stone-100 px-4 py-2.5 text-xs font-semibold text-[var(--gd-muted)] hover:bg-stone-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--gd-forest)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-[var(--gd-forest-dark)] shadow-md"
                  >
                    <Check size={15} />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* FOOD DETAILS MODAL FOR RECOMMENDED MEALS */}
        <FoodDetailsModal
          item={selectedMeal}
          isOpen={isMealModalOpen}
          onClose={() => {
            setIsMealModalOpen(false);
            setSelectedMeal(null);
          }}
          onSelectRelatedItem={(item) => setSelectedMeal(item)}
        />
      </div>
    </main>
  );
}
