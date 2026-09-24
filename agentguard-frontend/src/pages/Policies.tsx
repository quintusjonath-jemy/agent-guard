import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, Plus, Play, ShieldAlert, CheckCircle2, ChevronRight, Sliders, AlertTriangle, ArrowRight } from 'lucide-react';
import apiClient from '../api/client';
import { Policy, RiskLevel, PolicyType } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';

export const Policies: React.FC = () => {
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simAgentId, setSimAgentId] = useState(1);
  const [simTool, setSimTool] = useState('refund_customer');
  const [simAmount, setSimAmount] = useState(85000);
  const [simResult, setSimResult] = useState<any>(null);

  const queryClient = useQueryClient();

  const { data: policies, isLoading } = useQuery({
    queryKey: ['policies'],
    queryFn: async () => {
      const res = await apiClient.get('/policies');
      return res.data.data as Policy[];
    },
  });

  const simulateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/policies/simulate', payload);
      return res.data.data;
    },
    onSuccess: (data) => {
      setSimResult(data);
    },
  });

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    simulateMutation.mutate({
      agent_id: simAgentId,
      tool_name: simTool,
      action: 'refund',
      payload: { customer_id: 381, amount: simAmount },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Security & Governance Policy Builder
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic server-side rule engine enforcing rate limits, financial limits, and DLP protections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsSimulatorOpen(true);
              setSimResult(null);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-900 border border-slate-700 hover:border-cyan-500/50 text-cyan-400 text-xs font-semibold font-mono tracking-wide transition-all"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Open Policy Simulator</span>
          </button>
        </div>
      </div>

      {/* Visual Policy Rules Cards */}
      <div className="space-y-4">
        {(policies || []).map((policy) => {
          const rule = policy.rule_definition || {};
          return (
            <div
              key={policy.id}
              className="glass-panel p-6 border-slate-800 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-dark-950 border border-slate-800 text-cyan-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      {policy.name}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      Type: {policy.policy_type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <RiskBadge level={policy.severity} size="sm" />
                  <StatusBadge status={policy.enabled ? 'ACTIVE' : 'DISABLED'} />
                </div>
              </div>

              {/* Visual Rule Block (WHEN ... AND ... THEN ...) */}
              <div className="p-4 rounded-lg bg-dark-950/80 border border-slate-800/80 font-mono text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                    WHEN
                  </span>
                  <span>
                    Action is <strong className="text-white font-semibold">{rule.action || rule.actions?.join(', ') || 'Any Action'}</strong>
                  </span>
                </div>

                {rule.field && (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                      AND
                    </span>
                    <span>
                      Field <code className="text-cyan-400 font-bold">{rule.field}</code> {rule.operator || 'greater than'} <strong className="text-white font-semibold">₹{rule.value?.toLocaleString()}</strong>
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                  <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] font-bold">
                    THEN
                  </span>
                  <span>
                    Enforce <strong className="text-red-400 font-bold">{rule.enforce || 'BLOCK'}</strong> and emit immutable audit telemetry.
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Policy Simulator Slide-Over Drawer */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-dark-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md h-full glass-panel-elevated p-6 border-l border-slate-700 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white tracking-tight font-mono">
                    LIVE POLICY SIMULATOR
                  </h3>
                </div>
                <button
                  onClick={() => setIsSimulatorOpen(false)}
                  className="text-slate-400 hover:text-white text-xs font-mono"
                >
                  ✕ Close
                </button>
              </div>

              <form onSubmit={handleSimulate} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                    Target AI Agent
                  </label>
                  <select
                    value={simAgentId}
                    onChange={(e) => setSimAgentId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="1">FinanceBot (Limit: ₹10,000)</option>
                    <option value="2">SupportBot (Customer Support)</option>
                    <option value="3">HR Assistant (HR Policy)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                    Target Tool Call
                  </label>
                  <select
                    value={simTool}
                    onChange={(e) => setSimTool(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="refund_customer">refund_customer</option>
                    <option value="customer.read">customer.read</option>
                    <option value="customer.delete">customer.delete</option>
                    <option value="database.export">database.export</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                    Refund Amount (INR)
                  </label>
                  <input
                    type="number"
                    value={simAmount}
                    onChange={(e) => setSimAmount(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={simulateMutation.isPending}
                  className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs shadow-glow-teal transition-all"
                >
                  {simulateMutation.isPending ? 'Evaluating...' : 'Simulate Policy Evaluation'}
                </button>
              </form>

              {/* Simulation Result Output */}
              {simResult && (
                <div className="mt-6 pt-5 border-t border-slate-800 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">DECISION:</span>
                    <StatusBadge status={simResult.decision} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">CALCULATED RISK:</span>
                    <RiskBadge level={simResult.risk_level} score={simResult.risk_score} />
                  </div>

                  <div className="p-3 rounded-lg bg-dark-950 border border-slate-800 font-mono text-[11px] text-slate-300">
                    <div className="font-bold text-white mb-1">Reason:</div>
                    {simResult.reasons?.map((r: string, idx: number) => (
                      <div key={idx} className="text-slate-400">• {r}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
