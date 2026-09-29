import React, { useEffect, useState } from 'react';
import { Insight } from '../types';
import { insightService } from '../services/insightService';
import { InsightCard } from '../components/ui/InsightCard';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Sparkles, ShieldCheck } from 'lucide-react';

export const AiInsightsPage: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await insightService.getInsights();
      setInsights(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load insights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-charcoal-800">
        <h1 className="text-xl font-bold tracking-tight text-charcoal-100 flex items-center space-x-2">
          <span>AI Behavioral Insights</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-telemetry-teal/15 text-telemetry-teal border border-telemetry-teal/30">
            Kimi K3 Reasoning
          </span>
        </h1>
        <p className="text-xs text-charcoal-400 mt-1">
          Python analytics calculates ground truth statistics. Kimi K3 interprets and synthesizes the verified evidence into actionable self-awareness.
        </p>
      </div>

      {/* Safety Notice */}
      <div className="p-3.5 bg-charcoal-900 border border-charcoal-800 rounded-lg flex items-center space-x-2.5 text-xs text-charcoal-400">
        <ShieldCheck className="w-4 h-4 text-telemetry-teal flex-shrink-0" />
        <span>
          Habit Loop Mirror does not diagnose medical conditions or promise addiction cures. All recommendations represent self-chosen alternative responses to recurring digital triggers.
        </span>
      </div>

      {/* Insights List */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchInsights} />
      ) : insights.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No Insights Generated Yet"
          description="Import your usage CSV to run behavioral analysis and synthesize explainable habit insights."
        />
      ) : (
        <div className="space-y-4">
          {insights.map((insight, idx) => (
            <InsightCard key={insight.id} insight={insight} isMain={idx === 0} />
          ))}
        </div>
      )}
    </div>
  );
};
