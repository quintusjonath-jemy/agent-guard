import React from 'react';

interface Props {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: 'green' | 'red' | 'yellow' | 'default';
  trend?: string;
  trendUp?: boolean;
}

export const MetricCard: React.FC<Props> = ({ title, value, sub, icon: Icon, accent = 'default', trend, trendUp }) => {
  const accentColor = accent === 'green' ? '#35B77A' : accent === 'red' ? '#F04444' : accent === 'yellow' ? '#D6A84F' : '#A1A1A1';
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accentColor}14` }}>
          <Icon className="w-4 h-4" style={{ color: accentColor }} />
        </div>
        {trend && (
          <span className={`text-[11px] font-mono ${trendUp ? 'text-success' : 'text-danger'}`}>{trend}</span>
        )}
      </div>
      <div className="text-[28px] font-bold text-[#F5F5F5] font-mono tabular-nums leading-none">{value}</div>
      <div className="text-[12px] text-[#A1A1A1] mt-1">{title}</div>
      {sub && <div className="text-[11px] text-[#6F6F6F] font-mono mt-0.5">{sub}</div>}
    </div>
  );
};
