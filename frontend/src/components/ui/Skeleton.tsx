import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return (
    <div className={`animate-pulse bg-charcoal-800 rounded ${className}`} />
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 bg-charcoal-900 border border-charcoal-800 rounded-lg space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-2 w-28" />
          </div>
        ))}
      </div>
      <div className="p-5 bg-charcoal-900 border border-charcoal-800 rounded-lg space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-charcoal-900 border border-charcoal-800 rounded-lg space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="p-5 bg-charcoal-900 border border-charcoal-800 rounded-lg space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
};
