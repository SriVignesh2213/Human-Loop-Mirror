import React, { useEffect, useState } from 'react';
import { usageService } from '../../services/usageService';
import { Layers, Smartphone, Clock, Bell, Sparkles } from 'lucide-react';

interface AppTrackItem {
  app_name: string;
  category: string;
  total_minutes: number;
  session_count: number;
  notification_count: number;
  percentage: number;
}

interface CategoryTrackItem {
  category: string;
  total_minutes: number;
  session_count: number;
  apps: string[];
  percentage: number;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  Development: { bg: 'bg-telemetry-indigo/10', text: 'text-telemetry-indigo', bar: 'bg-telemetry-indigo' },
  Social: { bg: 'bg-telemetry-amber/10', text: 'text-telemetry-amber', bar: 'bg-telemetry-amber' },
  Productivity: { bg: 'bg-telemetry-teal/10', text: 'text-telemetry-teal', bar: 'bg-telemetry-teal' },
  Entertainment: { bg: 'bg-telemetry-rose/10', text: 'text-telemetry-rose', bar: 'bg-telemetry-rose' },
  Reading: { bg: 'bg-telemetry-emerald/10', text: 'text-telemetry-emerald', bar: 'bg-telemetry-emerald' },
  General: { bg: 'bg-charcoal-800', text: 'text-charcoal-300', bar: 'bg-charcoal-600' }
};

export const AppTrackingCard: React.FC = () => {
  const [apps, setApps] = useState<AppTrackItem[]>([]);
  const [categories, setCategories] = useState<CategoryTrackItem[]>([]);
  const [totalMinutes, setTotalMinutes] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'apps' | 'categories'>('apps');

  const fetchTracking = async () => {
    try {
      setLoading(true);
      const res = await usageService.getAppTracking();
      setApps(res.apps);
      setCategories(res.categories);
      setTotalMinutes(res.total_screen_time_minutes);
    } catch (e) {
      console.error('Failed to load application tracking:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
  }, []);

  const formatHoursMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  if (loading) {
    return (
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-lg p-5 animate-pulse">
        <div className="h-4 bg-charcoal-800 rounded w-48 mb-4"></div>
        <div className="space-y-3">
          <div className="h-10 bg-charcoal-800 rounded"></div>
          <div className="h-10 bg-charcoal-800 rounded"></div>
          <div className="h-10 bg-charcoal-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (apps.length === 0) {
    return null;
  }

  return (
    <div className="bg-charcoal-900 border border-charcoal-800 rounded-lg p-5 space-y-4">
      {/* Card Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-charcoal-800">
        <div>
          <div className="flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-telemetry-teal" />
            <h3 className="text-sm font-semibold text-charcoal-100">Application & Category Tracking</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-charcoal-800 text-charcoal-400 border border-charcoal-700">
              {formatHoursMins(totalMinutes)} Total Tracked
            </span>
          </div>
          <p className="text-xs text-charcoal-400 mt-1">
            Track screen time by application and categorize usage across productive and reactive contexts.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-charcoal-950 p-0.5 rounded-lg border border-charcoal-800 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('apps')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'apps'
                ? 'bg-charcoal-800 text-charcoal-100 shadow-sm'
                : 'text-charcoal-400 hover:text-charcoal-200'
            }`}
          >
            By App ({apps.length})
          </button>
          <button
            onClick={() => setViewMode('categories')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'categories'
                ? 'bg-charcoal-800 text-charcoal-100 shadow-sm'
                : 'text-charcoal-400 hover:text-charcoal-200'
            }`}
          >
            By Category ({categories.length})
          </button>
        </div>
      </div>

      {/* Aggregate Category Visual Distribution Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px] text-charcoal-400 font-mono">
          <span>Categorized Distribution</span>
          <span>100% telemetry</span>
        </div>
        <div className="h-2 w-full bg-charcoal-950 rounded-full flex overflow-hidden">
          {categories.map((c) => {
            const color = CATEGORY_COLORS[c.category] || CATEGORY_COLORS.General;
            return (
              <div
                key={c.category}
                style={{ width: `${Math.max(c.percentage, 3)}%` }}
                className={`${color.bar} h-full transition-all`}
                title={`${c.category}: ${c.percentage}% (${formatHoursMins(c.total_minutes)})`}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-mono text-charcoal-400">
          {categories.map((c) => {
            const color = CATEGORY_COLORS[c.category] || CATEGORY_COLORS.General;
            return (
              <span key={c.category} className="flex items-center space-x-1">
                <span className={`w-1.5 h-1.5 rounded-full ${color.bar}`}></span>
                <span>{c.category} ({c.percentage}%)</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* List Body */}
      {viewMode === 'apps' ? (
        <div className="space-y-2 pt-2">
          {apps.map((a) => {
            const color = CATEGORY_COLORS[a.category] || CATEGORY_COLORS.General;
            return (
              <div
                key={a.app_name}
                className="p-3 bg-charcoal-950/60 border border-charcoal-800/80 rounded-lg hover:border-charcoal-700 transition-colors"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-charcoal-200">{a.app_name}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${color.bg} ${color.text}`}>
                      {a.category}
                    </span>
                    {a.notification_count > 0 && (
                      <span className="flex items-center space-x-0.5 text-[10px] font-mono text-telemetry-amber bg-telemetry-amber/10 px-1.5 py-0.5 rounded">
                        <Bell className="w-2.5 h-2.5" />
                        <span>{a.notification_count} alert-triggered</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 text-right">
                    <span className="text-[11px] text-charcoal-400 font-mono">{a.session_count} sessions</span>
                    <span className="font-mono font-semibold text-charcoal-100">{formatHoursMins(a.total_minutes)}</span>
                    <span className="text-[11px] text-telemetry-teal font-mono w-10 text-right">{a.percentage}%</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-charcoal-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`${color.bar} h-full rounded-full transition-all`}
                    style={{ width: `${a.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {categories.map((c) => {
            const color = CATEGORY_COLORS[c.category] || CATEGORY_COLORS.General;
            return (
              <div
                key={c.category}
                className="p-3.5 bg-charcoal-950/60 border border-charcoal-800/80 rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${color.bg} ${color.text}`}>
                    {c.category}
                  </span>
                  <span className="text-xs font-mono font-semibold text-charcoal-100">
                    {formatHoursMins(c.total_minutes)} ({c.percentage}%)
                  </span>
                </div>
                <div className="text-[11px] text-charcoal-400">
                  <span className="font-mono">{c.session_count} total sessions</span>
                  <span className="mx-1.5">•</span>
                  <span>Apps: {c.apps.join(', ')}</span>
                </div>
                <div className="w-full bg-charcoal-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`${color.bar} h-full rounded-full transition-all`}
                    style={{ width: `${c.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
