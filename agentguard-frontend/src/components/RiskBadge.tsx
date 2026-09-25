import React from 'react';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  level: RiskLevel | string;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, size = 'md' }) => {
  const levelUpper = (level || 'LOW').toUpperCase();

  const styles: Record<string, string> = {
    LOW:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    MEDIUM:   'bg-amber-500/10  text-amber-400  border-amber-500/25',
    HIGH:     'bg-orange-500/10 text-orange-400 border-orange-500/25',
    CRITICAL: 'bg-red-500/15   text-red-400   border-red-500/30',
  };

  const dots: Record<string, string> = {
    LOW:      'bg-emerald-400',
    MEDIUM:   'bg-amber-400',
    HIGH:     'bg-orange-400',
    CRITICAL: 'bg-red-400',
  };

  const sizeStyles: Record<string, string> = {
    sm: 'text-[9px] px-1.5 py-0.5 gap-1',
    md: 'text-[10px] px-2 py-0.5 gap-1.5',
    lg: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
  };

  const style = styles[levelUpper] || 'bg-slate-500/10 text-slate-400 border-slate-500/25';
  const dotColor = dots[levelUpper] || 'bg-slate-400';
  const sizeStyle = sizeStyles[size] || sizeStyles['md'];
  const critical = levelUpper === 'CRITICAL';

  return (
    <span
      className={`inline-flex items-center font-mono rounded-full border font-semibold uppercase tracking-wide ${style} ${sizeStyle} ${critical ? 'shadow-glow-red' : ''}`}
    >
      <span className={`rounded-full shrink-0 ${dotColor} ${
        size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5'
      } ${critical ? 'animate-pulse' : ''}`} />
      {levelUpper}
      {score !== undefined && <span className="opacity-60 ml-0.5">({score})</span>}
    </span>
  );
};
