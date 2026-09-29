import { apiClient } from './apiClient';
import { ProgressData } from '../types';

export const progressService = {
  async getProgress(): Promise<ProgressData> {
    const res = await apiClient.get<ProgressData>('/progress');
    return res.data;
  },

  async exportReport(): Promise<Blob> {
    const token = apiClient.getToken();
    const response = await fetch('/api/v1/export/report', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.blob();
  },

  async exportCsv(): Promise<Blob> {
    const token = apiClient.getToken();
    const response = await fetch('/api/v1/export/csv', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.blob();
  },

  async exportPdf(): Promise<Blob> {
    const token = apiClient.getToken();
    const response = await fetch('/api/v1/export/pdf', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.blob();
  },

  async clearUsageData(): Promise<void> {
    await apiClient.delete('/export/clear-usage');
  },

  async deleteAccount(): Promise<void> {
    await apiClient.delete('/export/account');
  },
};
