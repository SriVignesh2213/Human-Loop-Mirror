import React from 'react';

interface DailyTrendPoint {
  date: string;
  total_minutes: number;
  hours: number;
  sessions: number;
  notification_triggered: number;
}

interface TrendChartProps {
  data: DailyTrendPoint[];
  height?: number;
}

export const DailyTrendChart: React.FC<TrendChartProps> = ({ data, height = 180 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-charcoal-400 font-mono italic">
        No daily trend telemetry logged yet.
      </div>
    );
  }

  const maxMinutes = Math.max(...data.map((d) => d.total_minutes), 60);

  return (
    <div className="w-full">
      <div className="h-44 flex items-end gap-2 sm:gap-4 pt-6 pb-2 px-2 border-b border-charcoal-800">
        {data.map((d, idx) => {
          const heightPercent = Math.max(8, Math.round((d.total_minutes / maxMinutes) * 100));
          const dateLabel = d.date.split('-').slice(1).join('/');

          return (
            <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
              {/* Tooltip on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 pointer-events-none bg-charcoal-800 border border-charcoal-700 px-2 py-1 rounded text-[10px] font-mono text-charcoal-100 shadow-elevated whitespace-nowrap">
                <div>{d.date}: {Math.round(d.total_minutes)} mins ({d.hours}h)</div>
                <div className="text-telemetry-teal">{d.notification_triggered} notif-triggered</div>
              </div>

              {/* Bar */}
              <div
                className="w-full max-w-[36px] bg-charcoal-700 group-hover:bg-telemetry-teal transition-all rounded-t relative overflow-hidden"
                style={{ height: `${heightPercent}%` }}
              >
                {d.notification_triggered > 0 && (
                  <div
                    className="w-full bg-telemetry-amber/80 absolute bottom-0 left-0"
                    style={{
                      height: `${Math.min(100, Math.round((d.notification_triggered / Math.max(1, d.sessions)) * 100))}%`,
                    }}
                  />
                )}
              </div>
              <span className="text-[10px] font-mono text-charcoal-400 mt-2 truncate w-full text-center">
                {dateLabel}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-charcoal-400 pt-2 px-1">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded bg-charcoal-700 inline-block" />
            <span>Total Duration</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded bg-telemetry-amber inline-block" />
            <span>Followed Notification</span>
          </div>
        </div>
        <span>Max: {Math.round(maxMinutes)}m</span>
      </div>
    </div>
  );
};

export const AppDistributionChart: React.FC<{ distribution: Record<string, number> }> = ({ distribution }) => {
  const entries = Object.entries(distribution);
  if (entries.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-xs text-charcoal-400 font-mono italic">
        No application usage telemetry recorded.
      </div>
    );
  }

  const colors = [
    'bg-telemetry-teal',
    'bg-telemetry-indigo',
    'bg-telemetry-amber',
    'bg-telemetry-rose',
    'bg-telemetry-emerald',
    'bg-charcoal-600',
  ];

  return (
    <div className="space-y-3">
      {/* Progress bar stack */}
      <div className="h-3 w-full bg-charcoal-800 rounded-full flex overflow-hidden">
        {entries.map(([app, pct], idx) => (
          <div
            key={app}
            style={{ width: `${pct}%` }}
            className={`h-full ${colors[idx % colors.length]}`}
            title={`${app}: ${pct}%`}
          />
        ))}
      </div>

      {/* Legend list */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
        {entries.map(([app, pct], idx) => (
          <div key={app} className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${colors[idx % colors.length]}`} />
            <span className="text-charcoal-300 truncate">{app}</span>
            <span className="font-mono text-charcoal-400 text-[11px] ml-auto">{pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
