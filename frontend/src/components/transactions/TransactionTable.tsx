import React from 'react';
import { Edit2, Trash2, Repeat, ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Transaction } from '../../types';
import { EmptyState } from '../common/EmptyState';
import { Receipt } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  onPageChange: (p: number) => void;
  onEdit: (t: Transaction) => void;
  onDelete: (id: number) => void;
  onAddNew: () => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  total,
  page,
  totalPages,
  isLoading,
  onPageChange,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  if (isLoading) {
    return (
      <div className="glass-card p-6 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center justify-between py-3 border-b border-slate-800/60 last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800" />
              <div className="space-y-1.5">
                <div className="w-36 h-3.5 bg-slate-800 rounded" />
                <div className="w-20 h-2.5 bg-slate-800/60 rounded" />
              </div>
            </div>
            <div className="w-24 h-4 bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<Receipt className="w-8 h-8" />}
        title="No transactions found"
        description="Try adjusting your filter options or add a new transaction to record your income and expenses."
        actionText="Add Transaction"
        onAction={onAddNew}
      />
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Desktop Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="py-3.5 px-4 sm:px-6">Description</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Method</th>
              <th className="py-3.5 px-4 text-right">Amount</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
            {transactions.map((t) => {
              const isIncome = t.type === 'income';
              const catColor = t.category?.color || '#64748B';

              return (
                <tr
                  key={t.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Description & Icon */}
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                          isIncome
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}
                      >
                        {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white truncate max-w-[220px]">
                            {t.description}
                          </span>
                          {t.is_recurring && (
                            <span title="Recurring Rule Transaction">
                              <Repeat className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            </span>
                          )}
                        </div>
                        {t.notes && (
                          <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                            {t.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                      style={{
                        backgroundColor: `${catColor}15`,
                        borderColor: `${catColor}40`,
                        color: catColor,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                      {t.category?.name || 'Other'}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-4 text-slate-300 text-xs">
                    {t.date}
                  </td>

                  {/* Payment Method */}
                  <td className="py-3.5 px-4 text-slate-400 text-xs capitalize">
                    {t.payment_method.replace('_', ' ')}
                  </td>

                  {/* Amount */}
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`font-mono font-bold text-sm ${
                        isIncome ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {isIncome ? '+' : '-'}${t.amount.toFixed(2)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 sm:px-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(t)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Edit Transaction"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(t.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 sm:px-6 py-3.5 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing <span className="font-semibold text-slate-200">{transactions.length}</span> of{' '}
          <span className="font-semibold text-slate-200">{total}</span> transactions
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-medium text-slate-300 px-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
