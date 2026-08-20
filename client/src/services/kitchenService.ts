import type {
  KitchenTicket,
  KitchenTicketStatus,
  KitchenTicketPriority,
  GetKitchenTicketsParams,
} from '../types/kitchen';
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

export async function getKitchenTickets(
  params: GetKitchenTicketsParams = {}
): Promise<KitchenTicket[]> {
  const queryParts: string[] = [];

  if (params.status) {
    queryParts.push(`status=${encodeURIComponent(params.status)}`);
  }
  if (params.priority) {
    queryParts.push(`priority=${encodeURIComponent(params.priority)}`);
  }
  if (params.active !== undefined) {
    queryParts.push(`active=${params.active ? 'true' : 'false'}`);
  }

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const response = await fetch(buildApiUrl(`/api/v1/kitchen/tickets${queryString}`), {
    headers: getAuthHeaders(),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to fetch kitchen tickets.');
  }

  return (json.data || []).map((ticket: any) => ({
    ...ticket,
    id: ticket._id || ticket.id,
  }));
}

export async function getKitchenTicketById(id: string): Promise<KitchenTicket> {
  const response = await fetch(buildApiUrl(`/api/v1/kitchen/tickets/${encodeURIComponent(id)}`), {
    headers: getAuthHeaders(),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Kitchen ticket not found.');
  }

  const ticket = json.data;
  return {
    ...ticket,
    id: ticket._id || ticket.id,
  };
}

export async function updateKitchenTicketStatus(
  id: string,
  status: KitchenTicketStatus
): Promise<KitchenTicket> {
  const response = await fetch(
    buildApiUrl(`/api/v1/kitchen/tickets/${encodeURIComponent(id)}/status`),
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    }
  );

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || `Failed to update status to '${status}'.`);
  }

  const ticket = json.data;
  return {
    ...ticket,
    id: ticket._id || ticket.id,
  };
}

export async function updateKitchenTicketPriority(
  id: string,
  priority: KitchenTicketPriority
): Promise<KitchenTicket> {
  const response = await fetch(
    buildApiUrl(`/api/v1/kitchen/tickets/${encodeURIComponent(id)}/priority`),
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ priority }),
    }
  );

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || `Failed to update priority to '${priority}'.`);
  }

  const ticket = json.data;
  return {
    ...ticket,
    id: ticket._id || ticket.id,
  };
}
