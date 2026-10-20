import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  accentColor?: 'emerald' | 'rose' | 'amber' | 'indigo' | 'cyan';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'emerald',
}) => {
  const accentBorders = {
    emerald: 'hover:border-emerald-500/50 hover:shadow-glow-brand',
    rose: 'hover:border-rose-500/50 hover:shadow-glow-rose',
    amber: 'hover:border-amber-500/50',
    indigo: 'hover:border-indigo-500/50 hover:shadow-glow-indigo',
    cyan: 'hover:border-cyan-500/50',
  };

  const iconGradients = {
    emerald: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
    rose: 'from-rose-500/20 to-pink-500/10 text-rose-400 border-rose-500/30',
    amber: 'from-amber-500/20 to-yellow-500/10 text-amber-400 border-amber-500/30',
    indigo: 'from-indigo-500/20 to-purple-500/10 text-indigo-400 border-indigo-500/30',
    cyan: 'from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/30',
  };

  return (
    <div
      className={`glass-card p-5 sm:p-6 transition-all duration-300 ${accentBorders[accentColor]} flex flex-col justify-between`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1.5 tracking-tight font-sans">
            {value}
          </h3>
        </div>
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br border flex items-center justify-center shrink-0 ${iconGradients[accentColor]}`}
        >
          {icon}
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-800/80">
          {trend ? (
            <div className="flex items-center gap-1.5 font-medium">
              <span
                className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                  trend.isNeutral
                    ? 'bg-slate-800 text-slate-300'
                    : trend.isPositive
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {trend.value}
              </span>
              <span className="text-slate-400">{subtitle}</span>
            </div>
          ) : (
            <span className="text-slate-400">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
};
