import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  Shield,
  Wrench,
  Lock,
  ScrollText,
  AlertTriangle,
  FlaskConical,
  Zap,
  ArrowLeft,
  DollarSign,
  Activity,
  Plus,
} from 'lucide-react';
import apiClient from '../api/client';
import { AgentDetailResponse, Tool } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';

export const AgentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'tools' | 'permissions' | 'executions' | 'tests'>('overview');
  const [limitAmount, setLimitAmount] = useState<string>('10000');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', id],
    queryFn: async () => {
      const res = await apiClient.get(`/agents/${id}`);
      return res.data.data as AgentDetailResponse;
    },
  });

  const { data: allTools } = useQuery({
    queryKey: ['tools'],
    queryFn: async () => {
      const res = await apiClient.get('/tools');
      return res.data.data as Tool[];
    },
  });

  const updatePermMutation = useMutation({
    mutationFn: async ({ permission_type, max_amount }: { permission_type: string; max_amount: number }) => {
      const res = await apiClient.post(`/agents/${id}/permissions`, {
        permission_type,
        max_amount,
        enabled: true,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', id] });
    },
  });

  const handleUpdateLimit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePermMutation.mutate({
      permission_type: 'FINANCIAL',
      max_amount: parseFloat(limitAmount),
    });
  };

  if (isLoading || !agent) {
    return (
      <div className="py-20 text-center font-mono text-sm text-slate-500 animate-pulse">
        Loading agent governance profile...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back Link & Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/agents')}
          className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Agent Fleet</span>
        </button>
      </div>

      <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-glow-teal">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                {agent.name}
              </h2>
              <StatusBadge status={agent.status} />
              <RiskBadge level={agent.risk_level} />
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              {agent.description || 'Autonomous agent performing governed operations.'}
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs font-mono text-slate-500">
              <span>Provider: <strong className="text-slate-300">{agent.provider}</strong></span>
              <span>Environment: <strong className="text-slate-300">{agent.environment}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/security-tests')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold font-mono tracking-wide shadow-glow-teal transition-all"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Test Agent Security</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-mono">
        {[
          { key: 'overview', label: 'Overview & Security Score', icon: Shield },
          { key: 'tools', label: `Assigned Tools (${agent.tools?.length || 0})`, icon: Wrench },
          { key: 'permissions', label: `Permissions & Limits (${agent.permissions?.length || 0})`, icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-dark-850 text-cyan-300 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-dark-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Security Score Breakdown Card */}
          <div className="glass-panel p-6">
            <h3 className="text-sm font-bold text-white tracking-tight mb-1">
              AgentGuard Security Score
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Deterministic evaluation score based on policy compliance.
            </p>

            <div className="flex items-center justify-center py-6">
              <div className="relative flex items-center justify-center w-36 h-36 rounded-full border-4 border-cyan-500/40 bg-dark-950/80 shadow-glow-teal">
                <div className="text-center">
                  <div className="text-3xl font-extrabold font-mono text-white">
                    {agent.security_score}
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                    / 100 PTS
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-4 pt-4 border-t border-slate-800 text-xs font-mono">
              <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-2">
                Contributing Risk Factors:
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Permission Scope</span>
                <span className="text-cyan-400">+18 pts</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Blocked Unauthorized Attempts</span>
                <span className="text-amber-400">{agent.recent_blocked_count} recorded</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Active Policy Boundaries</span>
                <span className="text-emerald-400">5 Enforced</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Governance Summary */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="glass-panel p-4">
                <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">
                  Assigned Tools
                </div>
                <div className="text-xl font-bold font-mono text-white">
                  {agent.tools?.length || 0}
                </div>
              </div>
              <div className="glass-panel p-4">
                <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">
                  Blocked Incidents
                </div>
                <div className="text-xl font-bold font-mono text-red-400">
                  {agent.recent_incidents_count || 0} Open
                </div>
              </div>
              <div className="glass-panel p-4">
                <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">
                  Governance Status
                </div>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  ENFORCED
                </div>
              </div>
            </div>

            {/* Configured Financial Limits Card */}
            <div className="glass-panel p-6 border-cyan-500/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    Configured Financial Limit Policy
                  </h4>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Current Limit: ₹{agent.permissions?.find((p) => p.permission_name === 'FINANCIAL')?.max_amount?.toLocaleString() || '10,000'}
                </span>
              </div>

              <p className="text-xs text-slate-400 mb-4">
                Any refund or payment request above this limit automatically requires supervisor human approval or is blocked.
              </p>

              <form onSubmit={handleUpdateLimit} className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">₹</span>
                  <input
                    type="number"
                    value={limitAmount}
                    onChange={(e) => setLimitAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 rounded-lg bg-dark-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
                    placeholder="10000"
                  />
                </div>
                <button
                  type="submit"
                  disabled={updatePermMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-semibold transition-all shrink-0"
                >
                  {updatePermMutation.isPending ? 'Updating...' : 'Update Limit'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Assigned Tools */}
      {activeTab === 'tools' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(agent.tools || []).map((t) => (
              <div key={t.id} className="glass-panel p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold font-mono text-cyan-300">{t.name}</span>
                    <RiskBadge level={t.risk_level} size="sm" />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {t.description || 'Gated tool endpoint.'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>Perm: {t.required_permission}</span>
                  <span className="text-emerald-400">ENABLED</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Permissions & Limits */}
      {activeTab === 'permissions' && (
        <div className="glass-panel p-6">
          <h3 className="text-sm font-bold text-white tracking-tight mb-4">
            Assigned Capabilities & Limits
          </h3>
          <div className="divide-y divide-slate-800">
            {(agent.permissions || []).map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold font-mono text-white">
                    {p.permission_name}
                  </span>
                  {p.max_amount && (
                    <span className="ml-3 text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
                      Max Threshold: ₹{p.max_amount.toLocaleString()}
                    </span>
                  )}
                </div>
                <StatusBadge status="ACTIVE" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
