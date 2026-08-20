import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import type { CartItem, CartState, CartTotals } from '../types/cart';
import type { MenuItem } from '../types/menu';
import type { MealBuilderSelection } from '../types/mealBuilder';
import {
  calculateMealNutrition,
  calculateMealPrice,
  calculateFuelScore,
  getSelectedOptionObjects,
} from '../services/mealBuilderService';

const CART_STORAGE_KEY = 'gaya_darbar_cart_v1';

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_CART'; payload: CartItem[] };

interface CartContextType extends CartTotals {
  items: CartItem[];
  addMenuItem: (
    item: MenuItem,
    quantity?: number,
    options?: { portion?: string; sauce?: string }
  ) => void;
  addCustomMeal: (
    selection: MealBuilderSelection,
    quantity?: number
  ) => void;
  removeItem: (id: string) => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const newItem = action.payload;
      const existingIndex = state.items.findIndex((item) => {
        if (newItem.itemType === 'MENU_ITEM' && item.itemType === 'MENU_ITEM') {
          return (
            item.menuItemId === newItem.menuItemId &&
            item.portionChoice === newItem.portionChoice &&
            item.sauceChoice === newItem.sauceChoice
          );
        }
        if (newItem.itemType === 'CUSTOM_MEAL' && item.itemType === 'CUSTOM_MEAL') {
          const a = (item.customOptionIds || []).sort().join(',');
          const b = (newItem.customOptionIds || []).sort().join(',');
          return a === b;
        }
        return false;
      });

      if (existingIndex > -1) {
        const updatedItems = [...state.items];
        const existing = updatedItems[existingIndex];
        const newQty = existing.quantity + newItem.quantity;

        updatedItems[existingIndex] = {
          ...existing,
          quantity: newQty,
          totalPrice: existing.unitPrice * newQty,
        };

        return { ...state, items: updatedItems };
      }

      return { ...state, items: [...state.items, newItem] };
    }

    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload.id),
      };
    }

    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => item.id !== id),
        };
      }

      return {
        ...state,
        items: state.items.map((item) =>
          item.id === id
            ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
            : item
        ),
      };
    }

    case 'CLEAR_CART':
      return { items: [] };

    case 'SET_CART':
      return { items: action.payload };

    default:
      return state;
  }
}

// Initial state loader from localStorage
function getInitialState(): CartState {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return { items: parsed };
      }
    }
  } catch (e) {
    console.warn('Failed to parse cart from localStorage:', e);
  }
  return { items: [] };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, getInitialState);

  // Sync state changes to localStorage
  useEffect(() => {
    try {
      if (state.items.length > 0) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
      } else {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Failed to save cart to localStorage:', e);
    }
  }, [state.items]);

  // Actions
  const addMenuItem = (
    item: MenuItem,
    quantity = 1,
    options?: { portion?: string; sauce?: string }
  ) => {
    const portionPrice = options?.portion === 'Extra Protein (+₹60)' ? 60 : 0;
    const unitPrice = item.price + portionPrice;

    const cartItem: CartItem = {
      id: `menu-${item.id}-${options?.portion || 'std'}-${options?.sauce || 'std'}`,
      itemType: 'MENU_ITEM',
      menuItemId: item.id,
      name: item.name,
      image: item.image,
      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity,
      nutrition: item.macros,
      dietaryPreference: item.dietaryPreference,
      fuelScore: item.fuelScore,
      portionChoice: options?.portion,
      sauceChoice: options?.sauce,
    };

    dispatch({ type: 'ADD_ITEM', payload: cartItem });
  };

  const addCustomMeal = (
    selection: MealBuilderSelection,
    quantity = 1
  ) => {
    const selectedOptions = getSelectedOptionObjects(selection);
    const nutrition = calculateMealNutrition(selection);
    const price = calculateMealPrice(selection);
    const fuelScore = calculateFuelScore(selection);

    const ingredientNames = selectedOptions.map((opt) => opt.name);
    const optionIds = selectedOptions.map((opt) => opt.id);

    // Determine primary dietary preference
    const isVegan = selectedOptions.every((opt) => opt.dietaryPreference === 'vegan');
    const isVeg = selectedOptions.every(
      (opt) => opt.dietaryPreference === 'vegan' || opt.dietaryPreference === 'vegetarian'
    );
    const isEgg = selectedOptions.every(
      (opt) =>
        opt.dietaryPreference === 'vegan' ||
        opt.dietaryPreference === 'vegetarian' ||
        opt.dietaryPreference === 'eggitarian'
    );

    const dietaryPreference = isVegan
      ? 'vegan'
      : isVeg
      ? 'vegetarian'
      : isEgg
      ? 'eggitarian'
      : 'nonVegetarian';

    const cartItem: CartItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      itemType: 'CUSTOM_MEAL',
      name: 'Custom Performance Fuel Bowl',
      image:
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      quantity,
      unitPrice: price.totalPrice,
      totalPrice: price.totalPrice * quantity,
      nutrition,
      dietaryPreference,
      fuelScore,
      customIngredients: ingredientNames,
      customOptionIds: optionIds,
    };

    dispatch({ type: 'ADD_ITEM', payload: cartItem });
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  };

  const increaseQuantity = (id: string) => {
    const item = state.items.find((i) => i.id === id);
    if (item) {
      dispatch({
        type: 'UPDATE_QUANTITY',
        payload: { id, quantity: item.quantity + 1 },
      });
    }
  };

  const decreaseQuantity = (id: string) => {
    const item = state.items.find((i) => i.id === id);
    if (item) {
      dispatch({
        type: 'UPDATE_QUANTITY',
        payload: { id, quantity: item.quantity - 1 },
      });
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  // Compute overall cart totals
  const totals = useMemo<CartTotals>(() => {
    return state.items.reduce(
      (acc, item) => {
        acc.itemCount += item.quantity;
        acc.subtotal += item.totalPrice;
        acc.totalCalories += item.nutrition.calories * item.quantity;
        acc.totalProtein += item.nutrition.protein * item.quantity;
        acc.totalCarbs += item.nutrition.carbs * item.quantity;
        acc.totalFats += item.nutrition.fats * item.quantity;
        return acc;
      },
      {
        itemCount: 0,
        subtotal: 0,
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFats: 0,
      }
    );
  }, [state.items]);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        ...totals,
        addMenuItem,
        addCustomMeal,
        removeItem,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
