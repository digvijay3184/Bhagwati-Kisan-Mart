// Client-side authentication token storage

const ACCESS_TOKEN_KEY = 'bkm_access_token';
const REFRESH_TOKEN_KEY = 'bkm_refresh_token';
const USER_KEY = 'bkm_user';

export const authStorage = {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  getUser(): any | null {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  setTokens(accessToken: string, refreshToken: string, user?: any) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  clear() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
