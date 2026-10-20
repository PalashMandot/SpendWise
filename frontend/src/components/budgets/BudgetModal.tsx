import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Category, BudgetStatus } from '../../types';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { category_id?: number | null; month: string; amount: number; alert_threshold: number }) => Promise<void>;
  categories: Category[];
  currentMonth: string;
  initialData?: BudgetStatus | null;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
  currentMonth,
  initialData,
}) => {
  const [categoryId, setCategoryId] = useState<string>('');
  const [month, setMonth] = useState<string>(currentMonth);
  const [amount, setAmount] = useState<string>('');
  const [alertThreshold, setAlertThreshold] = useState<number>(0.8);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setCategoryId(initialData.category_id ? initialData.category_id.toString() : '');
      setMonth(initialData.month);
      setAmount(initialData.amount.toString());
      setAlertThreshold(initialData.alert_threshold);
    } else {
      setCategoryId('');
      setMonth(currentMonth);
      setAmount('');
      setAlertThreshold(0.8);
    }
    setError('');
  }, [initialData, currentMonth, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please provide a valid positive budget amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        category_id: categoryId ? Number(categoryId) : null,
        month,
        amount: parsedAmount,
        alert_threshold: alertThreshold,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to save budget.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense' || c.type === 'both');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Budget' : 'Create Monthly Budget'}
      description="Configure spending limits and overspending warning thresholds."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Category Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Budget Scope / Category *
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={!!initialData}
            className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-60 cursor-pointer"
          >
            <option value="">Overall Monthly Budget (All Expenses)</option>
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                Category: {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Target Month & Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Month *
            </label>
            <input
              type="month"
              required
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              disabled={!!initialData}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-60 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Monthly Cap ($) *
            </label>
            <input
              type="number"
              step="1"
              min="1"
              required
              placeholder="e.g. 500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Threshold Slider */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs font-medium mb-1.5">
            <span className="text-slate-300">Overspending Warning Threshold</span>
            <span className="text-emerald-400 font-mono font-bold">
              {(alertThreshold * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.0"
            step="0.05"
            value={alertThreshold}
            onChange={(e) => setAlertThreshold(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            SpendWise will flag warning alerts when your spending crosses {(alertThreshold * 100).toFixed(0)}% of this budget.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {initialData ? 'Update Budget' : 'Save Budget'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
