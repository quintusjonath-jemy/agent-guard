import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = (status || 'UNKNOWN').toUpperCase();

  const styleMap: Record<string, { bg: string; dot: string; pulse?: boolean }> = {
    ALLOWED:          { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25', dot: 'bg-emerald-400' },
    ACTIVE:           { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25', dot: 'bg-emerald-400' },
    APPROVED:         { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25', dot: 'bg-emerald-400' },
    RESOLVED:         { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25', dot: 'bg-emerald-400' },
    COMPLETED:        { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25', dot: 'bg-emerald-400' },
    PASS:             { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25', dot: 'bg-emerald-400' },

    PENDING_APPROVAL: { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/25',   dot: 'bg-amber-400', pulse: true },
    PENDING:          { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/25',   dot: 'bg-amber-400', pulse: true },
    INVESTIGATING:    { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/25',   dot: 'bg-amber-400', pulse: true },
    REQUIRED:         { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/25',   dot: 'bg-amber-400' },

    BLOCKED:          { bg: 'bg-red-500/10 text-red-400 border-red-500/25',         dot: 'bg-red-400' },
    REJECTED:         { bg: 'bg-red-500/10 text-red-400 border-red-500/25',         dot: 'bg-red-400' },
    FAILED:           { bg: 'bg-red-500/10 text-red-400 border-red-500/25',         dot: 'bg-red-400' },
    FAIL:             { bg: 'bg-red-500/10 text-red-400 border-red-500/25',         dot: 'bg-red-400' },
    DISABLED:         { bg: 'bg-red-500/10 text-red-400 border-red-500/25',         dot: 'bg-red-400' },
    SUSPENDED:        { bg: 'bg-red-500/10 text-red-400 border-red-500/25',         dot: 'bg-red-400' },

    CONTAINED:        { bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25', dot: 'bg-indigo-400' },
    PAUSED:           { bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25', dot: 'bg-indigo-400' },

    OPEN:             { bg: 'bg-orange-500/10 text-orange-400 border-orange-500/25', dot: 'bg-orange-400', pulse: true },
    PROCESSED:        { bg: 'bg-slate-500/10 text-slate-400 border-slate-500/25',   dot: 'bg-slate-400' },
  };

  const info = styleMap[s] || { bg: 'bg-slate-500/10 text-slate-400 border-slate-500/25', dot: 'bg-slate-400' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono border font-semibold uppercase tracking-wide ${info.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${info.dot} ${info.pulse ? 'animate-pulse' : ''}`} />
      {s.replace('_', ' ')}
    </span>
  );
};
