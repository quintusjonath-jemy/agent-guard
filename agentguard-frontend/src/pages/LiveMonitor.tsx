import React from 'react';
import { Radio, ShieldAlert, CheckCircle2, AlertTriangle, ArrowUpRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { StatusBadge } from '../components/StatusBadge';
import { RiskBadge } from '../components/RiskBadge';

export const LiveMonitor: React.FC = () => {
  const { isConnected, liveEvents } = useWebSocket();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Live SOC Operations Monitor
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry of autonomous agent tool executions and security decisions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-900 border border-slate-800 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-ping' : 'bg-red-400'
              }`}
            />
            <span className="text-slate-300">
              {isConnected ? 'STREAMING ACTIVE' : 'DISCONNECTED'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Stream Console */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs font-mono text-slate-400 uppercase">
          <span>Real-time Event Stream ({liveEvents.length} Captured)</span>
          <span>Zero Refresh WebSocket Protocol</span>
        </div>

        <div className="divide-y divide-slate-800/80 mt-2">
          {liveEvents.length === 0 ? (
            <div className="py-16 text-center">
              <Activity className="w-10 h-10 text-cyan-500/40 mx-auto mb-3 animate-pulse" />
              <p className="text-sm text-slate-300 font-mono">
                Listening for incoming AI agent tool invocations...
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Send an action through the Gateway or run a scenario in the Security Test Lab.
              </p>
            </div>
          ) : (
            liveEvents.map((evt, idx) => {
              const d = evt.data;
              const isBlocked = d.decision === 'BLOCKED';

              return (
                <div
                  key={idx}
                  onClick={() => d.execution_id && navigate(`/executions/${d.execution_id}`)}
                  className="py-4 hover:bg-dark-850/60 cursor-pointer px-3 rounded-lg transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg border mt-0.5 ${
                        isBlocked
                          ? 'bg-red-950/40 border-red-500/30 text-red-400'
                          : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                      }`}
                    >
                      {isBlocked ? (
                        <ShieldAlert className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white font-mono">
                          {d.agent_name}
                        </span>
                        <span className="text-xs text-slate-400">attempted</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-dark-950 border border-slate-800 text-cyan-300">
                          {d.tool_name}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          ({d.action_name})
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 mt-1">
                        {d.reason || 'Action evaluated across active security policies.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                    <RiskBadge level={d.risk_level || 'LOW'} score={d.risk_score} />
                    <StatusBadge status={d.decision || 'PROCESSED'} />
                    <span className="text-slate-500 text-[11px]">
                      {d.timestamp ? d.timestamp.slice(11, 19) : 'Live'}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-slate-500 hover:text-cyan-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
