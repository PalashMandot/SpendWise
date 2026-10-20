import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'rose' | 'amber' | 'indigo' | 'slate' | 'cyan';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  dot = false,
}) => {
  const variantStyles = {
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    indigo: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  const dotColors = {
    emerald: 'bg-emerald-400',
    rose: 'bg-rose-400',
    amber: 'bg-amber-400',
    indigo: 'bg-indigo-400',
    cyan: 'bg-cyan-400',
    slate: 'bg-slate-400',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};
