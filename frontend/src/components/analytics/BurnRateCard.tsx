import React from 'react';
import { Flame, Gauge, TrendingDown, TrendingUp } from 'lucide-react';
import { BurnRateProjection } from '../../types';

interface BurnRateCardProps {
  projection: BurnRateProjection;
}

export const BurnRateCard: React.FC<BurnRateCardProps> = ({ projection }) => {
  const isSurplus = projection.projected_surplus_or_deficit >= 0;

  return (
    <div className="glass-card p-6 border-indigo-500/30 shadow-glow-indigo">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Burn Rate & Month-End Forecast</h3>
            <p className="text-xs text-slate-400">
              Day {projection.days_elapsed} of {projection.days_in_month} in current billing cycle
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            isSurplus
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
          }`}
        >
          {isSurplus ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {isSurplus ? 'Projected Surplus' : 'Projected Deficit'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">Average Daily Spend</span>
          <span className="text-lg sm:text-xl font-bold font-mono text-white">
            ${projection.average_daily_spend.toFixed(2)}
          </span>
          <span className="block text-[10px] text-slate-500 mt-0.5">per calendar day</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">Current Outflow</span>
          <span className="text-lg sm:text-xl font-bold font-mono text-slate-200">
            ${projection.current_spent.toFixed(2)}
          </span>
          <span className="block text-[10px] text-slate-500 mt-0.5">actual spent to date</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">Projected Total Spend</span>
          <span className="text-lg sm:text-xl font-bold font-mono text-amber-300">
            ${projection.projected_month_end_spend.toFixed(2)}
          </span>
          <span className="block text-[10px] text-slate-500 mt-0.5">at current pace</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">Projected Net Balance</span>
          <span
            className={`text-lg sm:text-xl font-bold font-mono ${
              isSurplus ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isSurplus ? '+' : '-'}${Math.abs(projection.projected_surplus_or_deficit).toFixed(2)}
          </span>
          <span className="block text-[10px] text-slate-500 mt-0.5">end of month buffer</span>
        </div>
      </div>
    </div>
  );
};
