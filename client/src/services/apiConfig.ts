/**
 * Production API Base URL Configuration.
 * Reads VITE_API_BASE_URL from environment or falls back to empty string (relative paths for dev proxy / same-domain deployment).
 */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Builds absolute API endpoint URL.
 */
export function buildApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) {
    return cleanPath;
  }
  const cleanBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return `${cleanBase}${cleanPath}`;
}
