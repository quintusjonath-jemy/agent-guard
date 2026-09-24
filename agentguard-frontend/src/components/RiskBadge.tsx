import React from 'react';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  level: RiskLevel | string;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, size = 'md' }) => {
  const levelUpper = (level || 'LOW').toUpperCase();

  const getStyle = () => {
    switch (levelUpper) {
      case 'LOW':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'HIGH':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'CRITICAL':
        return 'bg-red-500/15 text-red-400 border-red-500/40 shadow-glow-red';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return 'text-[10px] px-1.5 py-0.5';
      case 'lg':
        return 'text-xs px-3 py-1 font-semibold';
      default:
        return 'text-[11px] px-2 py-0.5';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono rounded-md border ${getStyle()} ${getSizeStyle()}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${
        levelUpper === 'CRITICAL' ? 'bg-red-400 animate-pulse' :
        levelUpper === 'HIGH' ? 'bg-orange-400' :
        levelUpper === 'MEDIUM' ? 'bg-amber-400' : 'bg-emerald-400'
      }`} />
      <span>{levelUpper}</span>
      {score !== undefined && <span className="opacity-80">({score})</span>}
    </span>
  );
};
