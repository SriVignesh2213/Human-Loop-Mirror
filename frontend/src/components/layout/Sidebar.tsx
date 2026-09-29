import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  Repeat,
  Sparkles,
  MessageSquareQuote,
  Shuffle,
  Target,
  TrendingUp,
  Settings,
  LogOut,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const navigationItems = [
  { name: 'Overview', to: '/overview', icon: LayoutDashboard },
  { name: 'Digital Day', to: '/digital-day', icon: Clock },
  { name: 'Habit Loops', to: '/habit-loops', icon: Repeat },
  { name: 'AI Insights', to: '/ai-insights', icon: Sparkles },
  { name: 'Reflection', to: '/reflection', icon: MessageSquareQuote },
  { name: 'Personal Swap', to: '/personal-swap', icon: Shuffle },
  { name: 'Goals', to: '/goals', icon: Target },
  { name: 'Progress', to: '/progress', icon: TrendingUp },
  { name: 'Settings', to: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-charcoal-900 border-r border-charcoal-800 h-screen sticky top-0 flex-shrink-0 select-none">
      {/* Brand logo & tagline */}
      <div className="p-5 border-b border-charcoal-800">
        <NavLink to="/overview" className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded bg-charcoal-800 border border-telemetry-teal/40 flex items-center justify-center text-telemetry-teal shadow-subtle">
            <Layers className="w-4 h-4 text-telemetry-teal" />
          </div>
          <div>
            <span className="font-semibold text-sm tracking-tight text-charcoal-100 block">
              Habit Loop Mirror
            </span>
            <span className="text-[10px] font-mono text-charcoal-400 block tracking-wider uppercase">
              Awareness Engine
            </span>
          </div>
        </NavLink>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-mono uppercase text-charcoal-500 px-3 py-1 font-semibold tracking-wider">
          Telemetry & Insights
        </div>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-telemetry-teal/10 text-telemetry-teal border-l-2 border-telemetry-teal font-semibold'
                    : 'text-charcoal-400 hover:text-charcoal-100 hover:bg-charcoal-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / User sign out */}
      <div className="p-3 border-t border-charcoal-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-2 px-3 py-2 rounded text-xs font-medium text-charcoal-400 hover:text-telemetry-rose hover:bg-charcoal-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
