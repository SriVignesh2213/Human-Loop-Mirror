import React, { useEffect, useState } from 'react';
import { HabitLoopEvidenceItem } from '../../types';
import { habitLoopService } from '../../services/habitLoopService';
import { Skeleton } from './Skeleton';
import { Bell, Clock, FileCheck } from 'lucide-react';

interface EvidencePanelProps {
  habitLoopId: string;
  evidenceItems?: HabitLoopEvidenceItem[];
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ habitLoopId, evidenceItems: initialItems }) => {
  const [items, setItems] = useState<HabitLoopEvidenceItem[]>(initialItems || []);
  const [loading, setLoading] = useState<boolean>(!initialItems || initialItems.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialItems || initialItems.length === 0) {
      const fetchEv = async () => {
        try {
          setLoading(true);
          const data = await habitLoopService.getEvidence(habitLoopId);
          setItems(data);
        } catch (err: unknown) {
          setError('Could not load evidence records.');
        } finally {
          setLoading(false);
        }
      };
      fetchEv();
    }
  }, [habitLoopId, initialItems]);

  if (loading) {
    return (
      <div className="space-y-2 py-2">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="text-xs text-telemetry-rose py-2">{error}</div>;
  }

  if (items.length === 0) {
    return (
      <div className="text-xs text-charcoal-400 py-2 italic font-mono">
        No specific timestamp records available for this pattern.
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center space-x-1.5 text-[11px] font-mono uppercase text-charcoal-400 font-semibold tracking-wider pb-1">
        <FileCheck className="w-3.5 h-3.5 text-telemetry-teal" />
        <span>Verified Evidence Records ({items.length} Occurrences)</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-charcoal-300">
          <thead>
            <tr className="border-b border-charcoal-800 text-[10px] font-mono uppercase text-charcoal-400">
              <th className="py-2 pr-3 font-semibold">Date / Session Start</th>
              <th className="py-2 px-3 font-semibold">Duration</th>
              <th className="py-2 px-3 font-semibold">Preceding Notification</th>
              <th className="py-2 pl-3 font-semibold">Latency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-charcoal-850">
            {items.map((ev) => {
              const dt = new Date(ev.session_timestamp);
              const formattedDate = dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              const formattedTime = dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

              return (
                <tr key={ev.id} className="hover:bg-charcoal-900/60 transition-colors">
                  <td className="py-2 pr-3 font-mono text-charcoal-200">
                    <span className="text-charcoal-400 mr-1.5">{formattedDate}</span>
                    {formattedTime}
                  </td>
                  <td className="py-2 px-3 font-mono text-charcoal-100">
                    {Math.round(ev.session_duration_minutes)} min
                  </td>
                  <td className="py-2 px-3">
                    {ev.notification_title ? (
                      <div className="flex items-center space-x-1.5">
                        <Bell className="w-3 h-3 text-telemetry-amber flex-shrink-0" />
                        <span className="truncate max-w-xs">{ev.notification_title}</span>
                      </div>
                    ) : (
                      <span className="text-charcoal-400 italic">None logged</span>
                    )}
                  </td>
                  <td className="py-2 pl-3 font-mono">
                    {ev.latency_minutes !== undefined && ev.latency_minutes !== null ? (
                      <span className="text-telemetry-teal">
                        session followed notification within {ev.latency_minutes}m
                      </span>
                    ) : (
                      <span className="text-charcoal-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
