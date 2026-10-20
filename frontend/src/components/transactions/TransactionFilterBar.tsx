import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Category, TransactionFilterParams } from '../../types';

interface TransactionFilterBarProps {
  filters: TransactionFilterParams;
  categories: Category[];
  onChange: (updated: Partial<TransactionFilterParams>) => void;
  onReset: () => void;
}

export const TransactionFilterBar: React.FC<TransactionFilterBarProps> = ({
  filters,
  categories,
  onChange,
  onReset,
}) => {
  return (
    <div className="glass-card p-4 space-y-3">
      {/* Top row: Search and Type Pills */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search descriptions, merchants, or notes..."
            value={filters.search || ''}
            onChange={(e) => onChange({ search: e.target.value, page: 1 })}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 border border-slate-800 rounded-xl self-start sm:self-auto shrink-0">
          <button
            onClick={() => onChange({ type: undefined, page: 1 })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              !filters.type ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onChange({ type: 'expense', page: 1 })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filters.type === 'expense' ? 'bg-rose-500/20 text-rose-300 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => onChange({ type: 'income', page: 1 })}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filters.type === 'income' ? 'bg-emerald-500/20 text-emerald-300 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Income
          </button>
        </div>
      </div>

      {/* Bottom row: Category, Date Range, Sort, Reset */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-1">
        {/* Category Dropdown */}
        <select
          value={filters.category_id || ''}
          onChange={(e) => onChange({ category_id: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
          className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id} className="bg-slate-900 text-white">
              {c.name}
            </option>
          ))}
        </select>

        {/* Start Date */}
        <input
          type="date"
          value={filters.start_date || ''}
          onChange={(e) => onChange({ start_date: e.target.value || undefined, page: 1 })}
          className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
          title="From date"
        />

        {/* End Date */}
        <input
          type="date"
          value={filters.end_date || ''}
          onChange={(e) => onChange({ end_date: e.target.value || undefined, page: 1 })}
          className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
          title="To date"
        />

        {/* Sort By */}
        <select
          value={`${filters.sort_by || 'date'}-${filters.sort_order || 'desc'}`}
          onChange={(e) => {
            const [by, order] = e.target.value.split('-');
            onChange({ sort_by: by as any, sort_order: order as any, page: 1 });
          }}
          className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="amount-desc">Highest Amount</option>
          <option value="amount-asc">Lowest Amount</option>
        </select>

        {/* Reset button */}
        <button
          onClick={onReset}
          className="col-span-2 sm:col-span-4 lg:col-span-1 px-3 py-2 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>
    </div>
  );
};
