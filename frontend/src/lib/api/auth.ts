import { apiRequest } from './client';
import { authStorage } from './storage';
import { LoginResponse, UserRole } from './types';

export const authApi = {
  async sendOtp(phoneNumber: string): Promise<{ message: string; cooldownSeconds: number }> {
    return apiRequest<{ message: string; cooldownSeconds: number }>('/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
      requiresAuth: false,
    });
  },

  async verifyOtp(phoneNumber: string, otp: string): Promise<LoginResponse> {
    const res = await apiRequest<LoginResponse>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, otp }),
      requiresAuth: false,
    });

    if (res && res.tokens) {
      authStorage.setTokens(res.tokens.accessToken, res.tokens.refreshToken, res.user);
    }
    return res;
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const res = await apiRequest<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      requiresAuth: false,
    });

    if (res && res.accessToken) {
      authStorage.setTokens(res.accessToken, res.refreshToken);
    }
    return res;
  },

  async logout(): Promise<void> {
    try {
      await apiRequest('/auth/logout', { method: 'POST', requiresAuth: true });
    } finally {
      authStorage.clear();
    }
  },

  async getMe(): Promise<{ id: string; phoneNumber: string; name: string | null; role: UserRole }> {
    return apiRequest('/auth/me', { requiresAuth: true });
  },
};
