import type {
  AnalyticsOverview,
  OrderAnalytics,
  RevenueAnalytics,
  KitchenAnalytics,
  DeliveryAnalytics,
  RiderPerformanceItem,
  MenuPerformanceItem,
  CustomerAnalytics,
  NutritionAnalytics,
  AnalyticsDateParams,
} from '../types/analytics';
import { getStoredToken } from './authService';
import { buildApiUrl } from './apiConfig';

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function buildQueryString(params?: AnalyticsDateParams): string {
  if (!params) return '';
  const parts: string[] = [];
  if (params.dateFrom) parts.push(`dateFrom=${encodeURIComponent(params.dateFrom)}`);
  if (params.dateTo) parts.push(`dateTo=${encodeURIComponent(params.dateTo)}`);
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

export async function getAnalyticsOverview(params?: AnalyticsDateParams): Promise<AnalyticsOverview> {
  const response = await fetch(buildApiUrl(`/api/v1/admin/analytics/overview${buildQueryString(params)}`), {
    headers: getAuthHeaders(),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to fetch overview analytics metrics.');
  }

  return json.data;
}

export async function getOrderAnalytics(params?: AnalyticsDateParams): Promise<OrderAnalytics> {
  const response = await fetch(buildApiUrl(`/api/v1/admin/analytics/orders${buildQueryString(params)}`), {
    headers: getAuthHeaders(),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to fetch order analytics.');
  }

  return json.data;
}

export async function getRevenueAnalytics(params?: AnalyticsDateParams): Promise<RevenueAnalytics> {
  const response = await fetch(buildApiUrl(`/api/v1/admin/analytics/revenue${buildQueryString(params)}`), {
    headers: getAuthHeaders(),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to fetch revenue analytics.');
  }

  return json.data;
}

export async function getKitchenAnalytics(params?: AnalyticsDateParams): Promise<KitchenAnalytics> {
  const response = await fetch(buildApiUrl(`/api/v1/admin/analytics/kitchen${buildQueryString(params)}`), {
    headers: getAuthHeaders(),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to fetch kitchen analytics.');
  }

  return json.data;
}

export async function getDeliveryAnalytics(params?: AnalyticsDateParams): Promise<DeliveryAnalytics> {
  const response = await fetch(buildApiUrl(`/api/v1/admin/analytics/delivery${buildQueryString(params)}`), {
    headers: getAuthHeaders(),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to fetch delivery analytics.');
  }

  return json.data;
}

export async function getRiderAnalytics(params?: AnalyticsDateParams): Promise<RiderPerformanceItem[]> {
  const response = await fetch(buildApiUrl(`/api/v1/admin/analytics/riders${buildQueryString(params)}`), {
    headers: getAuthHeaders(),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to fetch rider performance metrics.');
  }

  return json.data;
}

export async function getMenuAnalytics(params?: AnalyticsDateParams): Promise<MenuPerformanceItem[]> {
  const response = await fetch(buildApiUrl(`/api/v1/admin/analytics/menu${buildQueryString(params)}`), {
    headers: getAuthHeaders(),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to fetch menu performance analytics.');
  }

  return json.data;
}

export async function getCustomerAnalytics(params?: AnalyticsDateParams): Promise<CustomerAnalytics> {
  const response = await fetch(buildApiUrl(`/api/v1/admin/analytics/customers${buildQueryString(params)}`), {
    headers: getAuthHeaders(),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to fetch customer insights.');
  }

  return json.data;
}

export async function getNutritionAnalytics(params?: AnalyticsDateParams): Promise<NutritionAnalytics> {
  const response = await fetch(buildApiUrl(`/api/v1/admin/analytics/nutrition${buildQueryString(params)}`), {
    headers: getAuthHeaders(),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to fetch fuel & nutrition analytics.');
  }

  return json.data;
}
