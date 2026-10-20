import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  Sparkles,
  Repeat,
  Tags,
  FileSpreadsheet,
  Settings as SettingsIcon,
  X,
  Wallet
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/transactions', label: 'Transactions', icon: Receipt },
    { to: '/budgets', label: 'Budgets & Alerts', icon: PiggyBank },
    { to: '/insights', label: 'AI & Smart Insights', icon: Sparkles },
    { to: '/recurring', label: 'Recurring Bills', icon: Repeat },
    { to: '/categories', label: 'Categories', icon: Tags },
    { to: '/import-export', label: 'Import & Export', icon: FileSpreadsheet },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900/95 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-glow-brand">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white">
                Spend<span className="text-emerald-400">Wise</span>
              </span>
              <span className="block text-[10px] uppercase tracking-wider font-semibold text-emerald-400/80 -mt-0.5">
                Smart Tracker
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info pill */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span>Data Protection</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Strict per-user encryption & isolated records
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
