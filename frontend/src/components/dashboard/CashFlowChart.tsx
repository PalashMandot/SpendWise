import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { MonthlyCashFlowItem } from '../../types';

interface CashFlowChartProps {
  data: MonthlyCashFlowItem[];
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({ data }) => {
  // Format month labels from "YYYY-MM" to "Mon 'YY"
  const formattedData = data.map((item) => {
    try {
      const [year, month] = item.month.split('-');
      const d = new Date(parseInt(year), parseInt(month) - 1, 1);
      return {
        ...item,
        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      };
    } catch {
      return { ...item, label: item.month };
    }
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-glass text-xs space-y-1 backdrop-blur-md">
          <p className="font-semibold text-white mb-1.5">{label}</p>
          <div className="flex items-center justify-between gap-4 text-emerald-400">
            <span>Income:</span>
            <span className="font-semibold">${payload[0]?.value?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-rose-400">
            <span>Expense:</span>
            <span className="font-semibold">${payload[1]?.value?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="border-t border-slate-800 pt-1 mt-1 flex items-center justify-between gap-4 text-slate-300">
            <span>Net:</span>
            <span className="font-semibold">
              ${(payload[0]?.value - payload[1]?.value)?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-5 sm:p-6 flex flex-col h-[380px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-base font-semibold text-white tracking-tight">Cash Flow Dynamics</h4>
          <p className="text-xs text-slate-400">Past 6 months income vs expenditures</p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: 12, fontSize: 11 }}
            />
            <Bar
              name="Income"
              dataKey="income"
              fill="#10B981"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              name="Expenses"
              dataKey="expense"
              fill="#F43F5E"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
