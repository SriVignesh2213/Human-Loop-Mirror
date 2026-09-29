import React, { useState } from 'react';
import { PersonalSwapSuggestion } from '../../types';
import { Clock, Check, Play, SkipForward, Sparkles, Award } from 'lucide-react';
import { personalSwapService } from '../../services/personalSwapService';

interface PersonalSwapCardProps {
  suggestion: PersonalSwapSuggestion;
  onStatusChanged?: () => void;
}

export const PersonalSwapCard: React.FC<PersonalSwapCardProps> = ({ suggestion, onStatusChanged }) => {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(suggestion.status);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  const handleStart = async () => {
    try {
      setLoading(true);
      await personalSwapService.startTask(suggestion.id);
      setCurrentStatus('started');
      if (onStatusChanged) onStatusChanged();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      const res = await personalSwapService.completeTask(suggestion.id, { rating: 5 });
      setCurrentStatus('completed');
      setCompletionMessage(res.message || 'Nice. You interrupted the loop with an activity you chose.');
      if (onStatusChanged) onStatusChanged();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      setLoading(true);
      await personalSwapService.skipTask(suggestion.id);
      setCurrentStatus('skipped');
      if (onStatusChanged) onStatusChanged();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categoryColors: Record<string, string> = {
    creative: 'text-telemetry-teal bg-telemetry-teal/10 border-telemetry-teal/30',
    coding: 'text-telemetry-indigo bg-telemetry-indigo/10 border-telemetry-indigo/30',
    music: 'text-telemetry-amber bg-telemetry-amber/10 border-telemetry-amber/30',
    exercise: 'text-telemetry-rose bg-telemetry-rose/10 border-telemetry-rose/30',
    reading: 'text-telemetry-teal bg-telemetry-teal/10 border-telemetry-teal/30',
    relaxation: 'text-telemetry-emerald bg-telemetry-emerald/10 border-telemetry-emerald/30',
  };
  const catBadge = categoryColors[suggestion.category.toLowerCase()] || 'text-charcoal-300 bg-charcoal-800 border-charcoal-700';

  if (currentStatus === 'completed') {
    return (
      <div className="bg-charcoal-900 border border-telemetry-emerald/40 rounded-lg p-5 text-center space-y-2">
        <div className="w-10 h-10 rounded-full bg-telemetry-emerald/15 border border-telemetry-emerald/30 flex items-center justify-center text-telemetry-emerald mx-auto">
          <Award className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-semibold text-charcoal-100">{suggestion.title}</h4>
        <p className="text-xs text-telemetry-emerald font-medium">
          {completionMessage || 'Nice. You interrupted the loop with an activity you chose.'}
        </p>
      </div>
    );
  }

  if (currentStatus === 'skipped') {
    return null;
  }

  return (
    <div className={`bg-charcoal-900 border rounded-lg p-5 flex flex-col justify-between transition-all ${
      currentStatus === 'started'
        ? 'border-telemetry-teal shadow-subtle'
        : 'border-charcoal-800 hover:border-charcoal-700'
    }`}>
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-medium ${catBadge}`}>
            {suggestion.category}
          </span>
          <div className="flex items-center space-x-1 text-xs font-mono text-charcoal-300">
            <Clock className="w-3.5 h-3.5 text-telemetry-teal" />
            <span>{suggestion.duration_minutes} min option</span>
          </div>
        </div>

        <h4 className="text-sm font-semibold text-charcoal-100 mb-1.5">{suggestion.title}</h4>
        <p className="text-xs text-charcoal-300 leading-relaxed mb-3">{suggestion.reason}</p>

        <div className="flex items-center space-x-2 text-[10px] font-mono text-charcoal-400 mb-4">
          <span className="px-1.5 py-0.5 rounded bg-charcoal-800">Difficulty: {suggestion.difficulty}</span>
          <span className="px-1.5 py-0.5 rounded bg-charcoal-800">Fit: {suggestion.user_fit}</span>
          <span className="px-1.5 py-0.5 rounded bg-charcoal-800">Reward: {suggestion.reward_type}</span>
        </div>
      </div>

      <div className="pt-3 border-t border-charcoal-800/80 flex items-center justify-between gap-2">
        {currentStatus === 'suggested' && (
          <>
            <button
              onClick={handleSkip}
              disabled={loading}
              className="text-xs text-charcoal-400 hover:text-charcoal-200 transition-colors py-1.5 px-2"
            >
              Not For Me
            </button>
            <button
              onClick={handleStart}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-telemetry-teal text-charcoal-950 hover:bg-telemetry-teal-bright transition-colors shadow-sm"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Choose This</span>
            </button>
          </>
        )}

        {currentStatus === 'started' && (
          <>
            <button
              onClick={handleSkip}
              disabled={loading}
              className="flex items-center space-x-1 text-xs text-charcoal-400 hover:text-charcoal-200"
            >
              <SkipForward className="w-3 h-3" />
              <span>Skip</span>
            </button>
            <button
              onClick={handleComplete}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-telemetry-emerald text-charcoal-950 hover:bg-telemetry-emerald/90 transition-colors shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Complete Task</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
