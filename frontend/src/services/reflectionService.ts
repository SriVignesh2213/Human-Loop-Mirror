import { apiClient } from './apiClient';
import { Reflection, ReflectionStats } from '../types';

export const reflectionService = {
  async getReflections(): Promise<Reflection[]> {
    const res = await apiClient.get<Reflection[]>('/reflections');
    return res.data;
  },

  async getStats(): Promise<ReflectionStats> {
    const res = await apiClient.get<ReflectionStats>('/reflections/stats');
    return res.data;
  },

  async createReflection(reflection: {
    session_id?: string;
    intentionality_label: 'Planned' | 'Necessary' | 'Relaxation' | 'Unplanned';
    notes?: string;
  }): Promise<Reflection> {
    const res = await apiClient.post<Reflection>('/reflections', reflection);
    return res.data;
  },
};
