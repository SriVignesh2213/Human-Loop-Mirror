import { apiClient } from './apiClient';
import { HabitLoop, HabitLoopEvidenceItem } from '../types';

export const habitLoopService = {
  async getHabitLoops(): Promise<HabitLoop[]> {
    const res = await apiClient.get<HabitLoop[]>('/habit-loops');
    return res.data;
  },

  async getHabitLoopById(id: string): Promise<HabitLoop> {
    const res = await apiClient.get<HabitLoop>(`/habit-loops/${id}`);
    return res.data;
  },

  async getEvidence(id: string): Promise<HabitLoopEvidenceItem[]> {
    const res = await apiClient.get<HabitLoopEvidenceItem[]>(`/habit-loops/${id}/evidence`);
    return res.data;
  },
};
