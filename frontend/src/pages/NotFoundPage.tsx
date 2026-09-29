import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-charcoal-950 text-charcoal-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-charcoal-800 border border-charcoal-700 flex items-center justify-center text-telemetry-teal mb-4">
        <Layers className="w-6 h-6" />
      </div>

      <span className="text-xs font-mono uppercase text-telemetry-teal mb-1">404 ERROR</span>
      <h1 className="text-2xl font-bold text-charcoal-100 mb-2">Endpoint or View Not Found</h1>
      <p className="text-xs text-charcoal-400 max-w-sm mb-6 leading-relaxed">
        The route you are looking for does not exist in the Habit Loop Mirror telemetry interface.
      </p>

      <Link
        to="/overview"
        className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold bg-telemetry-teal text-charcoal-950 hover:bg-telemetry-teal-bright transition-colors shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};
