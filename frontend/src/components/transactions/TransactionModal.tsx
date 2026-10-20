import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Category, Transaction } from '../../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Transaction>) => Promise<void>;
  categories: Category[];
  initialData?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
  initialData,
}) => {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('credit_card');
  const [notes, setNotes] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(initialData.amount.toString());
      setDescription(initialData.description);
      setCategoryId(initialData.category_id);
      setDate(initialData.date);
      setPaymentMethod(initialData.payment_method);
      setNotes(initialData.notes || '');
      setIsRecurring(initialData.is_recurring);
    } else {
      setType('expense');
      setAmount('');
      setDescription('');
      // Default to first matching category
      const firstCat = categories.find((c) => c.type === 'expense' || c.type === 'both');
      setCategoryId(firstCat ? firstCat.id : (categories[0]?.id || ''));
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('credit_card');
      setNotes('');
      setIsRecurring(false);
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
        type,
        amount: parsedAmount,
        description: description.trim(),
        category_id: Number(categoryId),
        date,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
        is_recurring: isRecurring,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to save transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter categories by type
  const availableCategories = categories.filter(
    (c) => c.type === type || c.type === 'both'
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Transaction' : 'Record Transaction'}
      description="Add or modify your personal financial income or expense entry."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Type Toggle: Expense / Income */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              type === 'expense'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              type === 'income'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Income
          </button>
        </div>

        {/* Amount & Date */}
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
              Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Description / Merchant *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Whole Foods Groceries, Tech Corp Salary"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
          />
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
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Optional Notes
          </label>
          <textarea
            rows={2}
            placeholder="Add tags, receipts, or context..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 resize-none"
          />
        </div>

        {/* Recurring Flag */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="recurring_check"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
          />
          <label htmlFor="recurring_check" className="text-xs text-slate-300 cursor-pointer">
            Mark this as a recurring transaction
          </label>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {initialData ? 'Update Transaction' : 'Save Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
