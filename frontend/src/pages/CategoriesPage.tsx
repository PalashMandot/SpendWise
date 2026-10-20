import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { PlusCircle, Tags, ShieldCheck, Edit2, Trash2 } from 'lucide-react';
import { DashboardContextType } from '../components/layout/DashboardLayout';
import { categoriesApi } from '../services/api';
import { Category } from '../types';
import { CategoryModal } from '../components/categories/CategoryModal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';

export const CategoriesPage: React.FC = () => {
  const { refreshTrigger, triggerRefresh } = useOutletContext<DashboardContextType>();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const cats = await categoriesApi.list();
      setCategories(cats);
    } catch {
      showToast('Failed to load categories.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories, refreshTrigger]);

  const handleSaveCategory = async (data: { name: string; type: string; color: string; icon: string }) => {
    const payload: Partial<Category> = {
      name: data.name,
      type: data.type as 'expense' | 'income' | 'both',
      color: data.color,
      icon: data.icon,
    };
    if (editingCategory) {
      await categoriesApi.update(editingCategory.id, payload);
      showToast('Category updated successfully!', 'success');
    } else {
      await categoriesApi.create(payload as any);
      showToast('Custom category created!', 'success');
    }
    triggerRefresh();
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this custom category?')) return;
    try {
      await categoriesApi.delete(id);
      showToast('Category deleted successfully.', 'success');
      triggerRefresh();
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to delete category.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Categories & Tags
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Organize transactions with default system standards and personalized custom categories
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setEditingCategory(null);
            setIsModalOpen(true);
          }}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          New Category
        </Button>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-card h-28 rounded-2xl bg-slate-900/60" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((c) => (
            <div
              key={c.id}
              className="glass-card p-4 flex flex-col justify-between hover:border-slate-700/80 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: c.color }}
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">{c.name}</h4>
                    <span className="text-[10px] text-slate-400 capitalize">{c.type}</span>
                  </div>
                </div>

                {c.is_system ? (
                  <span
                    className="p-1 text-slate-500"
                    title="Default System Category (Protected)"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-500/60" />
                  </span>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingCategory(c);
                        setIsModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(c.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono text-[10px] text-slate-500">#{c.icon}</span>
                <Badge variant={c.is_system ? 'slate' : 'emerald'} size="sm">
                  {c.is_system ? 'System' : 'Custom'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveCategory}
        initialData={editingCategory}
      />
    </div>
  );
};
