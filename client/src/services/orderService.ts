import type { CreateOrderPayload, Order } from '../types/order';
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

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const response = await fetch(buildApiUrl('/api/v1/orders'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to place order.');
  }

  const order = json.data;
  return {
    ...order,
    id: order._id || order.id,
  };
}

export async function getUserOrders(): Promise<Order[]> {
  const response = await fetch(buildApiUrl('/api/v1/orders'), {
    headers: getAuthHeaders(),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to fetch user order history.');
  }

  return (json.data || []).map((o: any) => ({
    ...o,
    id: o._id || o.id,
  }));
}

export async function getUserOrderById(orderIdentifier: string): Promise<Order> {
  const cleanId = encodeURIComponent(orderIdentifier);
  const response = await fetch(buildApiUrl(`/api/v1/orders/${cleanId}`), {
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
