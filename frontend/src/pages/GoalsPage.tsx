import React, { useEffect, useState } from 'react';
import { Goal } from '../types';
import { goalService } from '../services/goalService';
import { GoalCard } from '../components/ui/GoalCard';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Modal } from '../components/ui/Modal';
import { Target, Plus } from 'lucide-react';

export const GoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New goal form state
  const [newTitle, setNewTitle] = useState('');
  const [newLens, setNewLens] = useState('Reduce Digital Distraction');
  const [newTarget, setNewTarget] = useState(45);
  const [newUnit, setNewUnit] = useState('minutes/day');
  const [newExplanation, setNewExplanation] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await goalService.getGoals();
      setGoals(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load goals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      await goalService.createGoal({
        title: newTitle,
        goal_lens: newLens,
        target_metric: 'daily_minutes',
        target_value: newTarget,
        unit: newUnit,
        explanation: newExplanation || `Goal aligned with your ${newLens} lens.`,
      });
      setCreateModalOpen(false);
      setNewTitle('');
      setNewExplanation('');
      await fetchGoals();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-charcoal-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-charcoal-100 flex items-center space-x-2">
            <span>Self-Regulation Goals</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-charcoal-800 text-charcoal-300 border border-charcoal-700">
              {goals.length} Active Lenses
            </span>
          </h1>
          <p className="text-xs text-charcoal-400 mt-1">
            Set compassionate boundaries based on your observed usage baseline rather than arbitrary pressure.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded text-xs font-semibold bg-telemetry-teal text-charcoal-950 hover:bg-telemetry-teal-bright transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchGoals} />
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No Goals Configured"
          description="Create a personal goal to reflect against your daily telemetry."
          actionLabel="Create Goal"
          onAction={() => setCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onUpdated={fetchGoals} />
          ))}
        </div>
      )}

      {/* Create Goal Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Self-Regulation Goal"
      >
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-charcoal-300 mb-1">
              Goal Lens
            </label>
            <select
              value={newLens}
              onChange={(e) => setNewLens(e.target.value)}
              className="w-full px-3 py-2 rounded bg-charcoal-950 border border-charcoal-700 text-charcoal-100 text-xs focus:outline-none focus:border-telemetry-teal"
            >
              <option value="Focus / Study">Focus / Study</option>
              <option value="Sleep">Sleep & Night Wind-down</option>
              <option value="Be Present">Be Present</option>
              <option value="Reduce Digital Distraction">Reduce Digital Distraction</option>
              <option value="Build Better Routines">Build Better Routines</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-charcoal-300 mb-1">
              Goal Title
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., Contain Evening Social Browsing to 30 mins"
              className="w-full px-3 py-2 rounded bg-charcoal-950 border border-charcoal-700 text-charcoal-100 text-xs focus:outline-none focus:border-telemetry-teal"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-charcoal-300 mb-1">
                Target Threshold
              </label>
              <input
                type="number"
                required
                min={5}
                value={newTarget}
                onChange={(e) => setNewTarget(Number(e.target.value))}
                className="w-full px-3 py-2 rounded bg-charcoal-950 border border-charcoal-700 text-charcoal-100 text-xs focus:outline-none focus:border-telemetry-teal font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-charcoal-300 mb-1">
                Unit
              </label>
              <input
                type="text"
                required
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="w-full px-3 py-2 rounded bg-charcoal-950 border border-charcoal-700 text-charcoal-100 text-xs focus:outline-none focus:border-telemetry-teal font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-charcoal-300 mb-1">
              Personal Rationale / Notes
            </label>
            <textarea
              rows={2}
              value={newExplanation}
              onChange={(e) => setNewExplanation(e.target.value)}
              placeholder="Why this boundary matters to your life rhythm..."
              className="w-full px-3 py-2 rounded bg-charcoal-950 border border-charcoal-700 text-charcoal-100 text-xs focus:outline-none focus:border-telemetry-teal"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-charcoal-800">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-3 py-1.5 rounded text-xs text-charcoal-400 hover:text-charcoal-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !newTitle.trim()}
              className="px-4 py-1.5 rounded text-xs font-semibold bg-telemetry-teal text-charcoal-950 hover:bg-telemetry-teal-bright disabled:opacity-50 transition-colors shadow-sm"
            >
              {creating ? 'Saving...' : 'Create Goal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
