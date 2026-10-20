import React from 'react';
import { Edit2, Trash2, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BudgetStatus } from '../../types';
import { Badge } from '../common/Badge';

interface BudgetCardProps {
  budget: BudgetStatus;
  onEdit: (b: BudgetStatus) => void;
  onDelete: (id: number) => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({ budget, onEdit, onDelete }) => {
  const isOver = budget.status === 'exceeded';
  const isWarn = budget.status === 'warning';
  const catName = budget.category?.name || 'Overall Monthly Budget';
  const catColor = budget.category?.color || '#10B981';

  const barWidth = Math.min(budget.percentage, 100);

  return (
    <div
      className={`glass-card p-5 transition-all duration-300 flex flex-col justify-between ${
        isOver
          ? 'border-rose-500/40 hover:border-rose-500/60 shadow-glow-rose'
          : isWarn
          ? 'border-amber-500/40 hover:border-amber-500/60'
          : 'hover:border-slate-700/80'
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: catColor }}
            />
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">{catName}</h4>
              <p className="text-[11px] text-slate-400">
                Threshold: {(budget.alert_threshold * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isOver ? (
              <Badge variant="rose" size="sm" dot>Exceeded</Badge>
            ) : isWarn ? (
              <Badge variant="amber" size="sm" dot>Warning</Badge>
            ) : (
              <Badge variant="emerald" size="sm" dot>Healthy</Badge>
            )}
          </div>
        </div>

        {/* Amount breakdown */}
        <div className="flex items-baseline justify-between mt-3">
          <div>
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              ${budget.spent.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 ml-1.5">
              of ${budget.amount.toFixed(2)}
            </span>
          </div>
          <span
            className={`text-xs font-bold font-mono ${
              isOver ? 'text-rose-400' : isWarn ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {budget.percentage.toFixed(1)}%
          </span>
        </div>

        {/* Progress bar track */}
        <div className="w-full bg-slate-800 rounded-full h-2.5 mt-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOver ? 'bg-rose-500' : isWarn ? 'bg-amber-400' : 'bg-emerald-500'
            }`}
            style={{ width: `${barWidth}%` }}
          />
        </div>

        {/* Status helper text */}
        <div className="mt-3 text-xs flex items-center gap-1.5">
          {isOver ? (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="text-rose-300 font-medium">
                Over budget by ${Math.abs(budget.remaining).toFixed(2)}
              </span>
            </>
          ) : isWarn ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-amber-300 font-medium">
                Approaching cap (${budget.remaining.toFixed(2)} left)
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-400 font-medium">
                ${budget.remaining.toFixed(2)} remaining this month
              </span>
            </>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
        <button
          onClick={() => onEdit(budget)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Edit Budget Limit"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(budget.id)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Delete Budget"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
