import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, ChevronRight, Receipt } from 'lucide-react';
import { Transaction } from '../../types';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions }) => {
  return (
    <div className="glass-card p-5 sm:p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-base font-semibold text-white tracking-tight">Recent Activity</h4>
          <p className="text-xs text-slate-400">Latest recorded transactions</p>
        </div>
        <Link
          to="/transactions"
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="py-10 text-center flex flex-col items-center justify-center">
          <Receipt className="w-8 h-8 text-slate-600 mb-2" />
          <p className="text-xs text-slate-400">No activity yet. Click Seed Demo Data or Add Transaction.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/80">
          {transactions.map((t) => {
            const isIncome = t.type === 'income';
            return (
              <div key={t.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isIncome
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    }`}
                  >
                    {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{t.description}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <span>{t.date}</span>
                      <span>•</span>
                      <span className="truncate">{t.category?.name || 'Other'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-xs sm:text-sm font-bold font-mono ${
                      isIncome ? 'text-emerald-400' : 'text-slate-100'
                    }`}
                  >
                    {isIncome ? '+' : '-'}${t.amount.toFixed(2)}
                  </span>
                  <span className="block text-[10px] text-slate-500 capitalize">
                    {t.payment_method.replace('_', ' ')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
