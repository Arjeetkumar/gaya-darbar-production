import type { Notification, UnreadCountResponse } from '../types/notification';
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

export async function getUserNotifications(limit: number = 20): Promise<Notification[]> {
  const response = await fetch(buildApiUrl(`/api/v1/notifications?limit=${limit}`), {
    headers: getAuthHeaders(),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to fetch customer notifications.');
  }

  return (json.data || []).map((n: any) => ({
    ...n,
    id: n._id || n.id,
  }));
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await fetch(buildApiUrl('/api/v1/notifications/unread-count'), {
    headers: getAuthHeaders(),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to fetch unread notification count.');
  }

  const data: UnreadCountResponse = json.data || { unreadCount: 0 };
  return data.unreadCount;
}

export async function markNotificationAsRead(id: string): Promise<Notification> {
  const response = await fetch(buildApiUrl(`/api/v1/notifications/${encodeURIComponent(id)}/read`), {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to mark notification as read.');
  }

  const notification = json.data;
  return {
    ...notification,
    id: notification._id || notification.id,
  };
}

export async function markAllNotificationsAsRead(): Promise<{ modifiedCount: number }> {
  const response = await fetch(buildApiUrl('/api/v1/notifications/read-all'), {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to mark all notifications as read.');
  }

  return json.data || { modifiedCount: 0 };
}
