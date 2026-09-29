import { apiClient } from './apiClient';
import { Insight } from '../types';

export const insightService = {
  async getInsights(): Promise<Insight[]> {
    const res = await apiClient.get<Insight[]>('/insights');
    return res.data;
  },

  async getInsightById(id: string): Promise<Insight> {
    const res = await apiClient.get<Insight>(`/insights/${id}`);
    return res.data;
  },

  async getInsightEvidence(id: string): Promise<string[]> {
    const res = await apiClient.get<string[]>(`/insights/${id}/evidence`);
    return res.data;
  },
};
