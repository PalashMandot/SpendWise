import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Category } from '../../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; type: string; color: string; icon: string }) => Promise<void>;
  initialData?: Category | null;
}

const PRESET_COLORS = [
  '#10B981', '#059669', '#3B82F6', '#0284C7', '#8B5CF6',
  '#7C3AED', '#EC4899', '#F43F5E', '#EF4444', '#F59E0B',
  '#D97706', '#14B8A6', '#6366F1', '#64748B'
];

const PRESET_ICONS = [
  'tag', 'shopping-cart', 'shopping-bag', 'utensils', 'coffee',
  'home', 'zap', 'car', 'plane', 'tv', 'heart-pulse',
  'briefcase', 'laptop', 'trending-up', 'book', 'gift'
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<string>('expense');
  const [color, setColor] = useState<string>('#10B981');
  const [icon, setIcon] = useState<string>('tag');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setType(initialData.type);
      setColor(initialData.color);
      setIcon(initialData.icon);
    } else {
      setName('');
      setType('expense');
      setColor('#10B981');
      setIcon('tag');
    }
    setError('');
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Category name cannot be empty.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        name: name.trim(),
        type,
        color,
        icon,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to save category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Custom Category' : 'Create Custom Category'}
      description="Add customized categories to tag your unique expenditures or income streams."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Category Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Pet Care, Software Subscriptions, Gym"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Type toggle */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Category Type
          </label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            {['expense', 'income', 'both'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                  type === t
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Color Palette */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Badge Accent Color
          </label>
          <div className="flex flex-wrap gap-2.5 items-center">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform ${
                  color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Icon selector */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Icon Identifier
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_ICONS.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIcon(i)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors border ${
                  icon === i
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {initialData ? 'Update Category' : 'Save Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
