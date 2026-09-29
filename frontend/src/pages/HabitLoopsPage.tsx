import React, { useEffect, useState } from 'react';
import { HabitLoop } from '../types';
import { habitLoopService } from '../services/habitLoopService';
import { HabitLoopCard } from '../components/ui/HabitLoopCard';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Repeat, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HabitLoopsPage: React.FC = () => {
  const [loops, setLoops] = useState<HabitLoop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchLoops = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await habitLoopService.getHabitLoops();
      setLoops(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load habit loops.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoops();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-4 border-b border-charcoal-800">
        <h1 className="text-xl font-bold tracking-tight text-charcoal-100 flex items-center space-x-2">
          <span>Detected Habit Loops</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-telemetry-teal/15 text-telemetry-teal border border-telemetry-teal/30">
            {loops.length} Identified
          </span>
        </h1>
        <p className="text-xs text-charcoal-400 mt-1">
          A habit loop requires verifiable evidence: the same app, a recurring time window, and repetition across multiple days.
        </p>
      </div>

      {/* Philosophy Callout */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-lg p-4 flex items-start space-x-3 text-xs text-charcoal-300">
        <Info className="w-4 h-4 text-telemetry-teal flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-charcoal-100">Evidence Criterion:</strong> Habit loops are not assumptions. Our engine isolates sessions preceded by app notifications within 3 minutes, recurring during distinct temporal clusters. You can inspect the exact evidence log for every pattern below.
        </div>
      </div>

      {/* Habit Loops List */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchLoops} />
      ) : loops.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No Habit Loops Detected Yet"
          description="Import your usage telemetry CSV to detect recurring behavioral loops across your digital day."
        />
      ) : (
        <div className="space-y-4">
          {loops.map((loop) => (
            <HabitLoopCard
              key={loop.id}
              habitLoop={loop}
              onExploreSwap={() => navigate('/personal-swap')}
            />
          ))}
        </div>
      )}
    </div>
  );
};
