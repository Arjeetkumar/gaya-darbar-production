import type { DietaryPreference, FitnessGoal } from './menu';

export type UserRole = 'customer' | 'admin' | 'manager' | 'kitchen_staff' | 'delivery_rider';

export interface INutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface AuthUser {
  id: string;
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  fitnessGoal: FitnessGoal;
  dietaryPreference: DietaryPreference;
  nutritionTargets: INutritionTargets;
  favorites: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  fitnessGoal?: FitnessGoal;
  dietaryPreference?: DietaryPreference;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  name?: string;
  fitnessGoal?: FitnessGoal;
  dietaryPreference?: DietaryPreference;
  nutritionTargets?: Partial<INutritionTargets>;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<AuthUser>;
  clearError: () => void;
}
