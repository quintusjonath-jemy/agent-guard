import React from 'react';

interface Props {
  level: string;
  score?: number;
  className?: string;
}

export const RiskBadge: React.FC<Props> = ({ level, score, className = '' }) => {
  const norm = level?.toUpperCase() ?? '';
  const cls = norm === 'LOW' ? 'badge-low' : norm === 'MEDIUM' ? 'badge-medium' : norm === 'HIGH' ? 'badge-high' : 'badge-critical';
  return (
    <span className={`badge ${cls} ${className}`}>
      {score !== undefined ? `${score} · ` : ''}{norm}
    </span>
  );
};
