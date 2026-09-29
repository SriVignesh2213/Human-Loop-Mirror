import React, { useEffect, useState } from 'react';
import { Reflection, ReflectionStats } from '../types';
import { reflectionService } from '../services/reflectionService';
import { ReflectionCard } from '../components/ui/ReflectionCard';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { MessageSquareQuote, PieChart } from 'lucide-react';

export const ReflectionPage: React.FC = () => {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [stats, setStats] = useState<ReflectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [reflData, statsData] = await Promise.all([
        reflectionService.getReflections(),
        reflectionService.getStats(),
      ]);
      setReflections(reflData);
      setStats(statsData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load reflections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-charcoal-800">
        <h1 className="text-xl font-bold tracking-tight text-charcoal-100 flex items-center space-x-2">
          <span>Intentionality Reflections</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-charcoal-800 text-charcoal-300 border border-charcoal-700">
            {stats?.total_reflections || 0} Logged
          </span>
        </h1>
        <p className="text-xs text-charcoal-400 mt-1">
          Self-regulation develops through honest labeling. A session is never bad or weak—it is simply planned, necessary, chosen relaxation, or unplanned.
        </p>
      </div>

      {/* Aggregate Composition Summary */}
      {stats && stats.total_reflections > 0 && (
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-lg p-5">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase text-charcoal-400 font-semibold mb-3">
            <PieChart className="w-4 h-4 text-telemetry-teal" />
            <span>Aggregate Intentionality Composition</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Planned', count: stats.breakdown['Planned'] || 0, pct: stats.percentages['Planned'] || 0, color: 'text-telemetry-teal border-telemetry-teal/30 bg-telemetry-teal/5' },
              { label: 'Necessary', count: stats.breakdown['Necessary'] || 0, pct: stats.percentages['Necessary'] || 0, color: 'text-telemetry-indigo border-telemetry-indigo/30 bg-telemetry-indigo/5' },
              { label: 'Relaxation', count: stats.breakdown['Relaxation'] || 0, pct: stats.percentages['Relaxation'] || 0, color: 'text-telemetry-emerald border-telemetry-emerald/30 bg-telemetry-emerald/5' },
              { label: 'Unplanned', count: stats.breakdown['Unplanned'] || 0, pct: stats.percentages['Unplanned'] || 0, color: 'text-telemetry-amber border-telemetry-amber/30 bg-telemetry-amber/5' },
            ].map((item) => (
              <div key={item.label} className={`border rounded p-3 ${item.color}`}>
                <div className="text-[11px] font-mono uppercase opacity-80">{item.label}</div>
                <div className="text-xl font-mono font-semibold text-charcoal-100 mt-1">{item.pct}%</div>
                <div className="text-[10px] text-charcoal-400 font-mono mt-0.5">{item.count} sessions</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Reflection Card for General Check-in */}
      <div className="space-y-2">
        <ReflectionCard
          appName="General Day Check-in"
          onSaved={() => fetchData()}
        />
      </div>

      {/* Historical Reflections List */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-mono uppercase text-charcoal-400 font-semibold tracking-wider">
          Recorded Reflections History
        </h3>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : reflections.length === 0 ? (
          <EmptyState
            icon={MessageSquareQuote}
            title="No Reflections Recorded Yet"
            description="Use the prompt above or inspect events in Digital Day to begin cataloging intentionality."
          />
        ) : (
          <div className="space-y-2">
            {reflections.map((r) => {
              const dt = new Date(r.created_at);
              const now = new Date();
              const diffDays = Math.floor((now.getTime() - dt.getTime()) / (1000 * 3600 * 24));
              const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const dateLabel =
                diffDays === 0
                  ? `Today at ${timeStr}`
                  : diffDays === 1
                  ? `Yesterday at ${timeStr}`
                  : diffDays < 7
                  ? `${dt.toLocaleDateString([], { weekday: 'short' })} at ${timeStr}`
                  : `${dt.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;

              const displayTitle =
                r.prompt_answered && r.prompt_answered !== 'Was this session intentional?'
                  ? r.prompt_answered
                  : r.notes
                  ? r.notes
                  : 'Digital Usage Session';

              return (
                <div
                  key={r.id}
                  className="bg-charcoal-900 border border-charcoal-800 rounded-lg p-3.5 flex items-center justify-between gap-3 text-xs hover:border-charcoal-700 transition-colors"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-charcoal-200 block">{displayTitle}</span>
                    {r.notes && r.prompt_answered !== r.notes && (
                      <span className="text-[11px] text-charcoal-400 block italic">"{r.notes}"</span>
                    )}
                    <span className="text-[10px] font-mono text-charcoal-500 block">{dateLabel}</span>
                  </div>

                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase shrink-0 font-medium ${
                    r.intentionality_label === 'Planned'
                      ? 'bg-telemetry-teal/15 text-telemetry-teal border-telemetry-teal/30'
                      : r.intentionality_label === 'Necessary'
                      ? 'bg-telemetry-indigo/15 text-telemetry-indigo border-telemetry-indigo/30'
                      : r.intentionality_label === 'Relaxation'
                      ? 'bg-telemetry-emerald/15 text-telemetry-emerald border-telemetry-emerald/30'
                      : 'bg-telemetry-amber/15 text-telemetry-amber border-telemetry-amber/30'
                  }`}>
                    {r.intentionality_label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
