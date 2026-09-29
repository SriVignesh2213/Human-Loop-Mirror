import { apiClient } from './apiClient';
import { PersonalSwapSuggestion } from '../types';

export const personalSwapService = {
  async getSuggestions(): Promise<PersonalSwapSuggestion[]> {
    const res = await apiClient.get<PersonalSwapSuggestion[]>('/personal-swap');
    return res.data;
  },

  async generateSuggestions(params?: {
    habit_loop_id?: string;
    available_minutes?: number;
    force_refresh?: boolean;
  }): Promise<PersonalSwapSuggestion[]> {
    const res = await apiClient.post<PersonalSwapSuggestion[]>('/personal-swap/generate', params || {});
    return res.data;
  },

  async startTask(id: string): Promise<PersonalSwapSuggestion> {
    const res = await apiClient.post<PersonalSwapSuggestion>(`/personal-swap/${id}/start`);
    return res.data;
  },

  async completeTask(id: string, feedback?: { rating?: number; notes?: string }): Promise<{ suggestion_id: string; message: string }> {
    const res = await apiClient.post<{ suggestion_id: string; message: string }>(`/personal-swap/${id}/complete`, feedback || {});
    return res.data;
  },

  async skipTask(id: string): Promise<{ suggestion_id: string; status: string }> {
    const res = await apiClient.post<{ suggestion_id: string; status: string }>(`/personal-swap/${id}/skip`);
    return res.data;
  },
};
