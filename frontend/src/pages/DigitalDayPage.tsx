import React, { useEffect, useState } from 'react';
import { DigitalDayData, DigitalDayEvent } from '../types';
import { digitalDayService } from '../services/digitalDayService';
import { TimelineEvent } from '../components/ui/TimelineEvent';
import { ReflectionCard } from '../components/ui/ReflectionCard';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { AppTrackingCard } from '../components/ui/AppTrackingCard';
import { Modal } from '../components/ui/Modal';
import { Filter, Inbox } from 'lucide-react';

export const DigitalDayPage: React.FC = () => {
  const [data, setData] = useState<DigitalDayData | null>(null);
  const [view, setView] = useState<'day' | 'week'>('day');
  const [filterType, setFilterType] = useState<
    'all' | 'notification_triggered' | 'long_sessions' | 'late_night' | 'intentional' | 'unplanned'
  >('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reflection modal state
  const [reflectingSession, setReflectingSession] = useState<DigitalDayEvent | null>(null);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await digitalDayService.getTimeline({ view, filter_type: filterType });
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load Digital Day timeline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [view, filterType]);

  const filterButtons: Array<{ id: typeof filterType; label: string }> = [
    { id: 'all', label: 'All Sessions' },
    { id: 'notification_triggered', label: 'Followed Notification' },
    { id: 'long_sessions', label: 'Long (30m+)' },
    { id: 'late_night', label: 'Late Night' },
    { id: 'intentional', label: 'Intentional' },
    { id: 'unplanned', label: 'Unplanned' },
  ];

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-charcoal-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-charcoal-100 flex items-center space-x-2">
            <span>Digital Day</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-charcoal-800 text-charcoal-300 border border-charcoal-700">
              Chronological Stream
            </span>
          </h1>
          <p className="text-xs text-charcoal-400 mt-1">
            Observe sessions and alerts in the order they occurred. Language adheres to strict non-judgmental observation.
          </p>
        </div>

        {/* View Toggle: Day vs Week */}
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-charcoal-900 border border-charcoal-800 flex space-x-1">
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                view === 'day'
                  ? 'bg-telemetry-teal text-charcoal-950 font-semibold'
                  : 'text-charcoal-400 hover:text-charcoal-200'
              }`}
            >
              Day View
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                view === 'week'
                  ? 'bg-telemetry-teal text-charcoal-950 font-semibold'
                  : 'text-charcoal-400 hover:text-charcoal-200'
              }`}
            >
              Week View
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        <Filter className="w-3.5 h-3.5 text-charcoal-500 flex-shrink-0" />
        {filterButtons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilterType(btn.id)}
            className={`px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors border ${
              filterType === btn.id
                ? 'bg-telemetry-teal/15 text-telemetry-teal border-telemetry-teal/30 font-medium'
                : 'bg-charcoal-900 text-charcoal-400 border-charcoal-800 hover:border-charcoal-700 hover:text-charcoal-200'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Summary Chips */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-charcoal-900 border border-charcoal-800 rounded p-3">
            <span className="text-[10px] font-mono text-charcoal-400 uppercase block">Total Duration</span>
            <span className="text-base font-mono font-semibold text-charcoal-100">
              {Math.round(data.total_screen_time_minutes)} mins
            </span>
          </div>
          <div className="bg-charcoal-900 border border-charcoal-800 rounded p-3">
            <span className="text-[10px] font-mono text-charcoal-400 uppercase block">Followed Alerts</span>
            <span className="text-base font-mono font-semibold text-telemetry-amber">
              {data.notification_triggered_count} sessions
            </span>
          </div>
          <div className="bg-charcoal-900 border border-charcoal-800 rounded p-3">
            <span className="text-[10px] font-mono text-charcoal-400 uppercase block">30+ Min Sessions</span>
            <span className="text-base font-mono font-semibold text-telemetry-rose">
              {data.long_sessions_count}
            </span>
          </div>
          <div className="bg-charcoal-900 border border-charcoal-800 rounded p-3">
            <span className="text-[10px] font-mono text-charcoal-400 uppercase block">Late Night Sessions</span>
            <span className="text-base font-mono font-semibold text-telemetry-indigo">
              {data.late_night_count}
            </span>
          </div>
        </div>
      )}

      {/* App & Category Tracking Breakdown */}
      <AppTrackingCard />

      {/* Timeline Stream */}
      {loading ? (
        <div className="space-y-4 py-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchTimeline} />
      ) : !data || data.events.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No Matching Events Found"
          description="Try changing the filter or view to inspect other logged sessions and notifications."
        />
      ) : (
        <div className="pt-4">
          {data.events.map((ev: DigitalDayEvent) => (
            <TimelineEvent
              key={ev.id}
              event={ev}
              onReflect={(sessionId: string) => setReflectingSession(ev)}
            />
          ))}
        </div>
      )}

      {/* Modal for In-Place Session Reflection */}
      <Modal
        isOpen={Boolean(reflectingSession)}
        onClose={() => setReflectingSession(null)}
        title="Session Intentionality Reflection"
      >
        {reflectingSession && (
          <ReflectionCard
            sessionId={reflectingSession.id}
            appName={reflectingSession.app_name}
            durationMinutes={reflectingSession.duration_minutes}
            initialLabel={reflectingSession.reflection_label as 'Planned' | 'Necessary' | 'Relaxation' | 'Unplanned'}
            onSaved={(label: 'Planned' | 'Necessary' | 'Relaxation' | 'Unplanned') => {
              setData((prev: DigitalDayData | null) => {
                if (!prev) return null;
                const updated = prev.events.map((e: DigitalDayEvent) =>
                  e.id === reflectingSession.id ? { ...e, reflection_label: label } : e
                );
                return { ...prev, events: updated };
              });
              setTimeout(() => setReflectingSession(null), 800);
            }}
          />
        )}
      </Modal>
    </div>
  );
};
