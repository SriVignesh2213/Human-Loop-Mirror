import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
}) => {
  return (
    <div className="p-6 bg-charcoal-900 border border-telemetry-rose/30 rounded-lg text-center flex flex-col items-center">
      <div className="w-10 h-10 rounded-full bg-telemetry-rose/10 flex items-center justify-center text-telemetry-rose mb-3">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-semibold text-charcoal-200 mb-1">{title}</h4>
      <p className="text-xs text-charcoal-400 max-w-md mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};
