import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Sparkles, Brain, RefreshCw } from 'lucide-react';
import { DashboardContextType } from '../components/layout/DashboardLayout';
import { analyticsApi } from '../services/api';
import { InsightsReport } from '../types';
import { BurnRateCard } from '../components/analytics/BurnRateCard';
import { AiSummaryCard } from '../components/analytics/AiSummaryCard';
import { InsightCard } from '../components/analytics/InsightCard';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';

export const InsightsPage: React.FC = () => {
  const { selectedMonth, refreshTrigger } = useOutletContext<DashboardContextType>();
  const { showToast } = useToast();

  const [report, setReport] = useState<InsightsReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingAi, setIsRefreshingAi] = useState(false);

  const fetchInsights = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await analyticsApi.getInsights(selectedMonth);
      setReport(res);
    } catch {
      showToast('Could not fetch financial insights.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, showToast]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights, refreshTrigger]);

  const handleRegenerateSummary = async () => {
    try {
      setIsRefreshingAi(true);
      const res = await analyticsApi.getInsights(selectedMonth);
      setReport(res);
      showToast('Financial analysis refreshed successfully!', 'success');
    } catch {
      showToast('Failed to refresh AI summary.', 'error');
    } finally {
      setIsRefreshingAi(false);
    }
  };

  if (isLoading && !report) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="glass-card h-48 rounded-2xl bg-slate-900/60" />
        <div className="glass-card h-56 rounded-2xl bg-slate-900/60" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card h-40 rounded-2xl bg-slate-900/60" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Smart Insights & Advisory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              AI + Statistics
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Statistical behavioral pattern detection & automated intelligence for{' '}
            <span className="text-emerald-400 font-semibold">{selectedMonth}</span>
          </p>
        </div>

        <Button
          variant="outline"
          size="md"
          onClick={handleRegenerateSummary}
          isLoading={isRefreshingAi}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh Insights
        </Button>
      </div>

      {report ? (
        <>
          {/* Executive AI / Heuristic Summary */}
          <AiSummaryCard
            summary={report.ai_summary}
            isAiPowered={report.ai_powered}
            onRefresh={handleRegenerateSummary}
            isLoading={isRefreshingAi}
          />

          {/* Burn Rate & Projections */}
          <BurnRateCard projection={report.burn_rate_projection} />

          {/* Rule-Based Statistical Cards */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Detected Behavioral Anomalies & Trends
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {report.rule_based_insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon={<Sparkles className="w-8 h-8" />}
          title="No insights available"
          description="Log transactions to reveal your personalized spending breakdown and forecasts."
        />
      )}
    </div>
  );
};
