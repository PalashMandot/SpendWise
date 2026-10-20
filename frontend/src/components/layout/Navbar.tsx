import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { seedApi } from '../../services/api';
import {
  Sparkles,
  LogOut,
  User as UserIcon,
  Menu,
  Calendar,
  Wallet
} from 'lucide-react';
import { Button } from '../common/Button';

interface NavbarProps {
  onMenuToggle: () => void;
  selectedMonth: string;
  onMonthChange: (m: string) => void;
  onDataRefresh?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onMenuToggle,
  selectedMonth,
  onMonthChange,
  onDataRefresh,
}) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  // Generate current and past 5 months for quick selection
  const monthOptions = React.useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const date = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      options.push({ value: val, label });
    }
    return options;
  }, []);

  const handleSeedDemoData = async () => {
    try {
      setIsSeeding(true);
      const res = await seedApi.seedDemoData();
      showToast(res.message || 'Demo transactions and budgets successfully seeded!', 'success');
      if (onDataRefresh) {
        onDataRefresh();
      }
    } catch {
      showToast('Failed to seed demo data. Please try again.', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger & title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-glow-brand">
            <Wallet className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg tracking-tight hidden sm:inline-block">
            Spend<span className="text-emerald-400">Wise</span>
          </span>
        </div>
      </div>

      {/* Middle: Month filter selector */}
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
        <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
        <select
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="bg-transparent text-xs sm:text-sm font-medium text-slate-200 focus:outline-none cursor-pointer"
        >
          {monthOptions.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Right: Quick Demo Seed & Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="outline"
          size="sm"
          isLoading={isSeeding}
          onClick={handleSeedDemoData}
          leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
          className="text-xs hidden md:inline-flex border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/10 text-amber-200"
          title="Instantly generate 3 months of realistic transactions and budgets"
        >
          Seed Demo Data
        </Button>

        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-semibold text-xs shadow-inner">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-white truncate max-w-[120px]">{user?.full_name}</p>
            <p className="text-[10px] text-slate-400">{user?.currency || 'USD'}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
