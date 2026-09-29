import { apiClient } from './apiClient';
import { Goal } from '../types';

export const goalService = {
  async getGoals(): Promise<Goal[]> {
    const res = await apiClient.get<Goal[]>('/goals');
    return res.data;
  },

  async createGoal(goal: {
    goal_lens: string;
    title: string;
    target_metric: string;
    target_value: number;
    unit?: string;
    explanation?: string;
  }): Promise<Goal> {
    const res = await apiClient.post<Goal>('/goals', goal);
    return res.data;
  },

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    const res = await apiClient.put<Goal>(`/goals/${id}`, updates);
    return res.data;
  },
};
