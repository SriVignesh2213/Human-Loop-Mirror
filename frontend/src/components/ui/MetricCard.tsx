import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  badge?: {
    text: string;
    variant?: 'teal' | 'amber' | 'rose' | 'slate';
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  badge,
}) => {
  const badgeClasses = {
    teal: 'bg-telemetry-teal/15 text-telemetry-teal border-telemetry-teal/30',
    amber: 'bg-telemetry-amber/15 text-telemetry-amber border-telemetry-amber/30',
    rose: 'bg-telemetry-rose/15 text-telemetry-rose border-telemetry-rose/30',
    slate: 'bg-charcoal-800 text-charcoal-400 border-charcoal-700',
  }[badge?.variant || 'slate'];

  return (
    <div className="bg-charcoal-900 border border-charcoal-800 rounded-lg p-4 transition-all hover:border-charcoal-700">
      <div className="flex items-center justify-between text-charcoal-400 mb-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-charcoal-400">
          {label}
        </span>
        {Icon && <Icon className="w-4 h-4 text-charcoal-500" />}
      </div>

      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-mono font-semibold text-charcoal-100 tracking-tight">
          {value}
        </span>
        {badge && (
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${badgeClasses}`}>
            {badge.text}
          </span>
        )}
      </div>

      {subtext && (
        <p className="text-[11px] text-charcoal-400 mt-1 leading-snug">
          {subtext}
        </p>
      )}
    </div>
  );
};
