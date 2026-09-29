import React, { useEffect, useState } from 'react';
import { ProgressData, HabitEvolutionWeek } from '../types';
import { progressService } from '../services/progressService';
import { MetricCard } from '../components/ui/MetricCard';
import { DailyTrendChart, AppDistributionChart } from '../components/ui/ChartContainer';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import {
  TrendingUp,
  TrendingDown,
  Repeat,
  Bell,
  Clock,
  Shuffle,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export const ProgressPage: React.FC = () => {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await progressService.getProgress();
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load progress telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchProgress} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-charcoal-800">
        <h1 className="text-xl font-bold tracking-tight text-charcoal-100 flex items-center space-x-2">
          <span>Habit Evolution & Progress</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-charcoal-800 text-charcoal-300 border border-charcoal-700">
            Multi-Week Trajectory
          </span>
        </h1>
        <p className="text-xs text-charcoal-400 mt-1">
          Observing how your habit loops shift as you reflect and substitute impulses with self-chosen activities.
        </p>
      </div>

      {/* Top Progress Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Screen Time Shift"
          value={`${data?.screen_time_change_percent && data.screen_time_change_percent > 0 ? '+' : ''}${data?.screen_time_change_percent || 0}%`}
          subtext="Comparison between earlier & recent intervals"
          icon={data?.screen_time_change_percent && data.screen_time_change_percent <= 0 ? TrendingDown : TrendingUp}
          badge={{
            text: (data?.screen_time_change_percent || 0) <= 0 ? 'Decreased' : 'Increased',
            variant: (data?.screen_time_change_percent || 0) <= 0 ? 'teal' : 'amber',
          }}
        />

        <MetricCard
          label="Swaps Completed"
          value={data?.swaps_completed_count || 0}
          subtext={`${data?.swap_completion_rate || 0}% completion of chosen swaps`}
          icon={Shuffle}
          badge={{ text: 'Substituted', variant: 'teal' }}
        />

        <MetricCard
          label="Avg Session Duration"
          value={`${Math.round(data?.average_session_duration_current || 0)} min`}
          subtext={`Prev: ${Math.round(data?.average_session_duration_previous || 0)} min`}
          icon={Clock}
          badge={{ text: 'Duration', variant: 'slate' }}
        />

        <MetricCard
          label="Followed Alerts"
          value={data?.notification_triggered_sessions_current || 0}
          subtext={`Prev: ${data?.notification_triggered_sessions_previous || 0} alert sessions`}
          icon={Bell}
          badge={{ text: 'Current Period', variant: 'amber' }}
        />
      </div>

      {/* Verified Time Reclaimed Banner */}
      {data?.time_reclaimed_minutes !== null && data?.time_reclaimed_minutes !== undefined && data.time_reclaimed_minutes > 0 && (
        <div className="bg-charcoal-900 border border-telemetry-teal/30 rounded-lg p-5 flex items-start space-x-3.5">
          <div className="w-9 h-9 rounded bg-telemetry-teal/15 border border-telemetry-teal/30 flex items-center justify-center text-telemetry-teal flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-telemetry-teal font-semibold">
                Verified Time Reclaimed
              </span>
              <span className="text-sm font-mono font-bold text-charcoal-100">
                {Math.round(data.time_reclaimed_minutes)} minutes
              </span>
            </div>
            <p className="text-xs text-charcoal-300 mt-1 leading-relaxed">
              {data.time_reclaimed_rationale}
            </p>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Screen Time Trend */}
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-lg p-5 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase text-charcoal-400 font-semibold tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-telemetry-teal" />
            <span>Daily Telemetry Distribution</span>
          </div>
          <DailyTrendChart data={data?.daily_screen_time_trend || []} />
        </div>

        {/* Application Usage Breakdown */}
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase text-charcoal-400 font-semibold tracking-wider">
            <Clock className="w-3.5 h-3.5 text-telemetry-indigo" />
            <span>Top Application Distribution</span>
          </div>
          <AppDistributionChart distribution={data?.app_distribution || {}} />
        </div>
      </div>

      {/* Multi-Week Habit Evolution Table */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-lg p-5 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-mono uppercase text-charcoal-400 font-semibold tracking-wider">
          <Repeat className="w-3.5 h-3.5 text-telemetry-teal" />
          <span>Habit Evolution Across Observed Weeks</span>
        </div>

        {(!data?.weekly_evolution || data.weekly_evolution.length === 0) ? (
          <div className="text-xs text-charcoal-400 font-mono py-4 text-center italic">
            Accumulating multi-day data points to calculate habit evolution tiers.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-charcoal-300">
              <thead>
                <tr className="border-b border-charcoal-800 text-[10px] font-mono uppercase text-charcoal-400">
                  <th className="py-2.5 pr-4 font-semibold">Evolution Period</th>
                  <th className="py-2.5 px-3 font-semibold">Total Hours</th>
                  <th className="py-2.5 px-3 font-semibold">Loop Occurrences</th>
                  <th className="py-2.5 px-3 font-semibold">Followed Alerts</th>
                  <th className="py-2.5 px-3 font-semibold">Avg Session</th>
                  <th className="py-2.5 pl-3 font-semibold">Swaps Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-850 font-mono">
                {data.weekly_evolution.map((w: HabitEvolutionWeek, idx: number) => (
                  <tr key={idx} className="hover:bg-charcoal-800/40 transition-colors">
                    <td className="py-2.5 pr-4 font-semibold text-charcoal-100">
                      {w.week_label} <span className="text-[10px] text-charcoal-500 font-normal">({w.start_date} – {w.end_date})</span>
                    </td>
                    <td className="py-2.5 px-3 text-telemetry-teal">{w.total_screen_time_hours}h</td>
                    <td className="py-2.5 px-3 text-charcoal-200">{w.habit_loop_occurrences}</td>
                    <td className="py-2.5 px-3 text-telemetry-amber">{w.notification_triggered_count}</td>
                    <td className="py-2.5 px-3 text-charcoal-200">{w.average_session_minutes}m</td>
                    <td className="py-2.5 pl-3 text-telemetry-emerald">{w.swaps_completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
