import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Category, RecurringTransaction } from '../../types';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<RecurringTransaction>) => Promise<void>;
  categories: Category[];
  initialData?: RecurringTransaction | null;
}

export const RecurringModal: React.FC<RecurringModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
  initialData,
}) => {
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer');
  const [notes, setNotes] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description);
      setAmount(initialData.amount.toString());
      setType(initialData.type);
      setFrequency(initialData.frequency);
      setCategoryId(initialData.category_id);
      setStartDate(initialData.start_date);
      setEndDate(initialData.end_date || '');
      setPaymentMethod(initialData.payment_method);
      setNotes(initialData.notes || '');
      setIsActive(initialData.is_active);
    } else {
      setDescription('');
      setAmount('');
      setType('expense');
      setFrequency('monthly');
      const firstCat = categories.find((c) => c.type === 'expense' || c.type === 'both');
      setCategoryId(firstCat ? firstCat.id : (categories[0]?.id || ''));
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setPaymentMethod('bank_transfer');
      setNotes('');
      setIsActive(true);
    }
    setError('');
  }, [initialData, categories, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please provide a valid positive amount.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }
    if (!categoryId) {
      setError('Please select a category.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        description: description.trim(),
        amount: parsedAmount,
        type,
        frequency,
        category_id: Number(categoryId),
        start_date: startDate,
        end_date: endDate || null,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
        is_active: isActive,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to save recurring rule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableCategories = categories.filter((c) => c.type === type || c.type === 'both');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Recurring Schedule' : 'New Recurring Schedule'}
      description="Automate repetitive transactions such as monthly payroll, rent, or subscriptions."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
              type === 'expense'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Recurring Outflow / Bill
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
              type === 'income'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Recurring Inflow / Salary
          </button>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Description *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Monthly Apartment Lease, Spotify, Tech Corp Salary"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Amount & Frequency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Amount ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Recurrence Interval *
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        {/* Category & Payment Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              required
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="bank_transfer">Bank Transfer / ACH</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Start Date & Optional End Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Start / Next Due Date *
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {initialData ? 'Update Schedule' : 'Create Schedule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
