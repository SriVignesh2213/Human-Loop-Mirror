import { apiClient } from './apiClient';
import { CsvImportResponse, UsageSession, Application, NotificationItem } from '../types';

export const usageService = {
  async importCsv(file: File): Promise<CsvImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<CsvImportResponse>('/usage/import', formData);
    return res.data;
  },

  async addManualSession(session: {
    app_name: string;
    category?: string;
    start_time: string;
    end_time: string;
    notification_associated?: boolean;
    notification_title?: string;
    reflection_label?: string;
  }): Promise<UsageSession> {
    const res = await apiClient.post<UsageSession>('/usage/manual', session);
    return res.data;
  },

  async getApplications(): Promise<Application[]> {
    const res = await apiClient.get<Application[]>('/apps');
    return res.data;
  },

  async getNotifications(): Promise<NotificationItem[]> {
    const res = await apiClient.get<NotificationItem[]>('/notifications');
    return res.data;
  },

  async getAppTracking(): Promise<{
    total_screen_time_minutes: number;
    total_sessions: number;
    apps: Array<{
      app_name: string;
      category: string;
      total_minutes: number;
      session_count: number;
      notification_count: number;
      percentage: number;
    }>;
    categories: Array<{
      category: string;
      total_minutes: number;
      session_count: number;
      apps: string[];
      percentage: number;
    }>;
  }> {
    const res = await apiClient.get<any>('/apps/tracking');
    return res.data;
  },
};
