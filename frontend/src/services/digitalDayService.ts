import { apiClient } from './apiClient';
import { DigitalDayData } from '../types';

export const digitalDayService = {
  async getTimeline(params?: {
    view?: 'day' | 'week';
    filter_type?: 'all' | 'notification_triggered' | 'long_sessions' | 'late_night' | 'intentional' | 'unplanned';
    date_str?: string;
  }): Promise<DigitalDayData> {
    const query = new URLSearchParams();
    if (params?.view) query.append('view', params.view);
    if (params?.filter_type) query.append('filter_type', params.filter_type);
    if (params?.date_str) query.append('date_str', params.date_str);

    const qs = query.toString();
    const endpoint = `/digital-day${qs ? `?${qs}` : ''}`;
    const res = await apiClient.get<DigitalDayData>(endpoint);
    return res.data;
  },
};
