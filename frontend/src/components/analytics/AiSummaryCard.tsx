import React from 'react';
import { Bot, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '../common/Button';

interface AiSummaryCardProps {
  summary: string;
  isAiPowered: boolean;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const AiSummaryCard: React.FC<AiSummaryCardProps> = ({
  summary,
  isAiPowered,
  onRefresh,
  isLoading = false,
}) => {
  return (
    <div className="glass-card p-6 border-emerald-500/30 relative overflow-hidden shadow-glow-brand">
      {/* Background ambient gradient */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-md">
            {isAiPowered ? <Bot className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">Financial Intelligence Advisory</h3>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                  isAiPowered
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                }`}
              >
                {isAiPowered ? 'AI Powered (Gemini)' : 'Rule Engine'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Personalized behavioral diagnosis and savings optimization
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          isLoading={isLoading}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          className="self-start sm:self-auto text-xs"
        >
          Regenerate Analysis
        </Button>
      </div>

      {/* Content box */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-5 text-xs sm:text-sm text-slate-200 leading-relaxed space-y-2 whitespace-pre-wrap font-sans">
        {summary}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
        <span>Transparent statistical analysis • No private credentials transmitted</span>
        <span>SpendWise Core AI</span>
      </div>
    </div>
  );
};
