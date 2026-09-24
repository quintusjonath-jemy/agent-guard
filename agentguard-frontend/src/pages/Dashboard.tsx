import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  ShieldAlert,
  Activity,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Lock,
  Radio,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import apiClient from '../api/client';
import { MetricCard } from '../components/MetricCard';
import { SecurityScoreGauge } from '../components/SecurityScoreGauge';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';
import { useWebSocket } from '../hooks/useWebSocket';

export const Dashboard: React.FC = () => {
  const [trendRange, setTrendRange] = useState<'24H' | '7D' | '30D'>('24H');
  const navigate = useNavigate();
  const { liveEvents } = useWebSocket();

  // 1. Dashboard Stats Query
  const { data: statsData } = useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/stats');
      return res.data.data;
    },
    refetchInterval: 5000,
  });

  // 2. Security Trends Query
  const { data: trendsData } = useQuery({
    queryKey: ['security_trends', trendRange],
    queryFn: async () => {
      const res = await apiClient.get(`/dashboard/security-trends?range_view=${trendRange}`);
      return res.data.data;
    },
  });

  // 3. Risk Distribution Query
  const { data: riskData } = useQuery({
    queryKey: ['risk_distribution'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/risk-distribution');
      return res.data.data;
    },
  });

  // 4. Risky Agents Leaderboard
  const { data: riskyAgents } = useQuery({
    queryKey: ['top_risky_agents'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/top-risky-agents');
      return res.data.data;
    },
  });

  // 5. Heatmap Matrix
  const { data: heatmapData } = useQuery({
    queryKey: ['risk_heatmap'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/risk-heatmap');
      return res.data.data;
    },
  });

  // 6. Pending Approvals
  const { data: pendingApprovals } = useQuery({
    queryKey: ['approvals_pending'],
    queryFn: async () => {
      const res = await apiClient.get('/approvals?status_filter=PENDING');
      return res.data.data;
    },
  });

  const stats = statsData || {
    active_agents: 4,
    actions_today: 4281,
    blocked_today: 47,
    pending_approvals: 3,
    open_incidents: 2,
    security_score: 96,
  };

  const donutColors = ['#10b981', '#f59e0b', '#f97316', '#ef4444'];
  const pieData = riskData
    ? [
        { name: 'Low', value: riskData.low || 1 },
        { name: 'Medium', value: riskData.medium || 0 },
        { name: 'High', value: riskData.high || 0 },
        { name: 'Critical', value: riskData.critical || 0 },
      ]
    : [
        { name: 'Low', value: 85 },
        { name: 'Medium', value: 10 },
        { name: 'High', value: 4 },
        { name: 'Critical', value: 1 },
      ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Greeting & Date */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Security Control Center
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono">
              LIVE SOC
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time policy enforcement, AI agent governance, and threat mitigation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/security-tests')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold font-mono tracking-wide shadow-glow-teal transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Launch Security Lab</span>
          </button>
        </div>
      </div>

      {/* 2. Hero Security Score Gauge */}
      <SecurityScoreGauge
        score={stats.security_score}
        activeAgents={stats.active_agents}
        activePolicies={5}
        totalTools={10}
      />

      {/* 3. Four Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Agents"
          value={stats.active_agents}
          subtext="Autonomous models governed"
          icon={Bot}
          iconColor="text-cyan-400"
          trend="+2 fleet"
        />
        <MetricCard
          title="Actions Processed"
          value={stats.actions_today.toLocaleString()}
          subtext="Today's total executions"
          icon={Activity}
          iconColor="text-blue-400"
          trend="+18% rate"
        />
        <MetricCard
          title="Blocked Actions"
          value={stats.blocked_today}
          subtext="Policy & permission violations"
          icon={ShieldAlert}
          iconColor="text-red-400"
          trend="+7 today"
          trendPositive={false}
          highlight={stats.blocked_today > 0}
        />
        <MetricCard
          title="Pending Approvals"
          value={stats.pending_approvals}
          subtext="Requires human authorization"
          icon={CheckCircle2}
          iconColor="text-amber-400"
          trend="Attention"
          trendPositive={false}
          highlight={stats.pending_approvals > 0}
        />
      </div>

      {/* 4. Two Column Layout: Security Activity Trends + Live Security Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Activity Chart (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Security Activity Over Time
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Allowed executions vs blocked policy violations
              </p>
            </div>

            <div className="inline-flex rounded-lg bg-dark-950 p-1 border border-slate-800 text-xs font-mono">
              {(['24H', '7D', '30D'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTrendRange(r)}
                  className={`px-3 py-1 rounded-md transition-all ${
                    trendRange === r
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendsData || []}>
                <defs>
                  <linearGradient id="colorAllowed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} fontStyle="monospace" />
                <YAxis stroke="#64748b" fontSize={10} fontStyle="monospace" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0d14',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="allowed"
                  name="Allowed Actions"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAllowed)"
                />
                <Area
                  type="monotone"
                  dataKey="blocked"
                  name="Blocked Policy Violations"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorBlocked)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Security Feed (1 col) */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  Live Security Stream
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                WEBSOCKETS
              </span>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {liveEvents.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 font-mono border border-dashed border-slate-800 rounded-lg">
                  Listening for agent actions...
                </div>
              ) : (
                liveEvents.slice(0, 5).map((evt, idx) => {
                  const isBlocked = evt.data.decision === 'BLOCKED';
                  return (
                    <div
                      key={idx}
                      onClick={() => evt.data.execution_id && navigate(`/executions/${evt.data.execution_id}`)}
                      className="p-3 rounded-lg bg-dark-950/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all text-left"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                        <span className="font-bold text-white">{evt.data.agent_name || 'Agent'}</span>
                        <span>{evt.data.timestamp ? evt.data.timestamp.slice(11, 19) : 'Just now'}</span>
                      </div>
                      <div className="text-xs text-slate-300 font-medium truncate">
                        {evt.data.action_name} ({evt.data.tool_name})
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60">
                        <StatusBadge status={evt.data.decision || 'PROCESSED'} />
                        <span className="text-[10px] font-mono text-slate-400">
                          Risk: {evt.data.risk_score || 0}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/live-monitor')}
            className="w-full mt-4 py-2 rounded-lg bg-dark-950 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Open Fullscreen Monitor</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* 5. Second Row: Donut Risk Distribution + Top Risky Agents Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Donut (1 col) */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight mb-1">
              Risk Level Distribution
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Categorized risk telemetry of agent actions
            </p>

            <div className="h-48 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0d14',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-bold font-mono text-white">
                  {pieData.reduce((acc, curr) => acc + curr.value, 0)}
                </span>
                <span className="text-[9px] font-mono text-slate-400 uppercase">EVENTS</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800/80 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-slate-400">LOW</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-slate-400">MEDIUM</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-400"></span>
              <span className="text-slate-400">HIGH</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              <span className="text-slate-400">CRITICAL</span>
            </div>
          </div>
        </div>

        {/* Top Risky Agents Leaderboard (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Agents Requiring Attention
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Anomaly tracking and blocked action telemetry per agent
              </p>
            </div>
            <button
              onClick={() => navigate('/agents')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              View Fleet →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-3">Agent</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-3">Blocked Actions</th>
                  <th className="py-2.5 px-3">Security Score</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {(riskyAgents || []).map((agent: any) => (
                  <tr key={agent.agent_id} className="hover:bg-dark-850/60 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                      <Bot className="w-4 h-4 text-cyan-400" />
                      <span>{agent.agent_name}</span>
                    </td>
                    <td className="py-3 px-3">
                      <RiskBadge level={agent.risk_level} size="sm" />
                    </td>
                    <td className="py-3 px-3 font-mono text-red-400 font-medium">
                      {agent.blocked_actions} blocked
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-200">
                      {agent.security_score} / 100
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={agent.status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => navigate(`/agents/${agent.agent_id}`)}
                        className="text-xs text-cyan-400 hover:underline font-mono"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 6. Pending Approvals Quick Review Bar */}
      {pendingApprovals && pendingApprovals.length > 0 && (
        <div className="glass-panel-elevated p-6 border-amber-500/30 bg-amber-950/20 shadow-glow-amber">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">
                  High-Risk Actions Require Human Approval ({pendingApprovals.length})
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Autonomous agents have requested operations that exceed automated policy limits.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/approvals')}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-dark-950 font-bold text-xs font-mono tracking-wide shadow-md transition-all shrink-0"
            >
              Open Approval Inbox ({pendingApprovals.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
