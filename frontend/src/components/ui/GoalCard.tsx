import React, { useState } from 'react';
import { Goal } from '../../types';
import { Target, Pause, Play, CheckCircle2 } from 'lucide-react';
import { goalService } from '../../services/goalService';

interface GoalCardProps {
  goal: Goal;
  onUpdated?: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onUpdated }) => {
  const [status, setStatus] = useState(goal.status);
  const [loading, setLoading] = useState(false);

  const togglePause = async () => {
    try {
      setLoading(true);
      const newStatus = status === 'active' ? 'paused' : 'active';
      await goalService.updateGoal(goal.id, { status: newStatus });
      setStatus(newStatus);
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pct = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));

  return (
    <div className="bg-charcoal-900 border border-charcoal-800 rounded-lg p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-charcoal-800 border border-telemetry-teal/30 flex items-center justify-center text-telemetry-teal">
            <Target className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-charcoal-800 text-charcoal-300 border border-charcoal-700 uppercase">
              {goal.goal_lens}
            </span>
            <h4 className="text-sm font-semibold text-charcoal-100 mt-1">{goal.title}</h4>
          </div>
        </div>

        <button
          onClick={togglePause}
          disabled={loading}
          className="p-1.5 rounded text-charcoal-400 hover:text-charcoal-200 hover:bg-charcoal-800 transition-colors"
          title={status === 'active' ? 'Pause goal' : 'Resume goal'}
        >
          {status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-telemetry-teal" />}
        </button>
      </div>

      <p className="text-xs text-charcoal-400 my-2 leading-relaxed">{goal.explanation}</p>

      {/* Progress Telemetry */}
      <div className="mt-4 pt-3 border-t border-charcoal-800/80">
        <div className="flex items-center justify-between text-xs font-mono mb-1.5">
          <span className="text-charcoal-400">Target Threshold:</span>
          <span className="text-charcoal-200 font-semibold">
            {goal.target_value} {goal.unit}
          </span>
        </div>

        <div className="w-full bg-charcoal-800 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              pct > 90 ? 'bg-telemetry-amber' : 'bg-telemetry-teal'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-charcoal-400 mt-1.5">
          <span>Current: {goal.current_value} {goal.unit}</span>
          <span className="uppercase text-[10px]">{status}</span>
        </div>
      </div>
    </div>
  );
};
