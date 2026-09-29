import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-charcoal-900/60 border border-charcoal-800/80 rounded-lg">
      <div className="w-12 h-12 rounded-full bg-charcoal-800 border border-charcoal-700/60 flex items-center justify-center text-charcoal-400 mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-charcoal-200 mb-1">{title}</h3>
      <p className="text-xs text-charcoal-400 max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded text-xs font-semibold bg-telemetry-teal text-charcoal-950 hover:bg-telemetry-teal-bright transition-colors shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
