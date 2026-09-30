import React, { useEffect, useState } from 'react';
import { DashboardSummary } from '../types';
import { dashboardService } from '../services/dashboardService';
import { analysisService } from '../services/analysisService';
import { MetricCard } from '../components/ui/MetricCard';
import { InsightCard } from '../components/ui/InsightCard';
import { HabitLoopCard } from '../components/ui/HabitLoopCard';
import { GoalCard } from '../components/ui/GoalCard';
import { PersonalSwapCard } from '../components/ui/PersonalSwapCard';
import { AppTrackingCard } from '../components/ui/AppTrackingCard';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import {
  Clock,
  Zap,
  Bell,
  Repeat,
  Sparkles,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  Inbox,
  FileText,
} from 'lucide-react';
import { progressService } from '../services/progressService';
import { useNavigate } from 'react-router-dom';

export const OverviewPage: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dashboardService.getSummary();
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load telemetry summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRunAnalysis = async () => {
    try {
      setAnalyzing(true);
      await analysisService.runAnalysis();
      await fetchDashboard();
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const blob = await progressService.exportPdf();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habit_mirror_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
        window.URL.revokeObjectURL(url);
      }, 1500);
    } catch (err) {
      console.error('PDF export failed', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboard} />;
  }

  const hasData = (data?.total_screen_time_minutes || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Title & Telemetry Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-charcoal-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-charcoal-100 flex items-center space-x-2">
            <span>Your Digital Day</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-telemetry-teal/15 text-telemetry-teal border border-telemetry-teal/30 uppercase font-normal">
              Live Baseline
            </span>
          </h1>
          <p className="text-xs text-charcoal-400 mt-1">
            Real-time behavioral telemetry, pattern detection, and personalized alternatives.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-telemetry-teal text-charcoal-950 hover:bg-telemetry-teal-bright disabled:opacity-50 transition-colors shadow-sm"
            title="Download executive PDF telemetry report"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{downloadingPdf ? 'Exporting...' : 'Download PDF'}</span>
          </button>

          <button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 border border-charcoal-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin text-telemetry-teal' : ''}`} />
            <span>{analyzing ? 'Analyzing Telemetry...' : 'Refresh Analysis'}</span>
          </button>
        </div>
      </div>

      {!hasData ? (
        <EmptyState
          icon={Inbox}
          title="No Digital Usage Recorded Yet"
          description="Import your usage CSV or load the bundled deterministic demo dataset to see your habit loops and personalized insights."
          actionLabel="Open Import Modal"
          onAction={() => {
            // Trigger import modal from header
            const importBtn = document.querySelector('header button');
            if (importBtn instanceof HTMLElement) importBtn.click();
          }}
        />
      ) : (
        <>
          {/* Top 4 Telemetry Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total Screen Time"
              value={data?.total_screen_time_formatted || '0h 0m'}
              subtext="Aggregated tracked sessions across active apps"
              icon={Clock}
              badge={{ text: 'Verified', variant: 'teal' }}
            />
            <MetricCard
              label="Peak Usage Period"
              value={data?.peak_usage_period || 'None'}
              subtext="Highest session density and duration cluster"
              icon={Zap}
              badge={{ text: 'Density Peak', variant: 'amber' }}
            />
            <MetricCard
              label="Followed Notification"
              value={data?.notification_triggered_sessions || 0}
              subtext="Sessions starting within 3 mins of alerts"
              icon={Bell}
              badge={{ text: 'Alert Triggered', variant: 'rose' }}
            />
            <MetricCard
              label="Detected Habit Loops"
              value={data?.detected_habit_loops_count || 0}
              subtext="Recurring multi-day patterns with verified evidence"
              icon={Repeat}
              badge={{ text: 'Active Loops', variant: 'teal' }}
            />
          </div>

          {/* Main Insight: Your Biggest Insight */}
          {data?.biggest_insight && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs font-mono uppercase text-charcoal-400 font-semibold tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-telemetry-teal" />
                <span>Your Biggest Insight</span>
              </div>
              <InsightCard insight={data.biggest_insight} isMain={true} />
            </div>
          )}

          {/* Middle Two-Column Grid: Active Habit Loop & What Changed? */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Habit Loop Detected */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono uppercase text-charcoal-400 font-semibold tracking-wider">
                <div className="flex items-center space-x-2">
                  <Repeat className="w-3.5 h-3.5 text-telemetry-teal" />
                  <span>Primary Habit Loop Detected</span>
                </div>
                <button
                  onClick={() => navigate('/habit-loops')}
                  className="text-telemetry-teal hover:underline text-[11px] capitalize"
                >
                  View All ({data?.detected_habit_loops_count || 0}) →
                </button>
              </div>

              {data?.active_habit_loop ? (
                <HabitLoopCard habitLoop={data.active_habit_loop} />
              ) : (
                <div className="bg-charcoal-900 border border-charcoal-800 rounded-lg p-5 text-center text-xs text-charcoal-400 font-mono">
                  No active habit loops exceeding threshold.
                </div>
              )}
            </div>

            {/* What Changed? */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs font-mono uppercase text-charcoal-400 font-semibold tracking-wider">
                <TrendingUp className="w-3.5 h-3.5 text-telemetry-indigo" />
                <span>What Changed?</span>
              </div>

              <div className="bg-charcoal-900 border border-charcoal-800 rounded-lg p-5 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-charcoal-100 mb-2">
                    Behavioral Shift Summary
                  </h4>
                  <p className="text-xs text-charcoal-300 leading-relaxed">
                    {data?.what_changed}
                  </p>
                </div>

                <div className="p-3 bg-charcoal-950/70 border border-charcoal-800 rounded text-xs text-charcoal-400 space-y-1">
                  <div className="font-mono text-[10px] uppercase text-charcoal-300">
                    Observation Philosophy:
                  </div>
                  <div>
                    Telemetry reveals timing and environmental triggers. By naming the moment an alert arrives, you regain the agency to choose your response.
                  </div>
                </div>

                <button
                  onClick={() => navigate('/digital-day')}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded text-xs font-medium bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 transition-colors"
                >
                  <span>Explore Chronological Digital Day</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Application & Category Tracking */}
          <AppTrackingCard />

          {/* Bottom Grid: Today's Goal & Personal Swap Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Goal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono uppercase text-charcoal-400 font-semibold tracking-wider">
                <span>Today's Goal</span>
                <button
                  onClick={() => navigate('/goals')}
                  className="text-telemetry-teal hover:underline text-[11px] capitalize"
                >
                  Manage Goals →
                </button>
              </div>

              {data?.todays_goal ? (
                <GoalCard goal={data.todays_goal} onUpdated={fetchDashboard} />
              ) : (
                <div className="bg-charcoal-900 border border-charcoal-800 rounded-lg p-5 text-center text-xs text-charcoal-400">
                  No active goal set for today.
                </div>
              )}
            </div>

            {/* Suggested Personal Swap */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono uppercase text-charcoal-400 font-semibold tracking-wider">
                <span>Recommended Personal Swap</span>
                <button
                  onClick={() => navigate('/personal-swap')}
                  className="text-telemetry-teal hover:underline text-[11px] capitalize"
                >
                  Explore All Tiers →
                </button>
              </div>

              {data?.personal_swap_suggested ? (
                <PersonalSwapCard
                  suggestion={data.personal_swap_suggested}
                  onStatusChanged={fetchDashboard}
                />
              ) : (
                <div className="bg-charcoal-900 border border-charcoal-800 rounded-lg p-5 text-center text-xs text-charcoal-400">
                  No pending Personal Swap suggestions. Explore the Personal Swap page to generate alternatives.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
