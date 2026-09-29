import React, { useEffect, useState } from 'react';
import { PersonalSwapSuggestion, HabitLoop } from '../types';
import { personalSwapService } from '../services/personalSwapService';
import { habitLoopService } from '../services/habitLoopService';
import { PersonalSwapCard } from '../components/ui/PersonalSwapCard';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Shuffle, Sparkles, Repeat } from 'lucide-react';

export const PersonalSwapPage: React.FC = () => {
  const [suggestions, setSuggestions] = useState<PersonalSwapSuggestion[]>([]);
  const [activeHabit, setActiveHabit] = useState<HabitLoop | null>(null);
  const [loading, setLoading] = useState(true);
  const [shuffling, setShuffling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sugData, loopsData] = await Promise.all([
        personalSwapService.getSuggestions(),
        habitLoopService.getHabitLoops(),
      ]);
      setSuggestions(sugData);
      if (loopsData.length > 0) {
        setActiveHabit(loopsData[0]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load Personal Swap alternatives.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleShuffle = async () => {
    try {
      setShuffling(true);
      const fresh = await personalSwapService.generateSuggestions({ force_refresh: true });
      setSuggestions(fresh);
    } catch (err) {
      console.error(err);
    } finally {
      setShuffling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-charcoal-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-charcoal-100 flex items-center space-x-2">
            <span>Personal Swap</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-telemetry-teal/15 text-telemetry-teal border border-telemetry-teal/30">
              Sublimation Engine
            </span>
          </h1>
          <h2 className="text-sm text-charcoal-300 font-sans italic mt-1">
            "Try something you'd actually enjoy."
          </h2>
        </div>

        <button
          onClick={handleShuffle}
          disabled={shuffling}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded text-xs font-semibold bg-charcoal-800 hover:bg-charcoal-700 text-telemetry-teal border border-charcoal-700 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Shuffle className={`w-3.5 h-3.5 ${shuffling ? 'animate-spin' : ''}`} />
          <span>Shuffle Alternatives</span>
        </button>
      </div>

      {/* Habit Context Card */}
      {activeHabit && (
        <div className="bg-charcoal-900 border border-charcoal-800 rounded-lg p-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-charcoal-400">
            <span className="flex items-center space-x-1">
              <Repeat className="w-3.5 h-3.5 text-telemetry-amber" />
              <span>Target Loop Being Interrupted</span>
            </span>
            <span className="text-charcoal-200">{activeHabit.app_name}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-2.5 rounded bg-charcoal-950/60 border border-charcoal-850">
              <span className="text-[10px] font-mono text-charcoal-400 block uppercase">Trigger</span>
              <span className="text-charcoal-200 mt-0.5 block">{activeHabit.trigger_description}</span>
            </div>
            <div className="p-2.5 rounded bg-charcoal-950/60 border border-charcoal-850">
              <span className="text-[10px] font-mono text-charcoal-400 block uppercase">Time Context</span>
              <span className="text-charcoal-200 mt-0.5 block">{activeHabit.time_window_start} – {activeHabit.time_window_end}</span>
            </div>
            <div className="p-2.5 rounded bg-charcoal-950/60 border border-charcoal-850">
              <span className="text-[10px] font-mono text-charcoal-400 block uppercase">Typical Duration</span>
              <span className="text-charcoal-200 mt-0.5 block">~{Math.round(activeHabit.average_duration_minutes)} minutes</span>
            </div>
          </div>
        </div>
      )}

      {/* Available Alternatives */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-xs font-mono uppercase text-charcoal-400 font-semibold tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-telemetry-teal" />
          <span>Available Personal Swap Alternatives</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-52 w-full" />
            <Skeleton className="h-52 w-full" />
            <Skeleton className="h-52 w-full" />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : suggestions.length === 0 ? (
          <EmptyState
            icon={Shuffle}
            title="No Alternative Activities Generated"
            description="Click shuffle or complete onboarding to populate personalized options from your activity library."
            actionLabel="Generate Alternatives"
            onAction={handleShuffle}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suggestions.slice(0, 3).map((sug) => (
              <PersonalSwapCard
                key={sug.id}
                suggestion={sug}
                onStatusChanged={fetchData}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
