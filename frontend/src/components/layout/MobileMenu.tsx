import React from 'react';
import { NavLink } from 'react-router-dom';
import { X, Layers, LogOut } from 'lucide-react';
import { navigationItems } from './Sidebar';
import { useAuth } from '../../context/AuthContext';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const { logout, profile } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative flex-1 flex flex-col max-w-xs w-full bg-charcoal-900 border-r border-charcoal-800 z-50">
        <div className="p-4 border-b border-charcoal-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded bg-charcoal-800 border border-telemetry-teal/40 flex items-center justify-center text-telemetry-teal">
              <Layers className="w-4 h-4 text-telemetry-teal" />
            </div>
            <span className="font-semibold text-sm text-charcoal-100">Habit Loop Mirror</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-charcoal-400 hover:text-charcoal-100 hover:bg-charcoal-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-telemetry-teal/15 text-telemetry-teal font-semibold border-l-2 border-telemetry-teal'
                      : 'text-charcoal-400 hover:text-charcoal-100 hover:bg-charcoal-800'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-charcoal-800">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded text-xs font-medium text-charcoal-400 hover:text-telemetry-rose hover:bg-charcoal-800"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
