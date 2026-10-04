import { apiRequest } from './client';
import { UserProfile } from './types';

export interface UpdateProfileDto {
  name?: string;
  address?: string;
  pincode?: string;
  district?: string;
  region?: string;
}

export const usersApi = {
  async getProfile(): Promise<UserProfile> {
    return apiRequest<UserProfile>('/users/profile', { requiresAuth: true });
  },

  async updateProfile(dto: UpdateProfileDto): Promise<UserProfile> {
    return apiRequest<UserProfile>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(dto),
      requiresAuth: true,
    });
  },
};
