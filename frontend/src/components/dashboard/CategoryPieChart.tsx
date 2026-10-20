import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { CategorySpendItem } from '../../types';

interface CategoryPieChartProps {
  data: CategorySpendItem[];
}

const DEFAULT_COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B',
  '#14B8A6', '#6366F1', '#F97316', '#EF4444', '#64748B'
];

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data }) => {
  const totalExpense = data.reduce((sum, item) => sum + item.total, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as CategorySpendItem;
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-glass text-xs backdrop-blur-md">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="font-semibold text-white">{item.category_name}</span>
          </div>
          <p className="text-slate-300 font-medium">
            ${item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({item.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-5 sm:p-6 flex flex-col h-[380px]">
      <div>
        <h4 className="text-base font-semibold text-white tracking-tight">Spending by Category</h4>
        <p className="text-xs text-slate-400">Monthly expense allocation</p>
      </div>

      {data.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <p className="text-xs text-slate-400">No expense records logged for this month.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col sm:flex-row items-center gap-4 min-h-0 pt-2">
          {/* Donut chart */}
          <div className="w-full sm:w-1/2 h-[180px] sm:h-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="total"
                  nameKey="category_name"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                      stroke="#0f172a"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
              <span className="text-sm font-bold text-white tracking-tight">
                ${totalExpense >= 1000 ? `${(totalExpense / 1000).toFixed(1)}k` : totalExpense.toFixed(0)}
              </span>
            </div>
          </div>

          {/* Category Legend list */}
          <div className="w-full sm:w-1/2 max-h-[170px] overflow-y-auto space-y-2 pr-1">
            {data.slice(0, 6).map((item, idx) => (
              <div key={item.category_id || idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length] }}
                  />
                  <span className="text-slate-300 truncate">{item.category_name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-medium">
                  <span className="text-white">${item.total.toFixed(0)}</span>
                  <span className="text-slate-500 text-[11px] w-8 text-right">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
