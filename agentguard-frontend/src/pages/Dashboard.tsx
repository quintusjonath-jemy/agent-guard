import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bot, ShieldAlert, Activity, CheckCircle2, ArrowRight,
  AlertTriangle, ChevronRight, TrendingUp, TrendingDown,
  Clock, Zap, Shield,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import apiClient from '../api/client';
import { SecurityScoreGauge } from '../components/SecurityScoreGauge';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../context/AuthContext';

// ── Metric Card ──────────────────────────────────────────────
interface MetricCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  accent?: 'green' | 'red' | 'yellow' | 'default';
  trend?: string;
  trendUp?: boolean;
}
const MetricCard: React.FC<MetricCardProps> = ({ label, value, sub, icon: Icon, accent = 'default', trend, trendUp }) => {
  const accentColor = accent === 'green' ? '#35B77A' : accent === 'red' ? '#F04444' : accent === 'yellow' ? '#D6A84F' : '#A1A1A1';
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accentColor}14` }}>
          <Icon className="w-4 h-4" style={{ color: accentColor }} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[11px] font-mono ${trendUp ? 'text-success' : 'text-danger'}`}>
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
      <div className="text-[28px] font-bold text-[#F5F5F5] font-mono tracking-tight tabular-nums leading-none">{value}</div>
      <div className="text-[12px] text-[#A1A1A1] mt-1">{label}</div>
      <div className="text-[11px] text-[#6F6F6F] font-mono mt-0.5">{sub}</div>
    </div>
  );
};

// ── Chart tooltip ─────────────────────────────────────────────
const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-elevated px-3 py-2 text-[11px] font-mono">
      <p className="text-[#6F6F6F] mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-[#A1A1A1]">{p.name}:</span>
          <span className="text-[#F5F5F5] font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const RISK_COLORS = ['#35B77A', '#D6A84F', '#E06A62', '#F04444'];
const RISK_LABELS = ['Low', 'Medium', 'High', 'Critical'];

// ── Dashboard ─────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const [range, setRange] = useState<'24H' | '7D' | '30D'>('24H');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected, liveEvents } = useWebSocket();

  const { data: stats }       = useQuery({ queryKey: ['dashboard_stats'], queryFn: () => apiClient.get('/dashboard/stats').then(r => r.data.data), refetchInterval: 30000 });
  const { data: trends }      = useQuery({ queryKey: ['security_trends', range], queryFn: () => apiClient.get(`/dashboard/security-trends?range=${range}`).then(r => r.data.data), refetchInterval: 60000 });
  const { data: approvals }   = useQuery({ queryKey: ['approvals'], queryFn: () => apiClient.get('/approvals?status=PENDING&limit=3').then(r => r.data.data) });
  const { data: agents }      = useQuery({ queryKey: ['agents'], queryFn: () => apiClient.get('/agents').then(r => r.data.data) });
  const { data: incidents }   = useQuery({ queryKey: ['incidents'], queryFn: () => apiClient.get('/incidents?status=OPEN&limit=3').then(r => r.data.data) });

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const chartData = trends?.chart || [];
  const riskDist  = stats?.risk_distribution || { low: 0, medium: 0, high: 0, critical: 0 };
  const riskPie   = [
    { name: 'Low', value: riskDist.low || 0 },
    { name: 'Medium', value: riskDist.medium || 0 },
    { name: 'High', value: riskDist.high || 0 },
    { name: 'Critical', value: riskDist.critical || 0 },
  ].filter(r => r.value > 0);

  const pendingApprovals = Array.isArray(approvals) ? approvals : (approvals?.items ?? []);
  const openIncidents    = Array.isArray(incidents) ? incidents : (incidents?.items ?? []);
  const agentList        = Array.isArray(agents) ? agents : (agents?.items ?? []);

  const formatTs = (ts: string) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto animate-fade-in">

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] text-[#6F6F6F] mb-1">{greeting}, {user?.name?.split(' ')[0] || 'Admin'}</p>
          <h1 className="text-[24px] font-semibold text-[#F5F5F5] tracking-tight">Security Overview</h1>
          <p className="text-[13px] text-[#6F6F6F] mt-1">
            {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[12px]">
          <span className={`live-dot ${isConnected ? '' : 'gray'}`} />
          <span className="text-[#6F6F6F] font-mono">{isConnected ? 'Live' : 'Connecting'}</span>
        </div>
      </div>

      {/* ── System Health + Metrics ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Health card */}
        <div className="card p-6 flex flex-col items-center justify-center md:col-span-1">
          <SecurityScoreGauge score={stats?.security_score || 0} size={96} />
          <div className="mt-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <span className="live-dot" />
              <span className="text-[11px] text-[#A1A1A1]">All systems operational</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-center">
              {[
                { label: 'Agents', val: `${stats?.active_agents || 0}/${stats?.total_agents || 0}` },
                { label: 'Policies', val: stats?.active_policies || 0 },
                { label: 'Tools', val: stats?.active_tools || 0 },
                { label: 'Gateway', val: 'ON' },
              ].map(r => (
                <div key={r.label}>
                  <div className="text-[12px] font-semibold text-[#F5F5F5] font-mono">{r.val}</div>
                  <div className="text-[10px] text-[#6F6F6F]">{r.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="md:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Active Agents" value={stats?.active_agents ?? '—'} sub="In production"       icon={Bot}         accent="green"  trend="+2 today"   trendUp />
          <MetricCard label="Actions Today" value={stats?.executions_today ?? '—'} sub="Gateway requests" icon={Zap}         accent="default" />
          <MetricCard label="Blocked Actions" value={stats?.blocked_today ?? '—'}  sub="Policy violations" icon={ShieldAlert} accent="red"    trend={stats?.blocked_today > 0 ? `${stats.blocked_today} blocked` : undefined} trendUp={false} />
          <MetricCard label="Pending Approvals" value={stats?.pending_approvals ?? '—'} sub={stats?.pending_approvals > 0 ? 'Requires attention' : 'No actions required'} icon={CheckCircle2} accent={stats?.pending_approvals > 0 ? 'yellow' : 'green'} />
        </div>
      </div>

      {/* ── Charts Row ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[14px] font-semibold text-[#F5F5F5]">Security Activity</h2>
              <p className="text-[12px] text-[#6F6F6F] mt-0.5">Allowed vs blocked actions</p>
            </div>
            <div className="flex items-center gap-1 border border-[#2A2A2A] rounded-lg p-1">
              {(['24H', '7D', '30D'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-all ${
                    range === r ? 'bg-[#1A1A1A] text-[#F5F5F5]' : 'text-[#6F6F6F] hover:text-[#A1A1A1]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gAllowed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#35B77A" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#35B77A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gBlocked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F04444" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#F04444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fill: '#6F6F6F', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#6F6F6F', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTip />} cursor={{ stroke: '#2A2A2A' }} />
              <Area type="monotone" dataKey="allowed" name="Allowed" stroke="#35B77A" strokeWidth={1.5} fill="url(#gAllowed)" dot={false} />
              <Area type="monotone" dataKey="blocked" name="Blocked" stroke="#F04444" strokeWidth={1.5} fill="url(#gBlocked)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk donut */}
        <div className="card p-5">
          <div className="mb-4">
            <h2 className="text-[14px] font-semibold text-[#F5F5F5]">Risk Distribution</h2>
            <p className="text-[12px] text-[#6F6F6F] mt-0.5">Security event breakdown</p>
          </div>
          {riskPie.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={riskPie} cx="50%" cy="50%" innerRadius={44} outerRadius={60} dataKey="value" paddingAngle={2} startAngle={90} endAngle={-270}>
                    {riskPie.map((_, i) => <Cell key={i} fill={RISK_COLORS[i] ?? RISK_COLORS[3]} stroke="none" />)}
                  </Pie>
                  <Tooltip formatter={(v: number, n: string) => [v, n]} contentStyle={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {RISK_LABELS.map((l, i) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: RISK_COLORS[i] }} />
                    <span className="text-[11px] text-[#A1A1A1]">{l}</span>
                    <span className="text-[11px] font-mono text-[#F5F5F5] ml-auto">{riskDist[l.toLowerCase() as keyof typeof riskDist] || 0}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[180px] text-center">
              <Shield className="w-8 h-8 text-[#2A2A2A] mb-2" />
              <p className="text-[12px] text-[#6F6F6F]">No security events yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom row ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Live security events */}
        <div className="card lg:col-span-2 flex flex-col overflow-hidden" style={{ maxHeight: 380 }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A] flex-shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-semibold text-[#F5F5F5]">Live Security Events</h2>
              <span className="flex items-center gap-1 text-[10px] font-mono text-[#6F6F6F]">
                <span className={`live-dot ${isConnected ? '' : 'gray'}`} style={{ width: 5, height: 5 }} />
                LIVE
              </span>
            </div>
            <button onClick={() => navigate('/executions')} className="btn-ghost btn-xs">View all</button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[#1F1F1F]">
            {liveEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center px-6">
                <Activity className="w-8 h-8 text-[#2A2A2A] mb-2" />
                <p className="text-[13px] text-[#6F6F6F]">Monitoring agent activity...</p>
                <p className="text-[11px] text-[#6F6F6F] mt-1 font-mono">Events will appear here in real time</p>
              </div>
            ) : (
              liveEvents.slice(0, 20).map((ev, i) => {
                const d = ev.data;
                const isBlocked = d.decision === 'BLOCKED' || d.decision === 'FAILED';
                const isCritical = d.risk_level === 'CRITICAL';
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 px-5 py-3.5 hover:bg-[#1A1A1A] transition-colors cursor-pointer animate-enter-row ${isCritical ? 'border-l-2 border-[#F04444]' : ''}`}
                    onClick={() => d.execution_id && navigate(`/executions/${d.execution_id}`)}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${isBlocked ? 'bg-[#F04444]' : 'bg-[#35B77A]'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12px] font-medium text-[#F5F5F5]">{d.agent_name ?? '—'}</span>
                        <span className="text-[11px] font-mono text-[#6F6F6F]">{d.tool_name}</span>
                        {d.action_name && d.action_name !== d.tool_name && (
                          <span className="text-[11px] font-mono text-[#6F6F6F]">· {d.action_name}</span>
                        )}
                      </div>
                      {d.reason && isBlocked && (
                        <p className="text-[11px] text-[#6F6F6F] mt-0.5 truncate">{d.reason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {d.risk_level && <RiskBadge level={d.risk_level} />}
                      {d.decision && <StatusBadge status={d.decision} />}
                      <span className="text-[10px] font-mono text-[#6F6F6F]">{d.timestamp ? formatTs(d.timestamp) : ''}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pending approvals + agents */}
        <div className="flex flex-col gap-4">
          {/* Approvals */}
          <div className="card flex-1">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A]">
              <h2 className="text-[13px] font-semibold text-[#F5F5F5]">Pending Approvals</h2>
              {pendingApprovals.length > 0 && (
                <span className="badge badge-pending">{pendingApprovals.length}</span>
              )}
            </div>
            {pendingApprovals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                <CheckCircle2 className="w-6 h-6 text-[#2A2A2A] mb-2" />
                <p className="text-[12px] text-[#6F6F6F]">No pending approvals</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1F1F1F]">
                {pendingApprovals.map((a: any) => (
                  <div
                    key={a.id}
                    className="px-5 py-3.5 hover:bg-[#1A1A1A] cursor-pointer transition-colors"
                    onClick={() => navigate('/approvals')}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-medium text-[#F5F5F5]">{a.agent_name}</span>
                      <RiskBadge level={a.risk_level || 'HIGH'} />
                    </div>
                    <div className="text-[11px] font-mono text-[#6F6F6F]">{a.tool_name} · {a.action_name}</div>
                    <button
                      className="btn-ghost btn-xs mt-2 text-brand hover:text-brand"
                      onClick={e => { e.stopPropagation(); navigate('/approvals'); }}
                    >
                      Review →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Open incidents */}
          {openIncidents.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A]">
                <h2 className="text-[13px] font-semibold text-[#F5F5F5]">Open Incidents</h2>
                <span className="badge badge-critical">{openIncidents.length}</span>
              </div>
              <div className="divide-y divide-[#1F1F1F]">
                {openIncidents.slice(0, 3).map((inc: any) => (
                  <div
                    key={inc.id}
                    className="px-5 py-3.5 hover:bg-[#1A1A1A] cursor-pointer transition-colors"
                    onClick={() => navigate('/incidents')}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#F04444] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[12px] text-[#F5F5F5] truncate-2 leading-snug">{inc.title}</p>
                        <p className="text-[10px] font-mono text-[#6F6F6F] mt-0.5">{inc.agent_name} · {inc.severity}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Agents requiring attention ──────────────── */}
      {agentList.filter((a: any) => a.risk_level === 'HIGH' || a.risk_level === 'CRITICAL').length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A]">
            <div>
              <h2 className="text-[14px] font-semibold text-[#F5F5F5]">Agents Requiring Attention</h2>
              <p className="text-[12px] text-[#6F6F6F] mt-0.5">Agents with elevated risk profiles</p>
            </div>
            <button onClick={() => navigate('/agents')} className="btn-ghost btn-xs">View all agents</button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Risk Level</th>
                  <th className="hidden sm:table-cell">Blocked Actions</th>
                  <th className="hidden md:table-cell">Status</th>
                  <th className="hidden lg:table-cell">Last Activity</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {agentList.filter((a: any) => ['HIGH', 'CRITICAL'].includes(a.risk_level)).slice(0, 5).map((a: any) => (
                  <tr key={a.id} className="cursor-pointer" onClick={() => navigate(`/agents/${a.id}`)}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
                          <Bot className="w-3.5 h-3.5 text-[#6F6F6F]" />
                        </div>
                        <div>
                          <div className="text-[13px] text-[#F5F5F5] font-medium">{a.name}</div>
                          <div className="text-[11px] text-[#6F6F6F] font-mono">{a.provider}</div>
                        </div>
                      </div>
                    </td>
                    <td><RiskBadge level={a.risk_level} /></td>
                    <td className="hidden sm:table-cell font-mono text-[#A1A1A1]">{a.blocked_executions ?? '—'}</td>
                    <td className="hidden md:table-cell"><StatusBadge status={a.status} /></td>
                    <td className="hidden lg:table-cell text-[#6F6F6F] font-mono text-[11px]">
                      {a.last_activity ? new Date(a.last_activity).toLocaleString() : '—'}
                    </td>
                    <td>
                      <ChevronRight className="w-4 h-4 text-[#6F6F6F]" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

function formatTs(ts: string) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
