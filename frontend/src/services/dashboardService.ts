import { apiClient } from './apiClient';
import { DashboardSummary } from '../types';

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const res = await apiClient.get<DashboardSummary>('/dashboard');
    return res.data;
  },
};
