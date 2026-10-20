import React from 'react';
import { AlertTriangle, TrendingUp, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { SpendingInsightItem } from '../../types';

interface InsightCardProps {
  insight: SpendingInsightItem;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const typeConfigs = {
    warning: {
      border: 'border-amber-500/40 hover:border-amber-500/70',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      metricBg: 'text-amber-400',
    },
    success: {
      border: 'border-emerald-500/40 hover:border-emerald-500/70',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      metricBg: 'text-emerald-400',
    },
    tip: {
      border: 'border-indigo-500/40 hover:border-indigo-500/70',
      icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
      badgeBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      metricBg: 'text-indigo-400',
    },
    info: {
      border: 'border-cyan-500/40 hover:border-cyan-500/70',
      icon: <TrendingUp className="w-5 h-5 text-cyan-400" />,
      badgeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      metricBg: 'text-cyan-400',
    },
  };

  const config = typeConfigs[insight.type as keyof typeof typeConfigs] || typeConfigs.info;

  return (
    <div
      className={`glass-card p-5 transition-all duration-300 ${config.border} flex flex-col justify-between`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shrink-0">
            {config.icon}
          </div>
          {insight.metric && (
            <span className={`text-base font-bold font-mono tracking-tight ${config.metricBg}`}>
              {insight.metric}
            </span>
          )}
        </div>

        <h4 className="text-sm font-bold text-white tracking-tight mt-1">{insight.title}</h4>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          {insight.description}
        </p>
      </div>

      {insight.impact && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Impact factor:</span>
          <span className="font-semibold text-slate-200 flex items-center gap-1">
            {insight.impact}
            <ArrowRight className="w-3 h-3 text-slate-500" />
          </span>
        </div>
      )}
    </div>
  );
};
