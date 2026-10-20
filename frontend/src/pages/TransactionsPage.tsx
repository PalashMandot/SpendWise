import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { PlusCircle, Download } from 'lucide-react';
import { DashboardContextType } from '../components/layout/DashboardLayout';
import { transactionsApi, categoriesApi, csvApi } from '../services/api';
import { Transaction, Category, TransactionFilterParams } from '../types';
import { TransactionTable } from '../components/transactions/TransactionTable';
import { TransactionFilterBar } from '../components/transactions/TransactionFilterBar';
import { TransactionModal } from '../components/transactions/TransactionModal';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';

export const TransactionsPage: React.FC = () => {
  const { refreshTrigger, triggerRefresh } = useOutletContext<DashboardContextType>();
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState<TransactionFilterParams>({
    page: 1,
    size: 15,
    sort_by: 'date',
    sort_order: 'desc',
  });

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await transactionsApi.list({ ...filters, page });
      setTransactions(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch {
      showToast('Failed to fetch transactions.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [filters, page, showToast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, refreshTrigger]);

  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => {});
  }, []);

  const handleFilterChange = (updated: Partial<TransactionFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
    if (updated.page) {
      setPage(updated.page);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      size: 15,
      sort_by: 'date',
      sort_order: 'desc',
    });
    setPage(1);
  };

  const handleSaveTransaction = async (txData: Partial<Transaction>) => {
    if (editingTransaction) {
      await transactionsApi.update(editingTransaction.id, txData);
      showToast('Transaction updated successfully!', 'success');
    } else {
      await transactionsApi.create(txData);
      showToast('Transaction created successfully!', 'success');
    }
    triggerRefresh();
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this transaction record?')) return;
    try {
      await transactionsApi.delete(id);
      showToast('Transaction deleted successfully!', 'success');
      triggerRefresh();
    } catch {
      showToast('Failed to delete transaction.', 'error');
    }
  };

  const handleExportCsv = () => {
    const url = csvApi.getExportUrl({
      start_date: filters.start_date,
      end_date: filters.end_date,
      type: filters.type,
      category_id: filters.category_id,
    });
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Transaction Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Search, filter, and audit all recorded financial inflows and expenses
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={handleExportCsv}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setEditingTransaction(null);
              setIsModalOpen(true);
            }}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <TransactionFilterBar
        filters={filters}
        categories={categories}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Table */}
      <TransactionTable
        transactions={transactions}
        total={total}
        page={page}
        totalPages={totalPages}
        isLoading={isLoading}
        onPageChange={setPage}
        onEdit={(t) => {
          setEditingTransaction(t);
          setIsModalOpen(true);
        }}
        onDelete={handleDeleteTransaction}
        onAddNew={() => {
          setEditingTransaction(null);
          setIsModalOpen(true);
        }}
      />

      {/* Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveTransaction}
        categories={categories}
        initialData={editingTransaction}
      />
    </div>
  );
};
