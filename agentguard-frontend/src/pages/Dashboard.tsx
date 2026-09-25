import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bot, ShieldAlert, Activity, CheckCircle2,
  ArrowRight, TrendingUp, AlertTriangle, Radio, Zap,
  ShieldCheck, Eye, ChevronRight,
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

// ── Stat Card ────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  trend?: string;
  trendUp?: boolean;
  alert?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, sub, icon: Icon, iconBg, iconColor, trend, trendUp, alert }) => (
  <div className={`glass-panel p-5 flex flex-col gap-4 ${alert ? 'ring-warn' : ''}`}>
    <div className="flex items-start justify-between">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      {trend && (
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
          trendUp === false
            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
            : trendUp === true
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-slate-800/60 text-slate-400 border border-white/[0.06]'
        }`}>
          {trend}
        </span>
      )}
    </div>
    <div>
      <div className="text-2xl font-extrabold font-mono text-white tabular-nums">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{title}</div>
      <div className="text-[10px] font-mono text-slate-600 mt-1">{sub}</div>
    </div>
  </div>
);

// ── Chart Tooltip ────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel-elevated px-3 py-2 text-[11px] font-mono">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="text-white font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const DONUT_COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444'];

// ── Dashboard ────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const [trendRange, setTrendRange] = useState<'24H' | '7D' | '30D'>('24H');
  const navigate = useNavigate();
  const { liveEvents } = useWebSocket();

  const { data: statsData } = useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: async () => (await apiClient.get('/dashboard/stats')).data.data,
    refetchInterval: 5000,
  });

  const { data: trendsData } = useQuery({
    queryKey: ['security_trends', trendRange],
    queryFn: async () => (await apiClient.get(`/dashboard/security-trends?range_view=${trendRange}`)).data.data,
  });

  const { data: riskData } = useQuery({
    queryKey: ['risk_distribution'],
    queryFn: async () => (await apiClient.get('/dashboard/risk-distribution')).data.data,
  });

  const { data: riskyAgents } = useQuery({
    queryKey: ['top_risky_agents'],
    queryFn: async () => (await apiClient.get('/dashboard/top-risky-agents')).data.data,
  });

  const { data: pendingApprovals } = useQuery({
    queryKey: ['approvals_pending'],
    queryFn: async () => (await apiClient.get('/approvals?status_filter=PENDING')).data.data,
  });

  const stats = statsData || {
    active_agents: 4, actions_today: 4281, blocked_today: 47,
    pending_approvals: 3, open_incidents: 2, security_score: 96,
  };

  const pieData = riskData
    ? [
        { name: 'Low', value: riskData.low || 1 },
        { name: 'Medium', value: riskData.medium || 0 },
        { name: 'High', value: riskData.high || 0 },
        { name: 'Critical', value: riskData.critical || 0 },
      ]
    : [{ name: 'Low', value: 85 }, { name: 'Medium', value: 10 }, { name: 'High', value: 4 }, { name: 'Critical', value: 1 }];

  const totalEvents = pieData.reduce((a, c) => a + c.value, 0);

  return (
    <div className="space-y-6">

      {/* ── 1. Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-white tracking-tight">Security Control Center</h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              LIVE SOC
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time policy enforcement, AI agent governance, and threat mitigation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/live-monitor')}
            className="btn-secondary text-[11px]"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            Live Monitor
          </button>
          <button
            onClick={() => navigate('/security-tests')}
            className="btn-primary text-[11px]"
          >
            <Zap className="w-3.5 h-3.5" />
            Security Lab
          </button>
        </div>
      </div>

      {/* ── 2. Security Score Gauge ── */}
      <SecurityScoreGauge
        score={stats.security_score}
        activeAgents={stats.active_agents}
        activePolicies={5}
        totalTools={10}
      />

      {/* ── 3. Stat Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active AI Agents"
          value={stats.active_agents}
          sub="Autonomous models governed"
          icon={Bot}
          iconBg="bg-cyan-500/10"
          iconColor="text-cyan-400"
          trend="+2 fleet"
          trendUp={true}
        />
        <StatCard
          title="Actions Processed"
          value={stats.actions_today.toLocaleString()}
          sub="Total executions today"
          icon={Activity}
          iconBg="bg-indigo-500/10"
          iconColor="text-indigo-400"
          trend="+18% rate"
          trendUp={true}
        />
        <StatCard
          title="Blocked Actions"
          value={stats.blocked_today}
          sub="Policy & permission violations"
          icon={ShieldAlert}
          iconBg="bg-red-500/10"
          iconColor="text-red-400"
          trend={`+7 today`}
          trendUp={false}
          alert={stats.blocked_today > 0}
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pending_approvals}
          sub="Requires human authorization"
          icon={CheckCircle2}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-400"
          trend="Attention"
          trendUp={false}
          alert={stats.pending_approvals > 0}
        />
      </div>

      {/* ── 4. Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Activity Chart */}
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Security Activity Trends</h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono">Allowed executions vs. blocked violations</p>
            </div>

            <div className="inline-flex rounded-xl bg-dark-900/80 p-1 border border-white/[0.05]">
              {(['24H', '7D', '30D'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTrendRange(r)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-mono transition-all ${
                    trendRange === r
                      ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/25'
                      : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendsData || []} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gradAllowed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="timestamp" tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="allowed" name="Allowed" stroke="#10b981" strokeWidth={2} fill="url(#gradAllowed)" />
                <Area type="monotone" dataKey="blocked" name="Blocked" stroke="#ef4444" strokeWidth={2} fill="url(#gradBlocked)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mt-3 pt-3 border-t border-white/[0.04]">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <span className="w-3 h-0.5 bg-emerald-400 rounded" />
              Allowed Actions
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <span className="w-3 h-0.5 bg-red-400 rounded" />
              Blocked Violations
            </div>
          </div>
        </div>

        {/* Live Security Feed */}
        <div className="glass-panel p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="relative flex">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping absolute opacity-75" />
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
              </span>
              <h3 className="text-sm font-bold text-white">Live Security Stream</h3>
            </div>
            <span className="section-label">WebSocket</span>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto">
            {liveEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-36 text-center">
                <Radio className="w-6 h-6 text-slate-700 mb-2" />
                <p className="text-[11px] font-mono text-slate-600">Listening for agent actions...</p>
              </div>
            ) : (
              liveEvents.slice(0, 6).map((evt, idx) => (
                <div
                  key={idx}
                  onClick={() => evt.data.execution_id && navigate(`/executions/${evt.data.execution_id}`)}
                  className="p-3 rounded-xl bg-dark-800/60 border border-white/[0.04] hover:border-white/[0.08] cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                    <span className="font-semibold text-white text-xs">{evt.data.agent_name || 'Agent'}</span>
                    <span>{evt.data.timestamp ? evt.data.timestamp.slice(11, 19) : 'Now'}</span>
                  </div>
                  <div className="text-[11px] text-slate-300 truncate">{evt.data.action_name} via {evt.data.tool_name}</div>
                  <div className="flex items-center justify-between mt-1.5">
                    <StatusBadge status={evt.data.decision || 'PROCESSED'} />
                    <span className="text-[10px] font-mono text-slate-600">Risk: {evt.data.risk_score ?? 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => navigate('/live-monitor')}
            className="mt-3 w-full btn-secondary justify-center text-[11px] py-2"
          >
            Open Full Monitor
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* ── 5. Risk + Agents Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Donut Chart */}
        <div className="glass-panel p-6">
          <h3 className="text-sm font-bold text-white mb-0.5">Risk Distribution</h3>
          <p className="text-[11px] font-mono text-slate-500 mb-4">Categorized agent action telemetry</p>

          <div className="relative h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={70} paddingAngle={3} dataKey="value" stroke="none">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center pointer-events-none">
              <div className="text-xl font-extrabold font-mono text-white">{totalEvents}</div>
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wide">Total</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 pt-4 border-t border-white/[0.04]">
            {[
              { label: 'LOW',      color: 'bg-emerald-400', val: pieData[0].value },
              { label: 'MEDIUM',   color: 'bg-amber-400',   val: pieData[1].value },
              { label: 'HIGH',     color: 'bg-orange-400',  val: pieData[2].value },
              { label: 'CRITICAL', color: 'bg-red-400',     val: pieData[3].value },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className={`w-2 h-2 rounded-full ${item.color}`} />
                  {item.label}
                </div>
                <span className="text-slate-300 font-semibold">{item.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risky Agents Table */}
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Agents Requiring Attention</h3>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5">Blocked action telemetry per registered agent</p>
            </div>
            <button
              onClick={() => navigate('/agents')}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              View Fleet <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {['Agent', 'Risk', 'Blocked', 'Score', 'Status', ''].map((h) => (
                    <th key={h} className="py-2 px-2.5 section-label">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(riskyAgents || []).map((agent: any) => (
                  <tr key={agent.agent_id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-dark-700 border border-white/[0.06] flex items-center justify-center">
                          <Bot className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <span className="text-xs font-semibold text-white">{agent.agent_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2.5"><RiskBadge level={agent.risk_level} size="sm" /></td>
                    <td className="py-3 px-2.5 font-mono text-xs text-red-400 font-semibold">{agent.blocked_actions}</td>
                    <td className="py-3 px-2.5 font-mono text-xs text-slate-200 font-bold">{agent.security_score}/100</td>
                    <td className="py-3 px-2.5"><StatusBadge status={agent.status} /></td>
                    <td className="py-3 px-2.5 text-right">
                      <button
                        onClick={() => navigate(`/agents/${agent.agent_id}`)}
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <Eye className="w-3 h-3" /> Inspect
                      </button>
                    </td>
                  </tr>
                ))}
                {(!riskyAgents || riskyAgents.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center">
                      <ShieldCheck className="w-8 h-8 text-emerald-400/30 mx-auto mb-2" />
                      <p className="text-xs font-mono text-slate-600">All agents operating within policy bounds</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 6. Pending Approvals Alert ── */}
      {pendingApprovals && pendingApprovals.length > 0 && (
        <div className="glass-panel-warn p-5 ring-warn flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {pendingApprovals.length} High-Risk Action{pendingApprovals.length > 1 ? 's' : ''} Require Human Approval
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Autonomous agents have requested operations exceeding automated policy limits.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/approvals')}
            className="btn-primary shrink-0 bg-amber-500 hover:bg-amber-400 text-dark-950 shadow-glow-amber"
          >
            Review Approval Inbox
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
};
