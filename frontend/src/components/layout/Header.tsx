import React, { useState, useEffect } from 'react';
import { Menu, Wifi, WifiOff, UploadCloud, Bell, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  onOpenImportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu, onOpenImportModal }) => {
  const { profile, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="h-14 border-b border-charcoal-800 bg-charcoal-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 text-charcoal-400 hover:text-charcoal-100 hover:bg-charcoal-800 rounded transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-charcoal-400">
          <span className="inline-block w-2 h-2 rounded-full bg-telemetry-teal animate-pulse" />
          <span className="font-mono text-charcoal-300">TELEMETRY ONLINE</span>
          <span className="text-charcoal-600">/</span>
          <span className="italic text-charcoal-400">"Screen Time tells you how much. We tell you why."</span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Offline warning badge */}
        {!isOnline && (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-telemetry-amber/10 border border-telemetry-amber/30 text-telemetry-amber text-xs">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Offline</span>
          </div>
        )}

        {/* Import CSV Trigger */}
        <button
          onClick={onOpenImportModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium bg-telemetry-teal/10 hover:bg-telemetry-teal/20 text-telemetry-teal border border-telemetry-teal/30 transition-colors"
        >
          <UploadCloud className="w-4 h-4" />
          <span className="hidden md:inline">Import Usage CSV</span>
          <span className="md:hidden">Import</span>
        </button>

        {/* User profile dropdown button */}
        <div className="flex items-center space-x-2 pl-2 border-l border-charcoal-800">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center space-x-2 p-1 rounded hover:bg-charcoal-800 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded bg-charcoal-800 border border-charcoal-700 flex items-center justify-center text-telemetry-teal font-medium text-xs">
              {profile?.display_name ? profile.display_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-medium text-charcoal-200 leading-tight">
                {profile?.display_name || user?.email?.split('@')[0] || 'User'}
              </div>
              <div className="text-[10px] text-charcoal-400 font-mono leading-tight">
                {profile?.goal_lens || 'Active Mirror'}
              </div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
