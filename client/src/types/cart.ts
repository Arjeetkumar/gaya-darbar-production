import type { DietaryPreference, MacroInfo } from './menu';

export type CartItemType = 'MENU_ITEM' | 'CUSTOM_MEAL';

export interface CartItem {
  id: string;
  itemType: CartItemType;
  menuItemId?: string;
  name: string;
  image: string;
  quantity: number;
  unitPrice: number; // in INR (₹)
  totalPrice: number; // unitPrice * quantity
  nutrition: MacroInfo;
  dietaryPreference: DietaryPreference;
  fuelScore: number;
  
  // Custom Meal details (optional for MENU_ITEM)
  customIngredients?: string[];
  customOptionIds?: string[];
  customMealSelection?: {
    baseId?: string;
    proteinId?: string;
    carbId?: string;
    vegetableIds?: string[];
    sauceIds?: string[];
    extraIds?: string[];
  };
  portionChoice?: string;
  sauceChoice?: string;
}

export interface CartState {
  items: CartItem[];
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
}
