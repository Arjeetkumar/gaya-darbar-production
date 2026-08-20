import type {
  AdminOrder,
  AdminOrderFilters,
  AdminOrderListResponse,
} from '../types/adminOrder';
import type { OrderStatus } from '../types/order';
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

export async function getAdminOrders(
  filters: AdminOrderFilters = {}
): Promise<AdminOrderListResponse> {
  const queryParts: string[] = [];

  if (filters.page) queryParts.push(`page=${filters.page}`);
  if (filters.limit) queryParts.push(`limit=${filters.limit}`);
  if (filters.search?.trim()) queryParts.push(`search=${encodeURIComponent(filters.search.trim())}`);
  if (filters.status && filters.status !== 'ALL') queryParts.push(`status=${encodeURIComponent(filters.status)}`);
  if (filters.orderType && filters.orderType !== 'ALL') queryParts.push(`orderType=${encodeURIComponent(filters.orderType)}`);
  if (filters.paymentStatus && filters.paymentStatus !== 'ALL') queryParts.push(`paymentStatus=${encodeURIComponent(filters.paymentStatus)}`);
  if (filters.dateFrom) queryParts.push(`dateFrom=${encodeURIComponent(filters.dateFrom)}`);
  if (filters.dateTo) queryParts.push(`dateTo=${encodeURIComponent(filters.dateTo)}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const response = await fetch(buildApiUrl(`/api/v1/admin/orders${queryString}`), {
    headers: getAuthHeaders(),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to fetch admin orders.');
  }

  const orders = (json.data || []).map((o: any) => ({
    ...o,
    id: o._id || o.id,
  }));

  return {
    data: orders,
    pagination: json.pagination || { page: 1, limit: 20, total: orders.length, totalPages: 1 },
  };
}

export async function getAdminOrderById(id: string): Promise<AdminOrder> {
  const response = await fetch(buildApiUrl(`/api/v1/admin/orders/${encodeURIComponent(id)}`), {
    headers: getAuthHeaders(),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Order not found.');
  }

  const order = json.data;
  return {
    ...order,
    id: order._id || order.id,
  };
}

export async function updateAdminOrderStatus(
  id: string,
  status: OrderStatus
): Promise<AdminOrder> {
  const response = await fetch(buildApiUrl(`/api/v1/admin/orders/${encodeURIComponent(id)}/status`), {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || `Failed to update status to '${status}'.`);
  }

  const order = json.data;
  return {
    ...order,
    id: order._id || order.id,
  };
}

export async function cancelAdminOrder(id: string): Promise<AdminOrder> {
  const response = await fetch(buildApiUrl(`/api/v1/admin/orders/${encodeURIComponent(id)}/cancel`), {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to cancel order.');
  }

  const order = json.data;
  return {
    ...order,
    id: order._id || order.id,
  };
}
