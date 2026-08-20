import type { AuthUser, LoginData, RegisterData, UpdateProfileData } from '../types/auth';
import { buildApiUrl } from './apiConfig';

const TOKEN_KEY = 'gaya_darbar_auth_token';

/**
 * Retrieves client token from browser storage for Authorization headers.
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

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

export async function registerUser(data: RegisterData): Promise<{ token: string; user: AuthUser }> {
  const response = await fetch(buildApiUrl('/api/v1/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Registration failed.');
  }

  const { token, user } = json.data;
  setStoredToken(token);

  return { token, user };
}

export async function loginUser(data: LoginData): Promise<{ token: string; user: AuthUser }> {
  const response = await fetch(buildApiUrl('/api/v1/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Invalid email or password.');
  }

  const { token, user } = json.data;
  setStoredToken(token);

  return { token, user };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = getStoredToken();
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(buildApiUrl('/api/v1/auth/me'), {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      clearStoredToken();
      return null;
    }

    const json = await response.json();
    if (json.success && json.data) {
      return json.data;
    }

    clearStoredToken();
    return null;
  } catch (error) {
    console.warn('Authentication token verification failed:', error);
    clearStoredToken();
    return null;
  }
}

export async function updateUserProfile(data: UpdateProfileData): Promise<AuthUser> {
  const response = await fetch(buildApiUrl('/api/v1/users/me'), {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to update user profile.');
  }

  return json.data;
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch(buildApiUrl('/api/v1/auth/logout'), {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch (error) {
    console.warn('Logout API error:', error);
  } finally {
    clearStoredToken();
  }
}
