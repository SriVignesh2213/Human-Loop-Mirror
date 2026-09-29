import { apiClient } from './apiClient';
import { User, UserProfile, OnboardingData } from '../types';

export const profileService = {
  async getProfile(): Promise<User> {
    const res = await apiClient.get<User>('/users/me');
    return res.data;
  },

  async updateProfile(updates: Partial<UserProfile> & { email?: string }): Promise<UserProfile> {
    const res = await apiClient.put<UserProfile>('/users/me', updates);
    return res.data;
  },

  async completeOnboarding(data: OnboardingData): Promise<UserProfile> {
    const res = await apiClient.post<UserProfile>('/users/onboarding', data);
    return res.data;
  },
};
