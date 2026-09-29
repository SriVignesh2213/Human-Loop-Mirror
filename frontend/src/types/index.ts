export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  error_code?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  timezone: string;
  onboarding_completed: boolean;
  preferred_activity_duration: number;
  preferred_activity_types: string[];
  goal_lens: string;
  reward_style: string;
  energy_preference: string;
  social_preference: string;
  typical_free_time: string;
  high_risk_periods: string[];
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
  profile?: UserProfile;
}

export interface OnboardingData {
  display_name?: string;
  favorite_activities: string[];
  typical_free_time: string;
  preferred_activity_type: string;
  main_personal_goal: string;
  preferred_reward_style: string;
  avoid_activities: string[];
  difficulty_preference: string;
  social_solo_preference: string;
  creative_productive_relaxation: string;
  high_risk_periods: string[];
}

export interface Application {
  id: string;
  name: string;
  category: string;
  icon_name: string;
}

export interface NotificationItem {
  id: string;
  app_name: string;
  timestamp: string;
  title: string;
  content_preview: string;
}

export interface UsageSession {
  id: string;
  app_name: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_long_session: boolean;
  notification_associated: boolean;
  notification_id?: string;
  reflection_label?: 'Planned' | 'Necessary' | 'Relaxation' | 'Unplanned' | null;
}

export interface HabitLoopEvidenceItem {
  id: string;
  session_id?: string;
  session_timestamp: string;
  session_duration_minutes: number;
  notification_timestamp?: string;
  notification_title?: string;
  latency_minutes?: number;
}

export interface HabitLoop {
  id: string;
  app_name: string;
  trigger_description: string;
  action_description: string;
  time_window_start: string;
  time_window_end: string;
  occurrences_count: number;
  total_days_analyzed: number;
  average_duration_minutes: number;
  total_minutes_impact: number;
  confidence: 'low' | 'medium' | 'high';
  status: 'active' | 'interrupted' | 'improved';
  recommendation: string;
  last_detected_at: string;
  created_at: string;
  evidence_items?: HabitLoopEvidenceItem[];
}

export interface Insight {
  id: string;
  type: string;
  title: string;
  observation: string;
  evidence: string[];
  why_it_matters: string;
  recommendation: string;
  confidence: string;
  source: string;
  created_at: string;
  habit_loop_id?: string;
}

export interface Reflection {
  id: string;
  user_id: string;
  session_id?: string;
  intentionality_label: 'Planned' | 'Necessary' | 'Relaxation' | 'Unplanned';
  notes?: string;
  prompt_answered: string;
  created_at: string;
}

export interface ReflectionStats {
  total_reflections: number;
  breakdown: Record<string, number>;
  percentages: Record<string, number>;
}

export interface PersonalSwapSuggestion {
  id: string;
  habit_loop_id?: string;
  activity_id?: string;
  title: string;
  category: string;
  duration_minutes: number;
  difficulty: string;
  reason: string;
  user_fit: string;
  reward_type: string;
  status: 'suggested' | 'chosen' | 'started' | 'completed' | 'skipped';
  created_at: string;
}

export interface GoalProgress {
  id: string;
  date: string;
  achieved: boolean;
  metric_value: number;
}

export interface Goal {
  id: string;
  goal_lens: string;
  title: string;
  target_metric: string;
  target_value: number;
  current_value: number;
  unit: string;
  status: 'active' | 'paused' | 'completed';
  explanation: string;
  created_at: string;
  updated_at: string;
  progress_records?: GoalProgress[];
}

export interface DashboardSummary {
  total_screen_time_minutes: number;
  total_screen_time_formatted: string;
  peak_usage_period: string;
  notification_triggered_sessions: number;
  detected_habit_loops_count: number;
  biggest_insight?: Insight;
  active_habit_loop?: HabitLoop;
  what_changed: string;
  todays_goal?: Goal;
  personal_swap_suggested?: PersonalSwapSuggestion;
  recent_swaps?: PersonalSwapSuggestion[];
}

export interface DigitalDayEvent {
  id: string;
  event_type: 'session' | 'notification' | 'habit_loop' | 'reflection';
  timestamp: string;
  end_time?: string;
  app_name: string;
  duration_minutes?: number;
  is_long_session: boolean;
  notification_associated: boolean;
  notification_title?: string;
  reflection_label?: string;
  details?: string;
}

export interface DigitalDayData {
  date: string;
  view_type: 'day' | 'week';
  events: DigitalDayEvent[];
  total_screen_time_minutes: number;
  total_sessions: number;
  notification_triggered_count: number;
  long_sessions_count: number;
  late_night_count: number;
  top_apps: Record<string, number>;
}

export interface HabitEvolutionWeek {
  week_label: string;
  start_date: string;
  end_date: string;
  total_screen_time_hours: number;
  habit_loop_occurrences: number;
  notification_triggered_count: number;
  average_session_minutes: number;
  swaps_completed: number;
}

export interface ProgressData {
  screen_time_change_percent: number;
  habit_loop_frequency_change: number;
  notification_triggered_sessions_current: number;
  notification_triggered_sessions_previous: number;
  average_session_duration_current: number;
  average_session_duration_previous: number;
  swaps_completed_count: number;
  swaps_started_count: number;
  swap_completion_rate: number;
  time_reclaimed_minutes?: number | null;
  time_reclaimed_rationale?: string | null;
  weekly_evolution: HabitEvolutionWeek[];
  app_distribution: Record<string, number>;
  daily_screen_time_trend: Array<{
    date: string;
    total_minutes: number;
    hours: number;
    sessions: number;
    notification_triggered: number;
  }>;
}

export interface CsvImportResponse {
  total_records: number;
  imported_sessions: number;
  imported_notifications: number;
  skipped_duplicates: number;
  validation_warnings: string[];
}
