import type {
  Delivery,
  DeliveryRider,
  DeliveryStatus,
  DeliveryFilters,
  AdminDeliveryListResponse,
} from '../types/delivery';
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

// ----------------------------------------------------
// ADMIN & MANAGER API CLIENT
// ----------------------------------------------------

export async function getAdminDeliveries(
  filters: DeliveryFilters = {}
): Promise<AdminDeliveryListResponse> {
  const queryParts: string[] = [];

  if (filters.page) queryParts.push(`page=${filters.page}`);
  if (filters.limit) queryParts.push(`limit=${filters.limit}`);
  if (filters.search?.trim()) queryParts.push(`search=${encodeURIComponent(filters.search.trim())}`);
  if (filters.status && filters.status !== 'ALL') queryParts.push(`status=${encodeURIComponent(filters.status)}`);
  if (filters.rider && filters.rider !== 'ALL') queryParts.push(`rider=${encodeURIComponent(filters.rider)}`);
  if (filters.dateFrom) queryParts.push(`dateFrom=${encodeURIComponent(filters.dateFrom)}`);
  if (filters.dateTo) queryParts.push(`dateTo=${encodeURIComponent(filters.dateTo)}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const response = await fetch(buildApiUrl(`/api/v1/admin/deliveries${queryString}`), {
    headers: getAuthHeaders(),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to fetch delivery records.');
  }

  const deliveries = (json.data || []).map((d: any) => ({
    ...d,
    id: d._id || d.id,
  }));

  return {
    data: deliveries,
    pagination: json.pagination || { page: 1, limit: 20, total: deliveries.length, totalPages: 1 },
  };
}

export async function getAvailableRiders(): Promise<DeliveryRider[]> {
  const response = await fetch(buildApiUrl('/api/v1/admin/deliveries/riders'), {
    headers: getAuthHeaders(),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to fetch available delivery riders.');
  }

  return (json.data || []).map((r: any) => ({
    ...r,
    id: r._id || r.id,
  }));
}

export async function getAdminDeliveryById(id: string): Promise<Delivery> {
  const response = await fetch(buildApiUrl(`/api/v1/admin/deliveries/${encodeURIComponent(id)}`), {
    headers: getAuthHeaders(),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Delivery record not found.');
  }

  const delivery = json.data;
  return {
    ...delivery,
    id: delivery._id || delivery.id,
  };
}

export async function assignDeliveryRider(id: string, riderId: string): Promise<Delivery> {
  const response = await fetch(
    buildApiUrl(`/api/v1/admin/deliveries/${encodeURIComponent(id)}/assign`),
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ riderId }),
    }
  );

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to assign rider to delivery.');
  }

  const delivery = json.data;
  return {
    ...delivery,
    id: delivery._id || delivery.id,
  };
}

export async function reassignDeliveryRider(id: string, riderId: string): Promise<Delivery> {
  const response = await fetch(
    buildApiUrl(`/api/v1/admin/deliveries/${encodeURIComponent(id)}/reassign`),
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ riderId }),
    }
  );

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to reassign rider.');
  }

  const delivery = json.data;
  return {
    ...delivery,
    id: delivery._id || delivery.id,
  };
}

export async function cancelDelivery(id: string): Promise<Delivery> {
  const response = await fetch(
    buildApiUrl(`/api/v1/admin/deliveries/${encodeURIComponent(id)}/cancel`),
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
    }
  );

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to cancel delivery.');
  }

  const delivery = json.data;
  return {
    ...delivery,
    id: delivery._id || delivery.id,
  };
}

// ----------------------------------------------------
// RIDER DASHBOARD API CLIENT
// ----------------------------------------------------

export async function getMyDeliveries(statusFilter?: DeliveryStatus): Promise<Delivery[]> {
  const queryString = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
  const response = await fetch(buildApiUrl(`/api/v1/delivery/my-deliveries${queryString}`), {
    headers: getAuthHeaders(),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to fetch rider deliveries.');
  }

  return (json.data || []).map((d: any) => ({
    ...d,
    id: d._id || d.id,
  }));
}

export async function getMyDeliveryById(id: string): Promise<Delivery> {
  const response = await fetch(buildApiUrl(`/api/v1/delivery/my-deliveries/${encodeURIComponent(id)}`), {
    headers: getAuthHeaders(),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Delivery not found or not assigned to you.');
  }

  const delivery = json.data;
  return {
    ...delivery,
    id: delivery._id || delivery.id,
  };
}

export async function updateMyDeliveryStatus(
  id: string,
  status: DeliveryStatus,
  failureReason?: string
): Promise<Delivery> {
  const response = await fetch(
    buildApiUrl(`/api/v1/delivery/my-deliveries/${encodeURIComponent(id)}/status`),
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, failureReason }),
    }
  );

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || `Failed to update delivery status to '${status}'.`);
  }

  const delivery = json.data;
  return {
    ...delivery,
    id: delivery._id || delivery.id,
  };
}
