import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { PlusCircle, Repeat, Play, Edit2, Trash2, Calendar, CheckCircle2 } from 'lucide-react';
import { DashboardContextType } from '../components/layout/DashboardLayout';
import { recurringApi, categoriesApi } from '../services/api';
import { RecurringTransaction, Category } from '../types';
import { RecurringModal } from '../components/recurring/RecurringModal';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { Badge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';

export const RecurringPage: React.FC = () => {
  const { refreshTrigger, triggerRefresh } = useOutletContext<DashboardContextType>();
  const { showToast } = useToast();

  const [rules, setRules] = useState<RecurringTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurringTransaction | null>(null);

  const fetchRules = useCallback(async () => {
    try {
      setIsLoading(true);
      const [rList, cats] = await Promise.all([
        recurringApi.list(),
        categoriesApi.list(),
      ]);
      setRules(rList);
      setCategories(cats);
    } catch {
      showToast('Could not fetch recurring schedules.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules, refreshTrigger]);

  const handleSaveRule = async (data: Partial<RecurringTransaction>) => {
    if (editingRule) {
      await recurringApi.update(editingRule.id, data);
      showToast('Recurring schedule updated!', 'success');
    } else {
      await recurringApi.create(data);
      showToast('Recurring schedule created!', 'success');
    }
    triggerRefresh();
  };

  const handleDeleteRule = async (id: number) => {
    if (!window.confirm('Delete this recurring schedule?')) return;
    try {
      await recurringApi.delete(id);
      showToast('Recurring schedule deleted.', 'success');
      triggerRefresh();
    } catch {
      showToast('Failed to delete schedule.', 'error');
    }
  };

  const handleProcessDue = async () => {
    try {
      setIsProcessing(true);
      const res = await recurringApi.processDue();
      if (res.processed_count > 0) {
        showToast(
          `Processed ${res.processed_count} due recurring transaction${res.processed_count > 1 ? 's' : ''}!`,
          'success'
        );
      } else {
        showToast('No scheduled transactions are due today.', 'info');
      }
      triggerRefresh();
    } catch {
      showToast('Failed to process due transactions.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Recurring Bills & Schedules
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Automate rent, subscriptions, utilities, and routine payroll inflows
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={handleProcessDue}
            isLoading={isProcessing}
            leftIcon={<Play className="w-4 h-4 text-emerald-400" />}
            title="Scan and post any transactions that are due"
          >
            Process Due Now
          </Button>

          <Button
            variant="primary"
            onClick={() => {
              setEditingRule(null);
              setIsModalOpen(true);
            }}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            New Schedule
          </Button>
        </div>
      </div>

      {/* Grid of Recurring Rules */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card h-44 rounded-2xl bg-slate-900/60" />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <EmptyState
          icon={<Repeat className="w-8 h-8" />}
          title="No recurring schedules defined"
          description="Schedule automatic recurring transactions like monthly rent or subscriptions to never miss a due date."
          actionText="Create Schedule"
          onAction={() => {
            setEditingRule(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rules.map((rule) => {
            const isIncome = rule.type === 'income';
            const catColor = rule.category?.color || '#64748B';

            return (
              <div
                key={rule.id}
                className="glass-card p-5 transition-all duration-300 hover:border-slate-700/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isIncome
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}
                      >
                        <Repeat className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white tracking-tight">{rule.description}</h4>
                        <span className="text-[11px] text-slate-400 capitalize">
                          {rule.frequency} recurrence
                        </span>
                      </div>
                    </div>

                    <Badge variant={rule.is_active ? 'emerald' : 'slate'} size="sm" dot>
                      {rule.is_active ? 'Active' : 'Paused'}
                    </Badge>
                  </div>

                  {/* Amount & Category */}
                  <div className="flex items-baseline justify-between mt-3 pt-3 border-t border-slate-800/80">
                    <span
                      className={`text-xl font-bold font-mono ${
                        isIncome ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {isIncome ? '+' : '-'}${rule.amount.toFixed(2)}
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border"
                      style={{
                        backgroundColor: `${catColor}15`,
                        borderColor: `${catColor}40`,
                        color: catColor,
                      }}
                    >
                      {rule.category?.name || 'Category'}
                    </span>
                  </div>

                  {/* Next Due Date */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Next Due:</span>
                    <span className="text-white font-semibold">{rule.next_due_date}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditingRule(rule);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Edit Schedule"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete Schedule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <RecurringModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveRule}
        categories={categories}
        initialData={editingRule}
      />
    </div>
  );
};
