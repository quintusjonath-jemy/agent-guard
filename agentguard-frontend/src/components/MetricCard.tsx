import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: string;
  trendPositive?: boolean;
  highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor = 'text-cyan-400',
  trend,
  trendPositive = true,
  highlight = false,
}) => {
  return (
    <div
      className={`p-5 rounded-xl border transition-all duration-200 ${
        highlight
          ? 'bg-dark-850/90 border-cyan-500/30 shadow-glow-teal'
          : 'bg-dark-900/80 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">
          {title}
        </span>
        <div className={`p-2 rounded-lg bg-dark-950/70 border border-slate-800/80 ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-bold font-mono text-white tracking-tight">
          {value}
        </div>
        {trend && (
          <span
            className={`text-xs font-mono font-medium ${
              trendPositive ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1 text-xs text-slate-500 truncate">
          {subtext}
        </p>
      )}
    </div>
  );
};
