import React from 'react';
import { Search, Sun, Moon, Bell, HelpCircle } from 'lucide-react';
import { P25DisplaySpec } from '../types';

interface HeaderProps {
  selectedSpec?: P25DisplaySpec;
  onOpenSpecsModal?: () => void;
  isAnalyzing?: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  onToggleTheme,
}) => {
  return (
    <header id="hygh-top-bar" className="w-full flex items-center justify-between gap-4 py-3 px-4 sm:px-6 select-none transition-colors duration-200">
      {/* Search Bar - Pill styled as in HYGH platform */}
      <div className="flex-1 max-w-md">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            id="global-search-input"
            type="text"
            placeholder="Search campaigns, creatives, or display tags..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 rounded-full text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-xs border border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 transition-colors"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Functional Theme Toggle Pill (Sun / Moon) */}
        <div
          id="theme-toggle-container"
          className="bg-white dark:bg-slate-900 rounded-full p-1 shadow-xs border border-slate-100 dark:border-slate-800 flex items-center gap-1 text-slate-500 dark:text-slate-400 transition-colors"
        >
          <button
            id="theme-toggle-light-btn"
            type="button"
            onClick={() => {
              if (isDarkMode) onToggleTheme();
            }}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              !isDarkMode
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
            }`}
            title="Switch to Light Mode"
            aria-label="Light mode"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            id="theme-toggle-dark-btn"
            type="button"
            onClick={() => {
              if (!isDarkMode) onToggleTheme();
            }}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isDarkMode
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300'
            }`}
            title="Switch to Night / Dark Mode"
            aria-label="Dark mode"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Notification Bell Pill */}
        <button
          id="notification-bell-btn"
          type="button"
          className="relative w-9 h-9 rounded-full bg-white dark:bg-slate-900 shadow-xs border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full" />
        </button>

        {/* Profile Avatar Pill */}
        <div
          id="user-profile-avatar"
          className="w-9 h-9 rounded-full bg-white dark:bg-slate-900 shadow-xs border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          title="HYGH DOOH Operations"
        >
          <span className="font-mono text-[11px]">HY</span>
        </div>
      </div>
    </header>
  );
};
