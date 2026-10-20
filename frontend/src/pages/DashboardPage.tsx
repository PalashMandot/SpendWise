import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  PlusCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { DashboardContextType } from '../components/layout/DashboardLayout';
import { analyticsApi, transactionsApi, categoriesApi, seedApi } from '../services/api';
import { DashboardData, Category, Transaction } from '../types';
import { StatCard } from '../components/dashboard/StatCard';
import { CashFlowChart } from '../components/dashboard/CashFlowChart';
import { CategoryPieChart } from '../components/dashboard/CategoryPieChart';
import { BudgetProgressBar } from '../components/dashboard/BudgetProgressBar';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { TransactionModal } from '../components/transactions/TransactionModal';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';

export const DashboardPage: React.FC = () => {
  const { selectedMonth, refreshTrigger, triggerRefresh } = useOutletContext<DashboardContextType>();
  const { showToast } = useToast();

  const [data, setData] = useState<DashboardData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [dashData, cats] = await Promise.all([
        analyticsApi.getDashboard(selectedMonth),
        categoriesApi.list(),
      ]);
      setData(dashData);
      setCategories(cats);
    } catch {
      showToast('Could not load dashboard metrics.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, showToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshTrigger]);

  const handleCreateTransaction = async (txData: Partial<Transaction>) => {
    await transactionsApi.create(txData);
    showToast('Transaction recorded successfully!', 'success');
    triggerRefresh();
  };

  const handleSeedDemoData = async () => {
    try {
      setIsSeeding(true);
      const res = await seedApi.seedDemoData();
      showToast(res.message || 'Demo data loaded successfully!', 'success');
      triggerRefresh();
    } catch {
      showToast('Failed to seed demo data.', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card h-32 rounded-2xl bg-slate-900/60" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card lg:col-span-2 h-80 rounded-2xl bg-slate-900/60" />
          <div className="glass-card h-80 rounded-2xl bg-slate-900/60" />
        </div>
      </div>
    );
  }

  const summary = data?.summary;
  const isBrandNewAccount = !summary || (summary.total_income === 0 && summary.total_expense === 0 && data?.recent_transactions.length === 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real-time cash flow and budget health for <span className="text-emerald-400 font-semibold">{selectedMonth}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Empty State Banner if user has 0 transactions */}
      {isBrandNewAccount ? (
        <EmptyState
          icon={<Sparkles className="w-8 h-8 text-amber-400" />}
          title="Welcome to SpendWise!"
          description="Your financial dashboard is currently empty. You can record your first transaction or click below to populate 3 months of realistic demo transactions, recurring bills, and category budgets to experience the full analytics suite instantly."
          actionText="Seed 3-Month Demo Data"
          onAction={handleSeedDemoData}
          secondaryActionText="Record Transaction"
          onSecondaryAction={() => setIsModalOpen(true)}
        />
      ) : (
        <>
          {/* Overspending Alerts Banner if any exist */}
          {data?.budget_alerts && data.budget_alerts.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-amber-200">
                    {data.budget_alerts.length} Budget Alert{data.budget_alerts.length > 1 ? 's' : ''} Triggered
                  </h4>
                  <p className="text-[11px] sm:text-xs text-amber-300/80">
                    You have exceeded or are nearing spending thresholds in key categories this month.
                  </p>
                </div>
              </div>
              <Link
                to="/budgets"
                className="text-xs font-semibold text-amber-300 hover:text-amber-200 flex items-center gap-1 shrink-0"
              >
                <span>View Budgets</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              title="Total Inflows"
              value={`$${summary?.total_income.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}`}
              icon={<TrendingUp className="w-5 h-5" />}
              subtitle="monthly earnings"
              accentColor="emerald"
            />
            <StatCard
              title="Total Outflows"
              value={`$${summary?.total_expense.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}`}
              icon={<TrendingDown className="w-5 h-5" />}
              subtitle="monthly expenses"
              accentColor="rose"
            />
            <StatCard
              title="Net Cash Flow"
              value={`${(summary?.net_balance || 0) >= 0 ? '+' : '-'}$${Math.abs(summary?.net_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              icon={<DollarSign className="w-5 h-5" />}
              trend={{
                value: `${summary?.savings_rate || 0}%`,
                isPositive: (summary?.savings_rate || 0) >= 20,
                isNeutral: (summary?.savings_rate || 0) >= 0 && (summary?.savings_rate || 0) < 20,
              }}
              subtitle="savings rate"
              accentColor={summary?.net_balance && summary.net_balance >= 0 ? 'emerald' : 'rose'}
            />
            <StatCard
              title="Budget Utilization"
              value={`${summary?.budget_usage_percent || 0}%`}
              icon={<PiggyBank className="w-5 h-5" />}
              subtitle={`of $${(summary?.total_budgeted || 0).toFixed(0)} budgeted`}
              trend={{
                value: (summary?.budget_usage_percent || 0) > 100 ? 'Exceeded' : 'Active',
                isPositive: (summary?.budget_usage_percent || 0) <= 85,
              }}
              accentColor={(summary?.budget_usage_percent || 0) > 100 ? 'rose' : 'indigo'}
            />
          </div>

          {/* Charts Row: Cash Flow Bar Chart + Category Donut Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CashFlowChart data={data?.monthly_cash_flow || []} />
            </div>
            <div>
              <CategoryPieChart data={data?.category_breakdown || []} />
            </div>
          </div>

          {/* Bottom Row: Active Budget Progress Bars + Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Budgets Card */}
            <div className="glass-card p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-base font-semibold text-white tracking-tight">Budget Progress</h4>
                    <p className="text-xs text-slate-400">Monthly expense caps</p>
                  </div>
                  <Link
                    to="/budgets"
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                  >
                    Manage
                  </Link>
                </div>

                {data?.budget_alerts && data.budget_alerts.length > 0 ? (
                  <div className="space-y-3">
                    {data.budget_alerts.slice(0, 4).map((b) => (
                      <BudgetProgressBar key={b.id} budget={b} />
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <p>No active budgets configured for this month.</p>
                    <Link to="/budgets" className="text-emerald-400 font-semibold hover:underline mt-1 inline-block">
                      Set a budget now →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Transactions (2 cols) */}
            <div className="lg:col-span-2">
              <RecentTransactions transactions={data?.recent_transactions || []} />
            </div>
          </div>
        </>
      )}

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTransaction}
        categories={categories}
      />
    </div>
  );
};
