import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Bot, Wrench, Shield, Activity, Lock, ChevronRight, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '../api/client';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';

export const AgentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'overview' | 'tools' | 'executions' | 'policies'>('overview');

  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', id],
    queryFn: () => apiClient.get(`/agents/${id}`).then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-[1000px] mx-auto space-y-4 animate-fade-in">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-40 w-full" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-[14px] text-[#6F6F6F]">Agent not found</p>
        <button onClick={() => navigate('/agents')} className="btn-secondary btn-sm mt-4">Back to agents</button>
      </div>
    );
  }

  const TABS = ['overview', 'tools', 'executions', 'policies'] as const;

  const ChartTip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="card-elevated px-3 py-2 text-[11px] font-mono">
        <p className="text-[#6F6F6F] mb-1">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
            <span className="text-[#A1A1A1]">{p.name}: <span className="text-[#F5F5F5]">{p.value}</span></span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-[1000px] mx-auto animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate('/agents')} className="btn-ghost btn-sm mb-5 -ml-2">
        <ArrowLeft className="w-4 h-4" /> Back to agents
      </button>

      {/* Header */}
      <div className="card p-6 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center flex-shrink-0">
              <Bot className="w-6 h-6 text-[#A1A1A1]" />
            </div>
            <div>
              <h1 className="text-[22px] font-semibold text-[#F5F5F5] tracking-tight">{agent.name}</h1>
              <p className="text-[13px] text-[#A1A1A1] mt-0.5">{agent.description}</p>
              <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-[#6F6F6F]">
                <span>{agent.provider}</span>
                {agent.model && <><span>·</span><span>{agent.model}</span></>}
                {agent.last_activity && (
                  <><span>·</span><span>Last active {new Date(agent.last_activity).toLocaleDateString()}</span></>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RiskBadge level={agent.risk_level} />
            <StatusBadge status={agent.status} />
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 mt-6 pt-5 border-t border-[#2A2A2A]">
          {[
            { label: 'Security Score', val: agent.security_score ?? '—', mono: true },
            { label: 'Total Actions', val: agent.total_executions ?? 0, mono: true },
            { label: 'Blocked',        val: agent.blocked_executions ?? 0, mono: true, color: (agent.blocked_executions ?? 0) > 0 ? 'text-danger' : undefined },
            { label: 'Approved',       val: agent.approved_executions ?? 0, mono: true, color: 'text-success' },
            { label: 'Avg Duration',   val: agent.avg_duration_ms ? `${Math.round(agent.avg_duration_ms)}ms` : '—', mono: true },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className={`text-[20px] font-bold font-mono ${s.color ?? 'text-[#F5F5F5]'}`}>{s.val}</div>
              <div className="text-[11px] text-[#6F6F6F] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-[#2A2A2A]">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-[13px] font-medium capitalize border-b-2 -mb-px transition-all ${
              tab === t
                ? 'text-brand border-brand'
                : 'text-[#6F6F6F] border-transparent hover:text-[#A1A1A1]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {/* Activity chart */}
          {agent.activity_chart && agent.activity_chart.length > 0 && (
            <div className="card p-5">
              <h2 className="text-[14px] font-semibold text-[#F5F5F5] mb-4">Activity (7 Days)</h2>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={agent.activity_chart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#35B77A" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#35B77A" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F04444" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#F04444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fill: '#6F6F6F', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#6F6F6F', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="allowed" name="Allowed" stroke="#35B77A" strokeWidth={1.5} fill="url(#gA)" dot={false} />
                  <Area type="monotone" dataKey="blocked" name="Blocked" stroke="#F04444" strokeWidth={1.5} fill="url(#gB)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Config */}
          <div className="card p-5">
            <h2 className="text-[14px] font-semibold text-[#F5F5F5] mb-4">Agent Configuration</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ['Provider',   agent.provider],
                ['Model',      agent.model || '—'],
                ['API Key ID', agent.api_key_id ? `#${agent.api_key_id}` : '—'],
                ['Created',    agent.created_at ? new Date(agent.created_at).toLocaleDateString() : '—'],
              ].map(([k, v]) => (
                <div key={k} className="p-3 bg-[#1A1A1A] rounded-lg">
                  <div className="text-[11px] text-[#6F6F6F] mb-0.5">{k}</div>
                  <div className="text-[13px] font-mono text-[#F5F5F5]">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'tools' && (
        <div>
          {(!agent.tools || agent.tools.length === 0) ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <Wrench className="w-8 h-8 text-[#2A2A2A] mb-3" />
              <p className="text-[14px] text-[#6F6F6F]">No tools assigned</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {agent.tools.map((t: any) => (
                <div key={t.id} className="card p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-[#6F6F6F]" />
                      <span className="text-[13px] font-semibold font-mono text-[#F5F5F5]">{t.name}</span>
                    </div>
                    <RiskBadge level={t.risk_level} />
                  </div>
                  <p className="text-[12px] text-[#6F6F6F] leading-relaxed mb-3">{t.description || 'Gated tool endpoint.'}</p>
                  <div className="text-[11px] font-mono text-[#6F6F6F]">Permission: {t.required_permission}</div>
                  {t.actions && t.actions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#2A2A2A]">
                      <div className="text-[10px] text-[#6F6F6F] mb-2 uppercase tracking-wide">Actions</div>
                      <div className="flex flex-wrap gap-1.5">
                        {t.actions.map((a: any) => (
                          <span key={a.name || a} className="text-[11px] font-mono text-[#A1A1A1] bg-[#1A1A1A] border border-[#2A2A2A] px-2 py-0.5 rounded">
                            {a.name || a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'executions' && (
        <div className="card overflow-hidden">
          {(!agent.recent_executions || agent.recent_executions.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Activity className="w-8 h-8 text-[#2A2A2A] mb-3" />
              <p className="text-[14px] text-[#6F6F6F]">No recent executions</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tool</th>
                  <th>Action</th>
                  <th>Risk</th>
                  <th>Decision</th>
                  <th>Duration</th>
                  <th>Time</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {agent.recent_executions.map((ex: any) => (
                  <tr key={ex.id} className="cursor-pointer" onClick={() => navigate(`/executions/${ex.id}`)}>
                    <td className="font-mono text-[12px] text-[#A1A1A1]">{ex.tool_name}</td>
                    <td className="font-mono text-[12px] text-[#6F6F6F]">{ex.action_name}</td>
                    <td><RiskBadge level={ex.risk_level} /></td>
                    <td><StatusBadge status={ex.decision} /></td>
                    <td className="font-mono text-[11px] text-[#6F6F6F]">{ex.duration_ms ? `${ex.duration_ms.toFixed(0)}ms` : '—'}</td>
                    <td className="font-mono text-[11px] text-[#6F6F6F] whitespace-nowrap">
                      {ex.created_at ? new Date(ex.created_at).toLocaleTimeString() : '—'}
                    </td>
                    <td><ChevronRight className="w-4 h-4 text-[#6F6F6F]" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'policies' && (
        <div>
          {(!agent.policies || agent.policies.length === 0) ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <Lock className="w-8 h-8 text-[#2A2A2A] mb-3" />
              <p className="text-[14px] text-[#6F6F6F]">No policies assigned</p>
            </div>
          ) : (
            <div className="space-y-3">
              {agent.policies.map((p: any) => (
                <div key={p.id} className="card p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-medium text-[#F5F5F5]">{p.name}</div>
                    {p.description && <div className="text-[12px] text-[#6F6F6F] mt-0.5">{p.description}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[12px] font-mono font-bold ${p.effect === 'BLOCK' ? 'text-danger' : p.effect === 'APPROVE' ? 'text-warning' : 'text-brand'}`}>
                      {p.effect}
                    </span>
                    <StatusBadge status={p.is_active ? 'ACTIVE' : 'INACTIVE'} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
