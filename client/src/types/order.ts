export type OrderType = 'delivery' | 'dineIn';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'outForDelivery'
  | 'delivered'
  | 'completed'
  | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type ItemType = 'STANDARD_ITEM' | 'CUSTOM_MEAL';

export interface INutritionSnapshot {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface ICustomOptionSnapshot {
  optionId: string;
  name: string;
  category: string;
  price: number;
  nutrition: INutritionSnapshot;
  dietaryPreference?: string;
}

export interface IOrderItemSnapshot {
  itemType: ItemType;
  menuItemId?: string | null;
  name: string;
  image?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  portionChoice?: string;
  sauceChoice?: string;
  nutritionSnapshot: INutritionSnapshot;
  fuelScore: number;
  customOptionsSnapshot?: ICustomOptionSnapshot[];
}

export interface IDeliveryAddressSnapshot {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  landmark?: string;
}

export interface Order {
  id: string;
  _id: string;
  orderNumber: string;
  user: string;
  orderType: OrderType;
  items: IOrderItemSnapshot[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  deliveryAddress?: IDeliveryAddressSnapshot | null;
  table?: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPayloadItem {
  itemType: ItemType;
  menuItemId?: string;
  slug?: string;
  name?: string;
  quantity: number;
  portionChoice?: string;
  sauceChoice?: string;
  customMealSelection?: {
    baseId?: string;
    proteinId?: string;
    carbId?: string;
    vegetableIds?: string[];
    sauceIds?: string[];
    extraIds?: string[];
  };
}

export interface CreateOrderPayload {
  orderType: OrderType;
  items: CreateOrderPayloadItem[];
  deliveryAddress?: IDeliveryAddressSnapshot | null;
  table?: string | null;
  customerNotes?: string;
}
