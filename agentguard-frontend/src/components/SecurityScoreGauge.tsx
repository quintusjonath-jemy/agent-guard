import React from 'react';
import { ShieldCheck, Activity, Lock, Cpu, Bot } from 'lucide-react';

interface SecurityScoreGaugeProps {
  score: number;
  activeAgents: number;
  activePolicies: number;
  totalTools: number;
}

export const SecurityScoreGauge: React.FC<SecurityScoreGaugeProps> = ({
  score,
  activeAgents,
  activePolicies,
  totalTools,
}) => {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const scoreInfo = score >= 90
    ? { color: 'text-cyan-400', stroke: '#22d3ee', glowColor: 'rgba(6,182,212,0.3)', label: 'EXCELLENT', labelColor: 'text-cyan-400' }
    : score >= 75
    ? { color: 'text-emerald-400', stroke: '#34d399', glowColor: 'rgba(52,211,153,0.25)', label: 'GOOD', labelColor: 'text-emerald-400' }
    : score >= 50
    ? { color: 'text-amber-400', stroke: '#fbbf24', glowColor: 'rgba(251,191,36,0.25)', label: 'FAIR', labelColor: 'text-amber-400' }
    : { color: 'text-red-400', stroke: '#f87171', glowColor: 'rgba(248,113,113,0.25)', label: 'AT RISK', labelColor: 'text-red-400' };

  const stats = [
    { icon: Bot,      iconColor: 'text-cyan-400',    label: 'AGENTS',   value: `${activeAgents}`, sub: 'Online' },
    { icon: Lock,     iconColor: 'text-emerald-400', label: 'POLICIES', value: `${activePolicies}`, sub: 'Active' },
    { icon: Cpu,      iconColor: 'text-indigo-400',  label: 'TOOLS',    value: `${totalTools}`, sub: 'Gated' },
    { icon: Activity, iconColor: 'text-amber-400',   label: 'GATEWAY',  value: 'LIVE', sub: 'Healthy', special: true },
  ];

  return (
    <div className="glass-panel-elevated p-5 lg:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

        {/* Left: Gauge + Text */}
        <div className="flex items-center gap-5">
          {/* SVG Gauge */}
          <div className="relative flex items-center justify-center shrink-0">
            {/* Outer glow ring */}
            <div
              className="absolute inset-0 rounded-full blur-xl opacity-30"
              style={{ background: `radial-gradient(circle, ${scoreInfo.glowColor}, transparent 70%)` }}
            />
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
              {/* Track */}
              <circle
                cx="60" cy="60" r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="7"
              />
              {/* Progress */}
              <circle
                cx="60" cy="60" r={radius}
                fill="none"
                stroke={scoreInfo.stroke}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{ filter: `drop-shadow(0 0 6px ${scoreInfo.stroke}80)` }}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className={`text-2xl font-extrabold font-mono ${scoreInfo.color}`}>{score}</span>
              <span className={`text-[8px] uppercase font-mono tracking-widest ${scoreInfo.labelColor} opacity-80`}>
                {scoreInfo.label}
              </span>
            </div>
          </div>

          {/* Score description */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldCheck className={`w-4 h-4 ${scoreInfo.color}`} />
              <h3 className="text-sm font-bold text-white tracking-tight">Security Score</h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                score >= 90 ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' :
                score >= 75 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                'text-amber-400 bg-amber-500/10 border-amber-500/20'
              }`}>
                {scoreInfo.label}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
              Deterministic governance score based on enforced policies, least-privilege configurations, and recent blocked anomalies.
            </p>

            {/* Mini progress bar */}
            <div className="mt-3 w-full max-w-[200px]">
              <div className="h-1 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${score}%`, background: scoreInfo.stroke, boxShadow: `0 0 8px ${scoreInfo.stroke}60` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Stat Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 md:gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-dark-800/60 border border-white/[0.05] rounded-xl p-3 text-center min-w-[90px]"
            >
              <div className={`flex items-center justify-center gap-1 text-[9px] font-mono font-semibold uppercase tracking-wider mb-1.5 ${s.iconColor}`}>
                <s.icon className="w-2.5 h-2.5" />
                {s.label}
              </div>
              <div className={`text-base font-extrabold font-mono ${s.special ? 'text-emerald-400' : 'text-white'}`}>
                {s.value}
              </div>
              <div className="text-[9px] text-slate-600 font-mono">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
