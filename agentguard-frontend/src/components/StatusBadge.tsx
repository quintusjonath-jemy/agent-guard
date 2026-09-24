import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'decision' | 'approval' | 'agent' | 'incident' | 'generic';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'generic' }) => {
  const sUpper = (status || 'UNKNOWN').toUpperCase();

  const getStyle = () => {
    switch (sUpper) {
      case 'ALLOWED':
      case 'ACTIVE':
      case 'APPROVED':
      case 'RESOLVED':
      case 'COMPLETED':
      case 'PASS':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

      case 'PENDING_APPROVAL':
      case 'PENDING':
      case 'INVESTIGATING':
      case 'WARN':
      case 'REQUIRED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';

      case 'BLOCKED':
      case 'REJECTED':
      case 'FAILED':
      case 'FAIL':
      case 'DISABLED':
      case 'SUSPENDED':
        return 'bg-red-500/10 text-red-400 border-red-500/30';

      case 'CONTAINED':
      case 'PAUSED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';

      case 'OPEN':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';

      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono border font-medium ${getStyle()}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${
        sUpper === 'BLOCKED' || sUpper === 'FAILED' ? 'bg-red-400' :
        sUpper === 'ALLOWED' || sUpper === 'ACTIVE' || sUpper === 'APPROVED' ? 'bg-emerald-400' :
        sUpper === 'PENDING_APPROVAL' || sUpper === 'PENDING' ? 'bg-amber-400 animate-pulse' :
        'bg-slate-400'
      }`} />
      {sUpper}
    </span>
  );
};
