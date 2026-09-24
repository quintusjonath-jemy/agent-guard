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
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 90) return 'text-cyan-400 stroke-cyan-400';
    if (score >= 75) return 'text-emerald-400 stroke-emerald-400';
    if (score >= 50) return 'text-amber-400 stroke-amber-400';
    return 'text-red-400 stroke-red-400';
  };

  return (
    <div className="glass-panel-elevated p-6 border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-6">
        {/* Radial SVG Gauge */}
        <div className="relative flex items-center justify-center">
          <svg className="w-28 h-28 transform -rotate-90">
            <circle
              cx="56"
              cy="56"
              r={radius}
              className="stroke-slate-800/80"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="56"
              cy="56"
              r={radius}
              className={`transition-all duration-1000 ease-out ${getScoreColor()}`}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold font-mono text-white tracking-tighter">
              {score}
            </span>
            <span className="text-[9px] uppercase font-mono text-slate-400 tracking-wider">
              SCORE
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <h3 className="text-base font-bold text-white tracking-tight">
              AgentGuard Security Score
            </h3>
          </div>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
            Deterministic governance score based on enforced policies, least-privilege configurations, and recent blocked anomalies.
          </p>
        </div>
      </div>

      {/* Mini Grid Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
        <div className="bg-dark-950/70 border border-slate-800/80 rounded-lg p-3 text-center min-w-[95px]">
          <div className="text-[10px] text-slate-400 font-mono mb-0.5 flex items-center justify-center gap-1">
            <Bot className="w-3 h-3 text-cyan-400" />
            AGENTS
          </div>
          <div className="text-sm font-bold text-white font-mono">{activeAgents} Online</div>
        </div>

        <div className="bg-dark-950/70 border border-slate-800/80 rounded-lg p-3 text-center min-w-[95px]">
          <div className="text-[10px] text-slate-400 font-mono mb-0.5 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-emerald-400" />
            POLICIES
          </div>
          <div className="text-sm font-bold text-white font-mono">{activePolicies} Active</div>
        </div>

        <div className="bg-dark-950/70 border border-slate-800/80 rounded-lg p-3 text-center min-w-[95px]">
          <div className="text-[10px] text-slate-400 font-mono mb-0.5 flex items-center justify-center gap-1">
            <Cpu className="w-3 h-3 text-blue-400" />
            TOOLS
          </div>
          <div className="text-sm font-bold text-white font-mono">{totalTools} Gated</div>
        </div>

        <div className="bg-dark-950/70 border border-slate-800/80 rounded-lg p-3 text-center min-w-[95px]">
          <div className="text-[10px] text-slate-400 font-mono mb-0.5 flex items-center justify-center gap-1">
            <Activity className="w-3 h-3 text-amber-400" />
            GATEWAY
          </div>
          <div className="text-sm font-bold text-emerald-400 font-mono">HEALTHY</div>
        </div>
      </div>
    </div>
  );
};
