export interface AnalyticsOverview {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalCustomers: number;
  newCustomers: number;
}

export interface DailyOrderData {
  date: string;
  orders: number;
  revenue: number;
}

export interface StatusCountItem {
  status: string;
  count: number;
}

export interface OrderTypeData {
  orderType: string;
  count: number;
  revenue: number;
}

export interface OrderAnalytics {
  dailyOrders: DailyOrderData[];
  byStatus: StatusCountItem[];
  byOrderType: OrderTypeData[];
}

export interface RevenueTrendItem {
  date: string;
  revenue: number;
  orders: number;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  averageOrderValue: number;
  currency: string;
  revenueByOrderType: OrderTypeData[];
  revenueTrend: RevenueTrendItem[];
}

export interface KitchenAnalytics {
  totalTickets: number;
  completedTickets: number;
  cancelledTickets: number;
  pendingTickets: number;
  averagePreparationMinutes: number | null;
  statusDistribution: StatusCountItem[];
}

export interface DeliveryAnalytics {
  totalDeliveries: number;
  delivered: number;
  failed: number;
  cancelled: number;
  active: number;
  averageDeliveryMinutes: number | null;
  statusDistribution: StatusCountItem[];
}

export interface RiderPerformanceItem {
  _id: string;
  name: string;
  assignedDeliveries: number;
  completedDeliveries: number;
  failedDeliveries: number;
  completionRate: number;
  averageDeliveryMinutes: number | null;
}

export interface MenuPerformanceItem {
  name: string;
  itemType: string;
  quantitySold: number;
  totalRevenue: number;
  averagePrice: number;
}

export interface CustomerGoalDistributionItem {
  goal: string;
  count: number;
}

export interface CustomerDietDistributionItem {
  diet: string;
  count: number;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  repeatCustomers: number;
  goalDistribution: CustomerGoalDistributionItem[];
  dietaryDistribution: CustomerDietDistributionItem[];
}

export interface NutritionAnalytics {
  averageFuelScore: number | null;
  averageCalories: number | null;
  averageProtein: number | null;
  averageCarbs: number | null;
  averageFats: number | null;
  highProteinOrderPercentage: number;
}

export type PresetDateRange = '7d' | '30d' | '90d' | 'custom';

export interface AnalyticsDateParams {
  dateFrom?: string;
  dateTo?: string;
}
