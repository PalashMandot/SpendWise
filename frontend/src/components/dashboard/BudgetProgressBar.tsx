import React from 'react';
import { BudgetStatus } from '../../types';
import { Badge } from '../common/Badge';

interface BudgetProgressBarProps {
  budget: BudgetStatus;
}

export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({ budget }) => {
  const isOver = budget.status === 'exceeded';
  const isWarn = budget.status === 'warning';

  const catName = budget.category?.name || 'Overall Monthly Budget';
  const color = budget.category?.color || '#10B981';

  // Cap visual bar at 100%
  const barWidth = Math.min(budget.percentage, 100);

  return (
    <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-xs font-semibold text-white tracking-tight">{catName}</span>
        </div>
        <div>
          {isOver ? (
            <Badge variant="rose" size="sm" dot>Exceeded</Badge>
          ) : isWarn ? (
            <Badge variant="amber" size="sm" dot>Warning</Badge>
          ) : (
            <Badge variant="emerald" size="sm">On Track</Badge>
          )}
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isOver ? 'bg-rose-500' : isWarn ? 'bg-amber-400' : 'bg-emerald-500'
          }`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] mt-2 font-medium">
        <span className="text-slate-400">
          <span className="text-slate-200 font-semibold">${budget.spent.toFixed(2)}</span> of ${budget.amount.toFixed(2)}
        </span>
        <span className={isOver ? 'text-rose-400 font-semibold' : 'text-slate-400'}>
          {isOver ? `Over by $${Math.abs(budget.remaining).toFixed(2)}` : `$${budget.remaining.toFixed(2)} remaining`}
        </span>
      </div>
    </div>
  );
};
