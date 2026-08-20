import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type { DietaryPreference, FitnessGoal } from '../types/menu';
import type { ProfileContextType, UserProfile } from '../types/profile';
import { useAuth } from './AuthContext';

const PROFILE_STORAGE_KEY = 'gaya_darbar_profile_v1';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Athlete Guest',
  email: 'athlete@gayadarbar.com',
  fitnessGoal: 'muscleGain',
  dietaryPreference: 'nonVegetarian',
  dailyCalories: 2400,
  dailyProtein: 160,
  dailyCarbs: 220,
  dailyFats: 70,
  favorites: [],
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user: authUser, updateProfile: apiUpdateAuthProfile, isAuthenticated } = useAuth();
  const [profile, setProfileState] = useState<UserProfile>(DEFAULT_PROFILE);

  // Sync profile state with authenticated user profile when logged in
  useEffect(() => {
    if (isAuthenticated && authUser) {
      setProfileState({
        name: authUser.name,
        email: authUser.email,
        fitnessGoal: authUser.fitnessGoal,
        dietaryPreference: authUser.dietaryPreference,
        dailyCalories: authUser.nutritionTargets?.calories || 2400,
        dailyProtein: authUser.nutritionTargets?.protein || 160,
        dailyCarbs: authUser.nutritionTargets?.carbs || 220,
        dailyFats: authUser.nutritionTargets?.fats || 70,
        favorites: authUser.favorites || [],
      });
    } else {
      try {
        const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            setProfileState({
              ...DEFAULT_PROFILE,
              ...parsed,
              favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
            });
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to parse guest profile:', e);
      }
      setProfileState(DEFAULT_PROFILE);
    }
  }, [isAuthenticated, authUser]);

  const updateProfile = async (updated: Partial<UserProfile>) => {
    setProfileState((prev) => ({ ...prev, ...updated }));

    if (isAuthenticated) {
      try {
        await apiUpdateAuthProfile({
          name: updated.name,
          fitnessGoal: updated.fitnessGoal,
          dietaryPreference: updated.dietaryPreference,
          nutritionTargets:
            updated.dailyCalories || updated.dailyProtein || updated.dailyCarbs || updated.dailyFats
              ? {
                  calories: updated.dailyCalories,
                  protein: updated.dailyProtein,
                  carbs: updated.dailyCarbs,
                  fats: updated.dailyFats,
                }
              : undefined,
        });
      } catch (err) {
        console.error('Failed to sync profile update with API:', err);
      }
    } else {
      try {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ ...profile, ...updated }));
      } catch (e) {
        console.warn('Failed to save guest profile to localStorage:', e);
      }
    }
  };

  const setGoal = (goal: FitnessGoal) => {
    updateProfile({ fitnessGoal: goal });
  };

  const setDietaryPreference = (diet: DietaryPreference) => {
    updateProfile({ dietaryPreference: diet });
  };

  const setNutritionTargets = (targets: {
    dailyCalories: number;
    dailyProtein: number;
    dailyCarbs: number;
    dailyFats: number;
  }) => {
    updateProfile(targets);
  };

  const toggleFavorite = (itemId: string) => {
    setProfileState((prev) => {
      const exists = prev.favorites.includes(itemId);
      const updatedFavorites = exists
        ? prev.favorites.filter((id) => id !== itemId)
        : [...prev.favorites, itemId];
      
      const newProfile = { ...prev, favorites: updatedFavorites };
      if (!isAuthenticated) {
        try {
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
        } catch (e) {
          console.warn('Failed to save favorites:', e);
        }
      }
      return newProfile;
    });
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        updateProfile,
        setGoal,
        setDietaryPreference,
        setNutritionTargets,
        toggleFavorite,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextType {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
