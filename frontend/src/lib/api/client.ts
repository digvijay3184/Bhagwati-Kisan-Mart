import { ApiResponse } from './types';
import { authStorage } from './storage';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  code: string;
  details?: any;
  status: number;

  constructor(message: string, code: string = 'ERROR', status: number = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
  idempotencyKey?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, idempotencyKey, headers = {}, ...rest } = options;

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (idempotencyKey) {
    requestHeaders['x-idempotency-key'] = idempotencyKey;
  }

  if (requiresAuth) {
    const token = authStorage.getAccessToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  let response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
  });

  // Handle 401: Token expired -> Attempt silent refresh if refresh token exists
  if (response.status === 401 && requiresAuth) {
    const refreshToken = authStorage.getRefreshToken();
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.ok) {
          const refreshJson: ApiResponse<{ accessToken: string; refreshToken: string }> =
            await refreshRes.json();
          authStorage.setTokens(refreshJson.data.accessToken, refreshJson.data.refreshToken);

          // Retry original request with new access token
          requestHeaders['Authorization'] = `Bearer ${refreshJson.data.accessToken}`;
          response = await fetch(url, {
            ...rest,
            headers: requestHeaders,
          });
        } else {
          authStorage.clear();
        }
      } catch {
        authStorage.clear();
      }
    }
  }

  const json: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    data: null as any,
    error: { message: 'Unexpected server response', code: 'PARSE_ERROR' },
  }));

  if (!response.ok || !json.success) {
    const msg = json.error?.message || response.statusText || 'Request failed';
    const code = json.error?.code || `HTTP_${response.status}`;
    throw new ApiError(msg, code, response.status, json.error?.details);
  }

  return json.data;
}
