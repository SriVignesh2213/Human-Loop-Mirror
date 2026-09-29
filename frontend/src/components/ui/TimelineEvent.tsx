import React from 'react';
import { DigitalDayEvent } from '../../types';
import { Clock, Bell, AlertCircle, MessageSquareQuote, Check } from 'lucide-react';

interface TimelineEventProps {
  event: DigitalDayEvent;
  onReflect?: (sessionId: string) => void;
}

export const TimelineEvent: React.FC<TimelineEventProps> = ({ event, onReflect }) => {
  const dt = new Date(event.timestamp);
  const timeStr = dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const dateStr = dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <div className="flex items-start space-x-3 group relative pb-6 last:pb-0">
      {/* Vertical line connecting events */}
      <div className="absolute left-3.5 top-6 bottom-0 w-px bg-charcoal-800 group-last:hidden" />

      {/* Event node dot */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 border transition-all ${
        event.notification_associated
          ? 'bg-telemetry-amber/20 border-telemetry-amber text-telemetry-amber'
          : event.is_long_session
          ? 'bg-telemetry-rose/20 border-telemetry-rose text-telemetry-rose'
          : 'bg-charcoal-800 border-charcoal-700 text-telemetry-teal'
      }`}>
        {event.notification_associated ? (
          <Bell className="w-3.5 h-3.5" />
        ) : event.is_long_session ? (
          <Clock className="w-3.5 h-3.5" />
        ) : (
          <Clock className="w-3.5 h-3.5" />
        )}
      </div>

      {/* Event content box */}
      <div className="flex-1 bg-charcoal-900 border border-charcoal-800 rounded-lg p-3.5 hover:border-charcoal-700 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-charcoal-100">{event.app_name}</span>
            <span className="text-[10px] font-mono text-charcoal-400">
              {timeStr} <span className="text-charcoal-600">({dateStr})</span>
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            {event.duration_minutes && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-charcoal-800 text-charcoal-200 border border-charcoal-700">
                {Math.round(event.duration_minutes)}m
              </span>
            )}
            {event.is_long_session && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-telemetry-rose/15 text-telemetry-rose border border-telemetry-rose/30">
                30+ min
              </span>
            )}
            {event.notification_associated && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-telemetry-amber/15 text-telemetry-amber border border-telemetry-amber/30">
                Followed Alert
              </span>
            )}
            {event.reflection_label && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-telemetry-teal/15 text-telemetry-teal border border-telemetry-teal/30">
                {event.reflection_label}
              </span>
            )}
          </div>
        </div>

        {/* Preceding notification preview */}
        {event.notification_title && (
          <div className="text-[11px] text-charcoal-400 mb-2 flex items-center space-x-1.5 bg-charcoal-950/60 p-2 rounded border border-charcoal-850">
            <Bell className="w-3 h-3 text-telemetry-amber flex-shrink-0" />
            <span className="italic">"{event.notification_title}"</span>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-charcoal-400 pt-1">
          <span>{event.details}</span>

          {!event.reflection_label && onReflect && (
            <button
              onClick={() => onReflect(event.id)}
              className="flex items-center space-x-1 text-telemetry-teal hover:underline text-[11px]"
            >
              <MessageSquareQuote className="w-3 h-3" />
              <span>Label Intentionality</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
