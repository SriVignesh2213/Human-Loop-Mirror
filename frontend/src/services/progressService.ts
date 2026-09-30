import { apiClient } from './apiClient';
import { ProgressData } from '../types';

export const progressService = {
  async getProgress(): Promise<ProgressData> {
    const res = await apiClient.get<ProgressData>('/progress');
    return res.data;
  },

  async exportReport(): Promise<Blob> {
    const token = apiClient.getToken();
    const baseUrl = apiClient.getBaseUrl();
    const headers: Record<string, string> = {
      'Bypass-Tunnel-Reminder': 'true',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${baseUrl}/export/report`, {
      headers,
    });
    if (!response.ok) {
      throw new Error(`Export failed with status ${response.status}`);
    }
    return response.blob();
  },

  async exportCsv(): Promise<Blob> {
    const token = apiClient.getToken();
    const baseUrl = apiClient.getBaseUrl();
    const headers: Record<string, string> = {
      'Bypass-Tunnel-Reminder': 'true',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${baseUrl}/export/csv`, {
      headers,
    });
    if (!response.ok) {
      throw new Error(`Export failed with status ${response.status}`);
    }
    return response.blob();
  },

  async exportPdf(): Promise<Blob> {
    const token = apiClient.getToken();
    const baseUrl = apiClient.getBaseUrl();
    const headers: Record<string, string> = {
      'Bypass-Tunnel-Reminder': 'true',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${baseUrl}/export/pdf`, {
      headers,
    });
    if (!response.ok) {
      throw new Error(`Export failed with status ${response.status}`);
    }
    return response.blob();
  },

  async clearUsageData(): Promise<void> {
    await apiClient.delete('/export/clear-usage');
  },

  async deleteAccount(): Promise<void> {
    await apiClient.delete('/export/account');
  },
};
