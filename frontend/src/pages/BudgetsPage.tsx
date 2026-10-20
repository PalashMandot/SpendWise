import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { PlusCircle, PiggyBank, AlertTriangle } from 'lucide-react';
import { DashboardContextType } from '../components/layout/DashboardLayout';
import { budgetsApi, categoriesApi } from '../services/api';
import { BudgetStatus, Category } from '../types';
import { BudgetCard } from '../components/budgets/BudgetCard';
import { BudgetModal } from '../components/budgets/BudgetModal';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';

export const BudgetsPage: React.FC = () => {
  const { selectedMonth, refreshTrigger, triggerRefresh } = useOutletContext<DashboardContextType>();
  const { showToast } = useToast();

  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetStatus | null>(null);

  const fetchBudgets = useCallback(async () => {
    try {
      setIsLoading(true);
      const [bList, cats] = await Promise.all([
        budgetsApi.list(selectedMonth),
        categoriesApi.list(),
      ]);
      setBudgets(bList);
      setCategories(cats);
    } catch {
      showToast('Could not fetch monthly budgets.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, showToast]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets, refreshTrigger]);

  const handleSaveBudget = async (data: { category_id?: number | null; month: string; amount: number; alert_threshold: number }) => {
    if (editingBudget) {
      await budgetsApi.update(editingBudget.id, {
        amount: data.amount,
        alert_threshold: data.alert_threshold,
      });
      showToast('Budget updated successfully!', 'success');
    } else {
      await budgetsApi.createOrUpdate(data);
      showToast('Budget created successfully!', 'success');
    }
    triggerRefresh();
  };

  const handleDeleteBudget = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this budget rule?')) return;
    try {
      await budgetsApi.delete(id);
      showToast('Budget removed successfully.', 'success');
      triggerRefresh();
    } catch {
      showToast('Failed to delete budget.', 'error');
    }
  };

  const exceededCount = budgets.filter((b) => b.status === 'exceeded').length;
  const warningCount = budgets.filter((b) => b.status === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Budgets & Threshold Controls
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Set proactive expense guardrails and receive warnings before overspending in{' '}
            <span className="text-emerald-400 font-semibold">{selectedMonth}</span>
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setEditingBudget(null);
            setIsModalOpen(true);
          }}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Set New Budget
        </Button>
      </div>

      {/* Alert Header if warnings exist */}
      {(exceededCount > 0 || warningCount > 0) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs sm:text-sm text-amber-200">
            {exceededCount > 0 && (
              <span className="font-bold text-rose-300 mr-2">
                {exceededCount} budget{exceededCount > 1 ? 's' : ''} exceeded!
              </span>
            )}
            {warningCount > 0 && (
              <span>
                {warningCount} budget{warningCount > 1 ? 's' : ''} nearing configured thresholds.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Grid of Budgets */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card h-44 rounded-2xl bg-slate-900/60" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={<PiggyBank className="w-8 h-8" />}
          title="No budgets set for this month"
          description="Create custom budgets for high-frequency categories like Groceries or Dining Out to prevent overspending."
          actionText="Set First Budget"
          onAction={() => {
            setEditingBudget(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              onEdit={(budget) => {
                setEditingBudget(budget);
                setIsModalOpen(true);
              }}
              onDelete={handleDeleteBudget}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveBudget}
        categories={categories}
        currentMonth={selectedMonth}
        initialData={editingBudget}
      />
    </div>
  );
};
