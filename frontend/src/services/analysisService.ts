import { apiClient } from './apiClient';

export interface AnalysisRunResult {
  run_id: string;
  status: string;
  sessions_processed: number;
  notifications_processed: number;
  habit_loops_detected: number;
  insight_generated?: string;
  insight_source?: string;
}

export const analysisService = {
  async runAnalysis(): Promise<AnalysisRunResult> {
    const res = await apiClient.post<AnalysisRunResult>('/analysis/run');
    return res.data;
  },

  async getStatus(id: string): Promise<{
    id: string;
    status: string;
    sessions_processed: number;
    habit_loops_detected: number;
  }> {
    const res = await apiClient.get<{
      id: string;
      status: string;
      sessions_processed: number;
      habit_loops_detected: number;
    }>(`/analysis/status/${id}`);
    return res.data;
  },
};
