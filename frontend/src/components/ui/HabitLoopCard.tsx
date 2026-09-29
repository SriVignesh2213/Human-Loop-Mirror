import React, { useState } from 'react';
import { HabitLoop } from '../../types';
import { Repeat, ChevronDown, ChevronUp, Bell, Clock, ArrowRight, ShieldCheck, Shuffle } from 'lucide-react';
import { EvidencePanel } from './EvidencePanel';
import { useNavigate } from 'react-router-dom';

interface HabitLoopCardProps {
  habitLoop: HabitLoop;
  onExploreSwap?: () => void;
}

export const HabitLoopCard: React.FC<HabitLoopCardProps> = ({ habitLoop, onExploreSwap }) => {
  const [showEvidence, setShowEvidence] = useState(false);
  const navigate = useNavigate();

  const handleSwapClick = () => {
    if (onExploreSwap) {
      onExploreSwap();
    } else {
      navigate('/personal-swap');
    }
  };

  return (
    <div className="bg-charcoal-900 border border-charcoal-800 rounded-lg overflow-hidden transition-all hover:border-charcoal-700">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-charcoal-800 border border-telemetry-teal/30 flex items-center justify-center text-telemetry-teal">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-semibold text-charcoal-100">{habitLoop.app_name}</h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-telemetry-teal/15 text-telemetry-teal border border-telemetry-teal/30 uppercase">
                  {habitLoop.confidence} Confidence
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                  habitLoop.status === 'active'
                    ? 'bg-telemetry-amber/15 text-telemetry-amber border-telemetry-amber/30'
                    : 'bg-telemetry-emerald/15 text-telemetry-emerald border-telemetry-emerald/30'
                }`}>
                  {habitLoop.status}
                </span>
              </div>
              <span className="text-xs text-charcoal-400 font-mono">
                Window: {habitLoop.time_window_start} – {habitLoop.time_window_end}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-base font-mono font-semibold text-charcoal-100 block">
              {Math.round(habitLoop.total_minutes_impact)} min
            </span>
            <span className="text-[10px] text-charcoal-400 font-mono">
              ~{Math.round(habitLoop.average_duration_minutes)} min/session
            </span>
          </div>
        </div>

        {/* Behavioral Loop Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 my-3 p-3 bg-charcoal-950/70 border border-charcoal-800/80 rounded">
          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase text-charcoal-400 flex items-center space-x-1">
              <Bell className="w-3 h-3 text-telemetry-amber" />
              <span>Trigger (Preceding Event)</span>
            </div>
            <p className="text-xs text-charcoal-200">{habitLoop.trigger_description}</p>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-mono uppercase text-charcoal-400 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-telemetry-teal" />
              <span>Observed Pattern</span>
            </div>
            <p className="text-xs text-charcoal-200">
              Repeated in {habitLoop.occurrences_count} sessions across {habitLoop.total_days_analyzed} days
            </p>
          </div>
        </div>

        {/* Non-judgmental Recommendation */}
        {habitLoop.recommendation && (
          <div className="text-xs text-charcoal-300 bg-telemetry-teal/5 border-l-2 border-telemetry-teal p-2.5 rounded-r my-3">
            <span className="font-semibold text-telemetry-teal block text-[11px] uppercase tracking-wider mb-0.5">
              Reflective Recommendation
            </span>
            {habitLoop.recommendation}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-charcoal-800/60 mt-3">
          <button
            onClick={() => setShowEvidence(!showEvidence)}
            className="flex items-center space-x-1 text-xs text-charcoal-400 hover:text-charcoal-200 font-mono transition-colors"
          >
            <span>{showEvidence ? 'Hide Evidence' : 'Inspect Evidence'}</span>
            {showEvidence ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleSwapClick}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium bg-telemetry-teal/15 hover:bg-telemetry-teal/25 text-telemetry-teal border border-telemetry-teal/30 transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Try Personal Swap</span>
          </button>
        </div>
      </div>

      {/* Expandable Evidence Drawer */}
      {showEvidence && (
        <div className="px-5 pb-5 pt-2 border-t border-charcoal-800/80 bg-charcoal-950/40">
          <EvidencePanel
            habitLoopId={habitLoop.id}
            evidenceItems={habitLoop.evidence_items}
          />
        </div>
      )}
    </div>
  );
};
