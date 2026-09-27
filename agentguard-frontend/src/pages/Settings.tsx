import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  LogOut,
  Cpu,
  Database,
  RefreshCw,
  Play,
  FileDown,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Layers,
  Activity
} from 'lucide-react';
import apiClient from '../api/client';
import { useQuery } from '@tanstack/react-query';

interface TaskStatusInfo {
  taskId: string;
  name: string;
  status: string;
  ready: boolean;
  result?: any;
  error?: string;
}

export const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);

  // Background Worker Task state
  const [activeTask, setActiveTask] = useState<TaskStatusInfo | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [cleanBeforeSeed, setCleanBeforeSeed] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<number>(1);

  // Fetch agents for background scan selector
  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => apiClient.get('/agents').then(r => r.data.data),
  });

  // Poll active task status
  const pollTask = async (taskId: string, name: string) => {
    try {
      const res = await apiClient.get(`/system/tasks/${taskId}`);
      const data = res.data.data;
      setActiveTask({
        taskId,
        name,
        status: data.status,
        ready: data.ready,
        result: data.result,
        error: data.error,
      });

      if (!data.ready) {
        setTimeout(() => pollTask(taskId, name), 1500);
      }
    } catch (err: any) {
      setActiveTask({
        taskId,
        name,
        status: 'FAILED',
        ready: true,
        error: err.response?.data?.detail || err.message,
      });
    }
  };

  // Dispatchers
  const handleSeedDemo = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    try {
      const res = await apiClient.post('/system/seed-demo', { clean: cleanBeforeSeed });
      setSeedResult(`Seeded ${res.data.data.executions_seeded} executions, ${res.data.data.approvals_seeded} approvals, ${res.data.data.incidents_seeded} incidents.`);
    } catch (err: any) {
      setSeedResult(`Failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDispatchScan = async () => {
    try {
      const res = await apiClient.post('/system/tasks/security-scan', { agent_id: selectedAgentId });
      const { task_id } = res.data.data;
      setActiveTask({ taskId: task_id, name: 'Async Red-Team Security Scan', status: 'PENDING', ready: false });
      pollTask(task_id, 'Async Red-Team Security Scan');
    } catch (err: any) {
      alert(`Error dispatching scan: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleDispatchSocSummary = async () => {
    try {
      const res = await apiClient.post('/system/tasks/soc-summary');
      const { task_id } = res.data.data;
      setActiveTask({ taskId: task_id, name: 'Executive SOC Telemetry Aggregation', status: 'PENDING', ready: false });
      pollTask(task_id, 'Executive SOC Telemetry Aggregation');
    } catch (err: any) {
      alert(`Error dispatching task: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleDispatchAuditExport = async () => {
    try {
      const res = await apiClient.post('/system/tasks/export-audit', { format: 'json', limit: 50 });
      const { task_id } = res.data.data;
      setActiveTask({ taskId: task_id, name: 'Compliance Audit Log Export (JSON)', status: 'PENDING', ready: false });
      pollTask(task_id, 'Compliance Audit Log Export (JSON)');
    } catch (err: any) {
      alert(`Error dispatching export: ${err.response?.data?.detail || err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-[850px] mx-auto animate-fade-in space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold text-[#F5F5F5]">Platform Operations & Settings</h1>
        <p className="text-[13px] text-[#6F6F6F] mt-1">Manage system workers, demo telemetry, preferences, and security access</p>
      </div>

      {/* ── Background Workers & Demo Data (Phase 9) ── */}
      <div className="card p-6 border-brand/30 bg-gradient-to-b from-[#161616] to-[#121212]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-[#F5F5F5]">Celery Background Workers & Demo Telemetry</h2>
              <p className="text-[11px] text-[#6F6F6F]">Phase 9: Asynchronous red-team scans, SOC metric aggregation, and demo telemetry</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isAdmin && (
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Admin Role Required
              </span>
            )}
            <span className="badge-success text-[10px] uppercase font-mono">Worker Online</span>
          </div>
        </div>

        {/* Action Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {/* Seeder Box */}
          <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-[13px] font-medium text-[#F5F5F5] mb-1">
                <Database className="w-3.5 h-3.5 text-brand" />
                <span>Realistic Demo Telemetry Seeder</span>
              </div>
              <p className="text-[11px] text-[#8E8E8E] leading-relaxed mb-3">
                Populates 15+ executions across FinanceBot, SupportBot, HR, and IT agents, including approvals and DLP incidents.
              </p>
              <label className="flex items-center gap-2 text-[11px] text-[#A1A1A1] cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={cleanBeforeSeed}
                  disabled={!isAdmin}
                  onChange={(e) => setCleanBeforeSeed(e.target.checked)}
                  className="rounded bg-[#2A2A2A] border-[#3A3A3A] text-brand focus:ring-0"
                />
                <span>Reset previous executions before seeding</span>
              </label>
            </div>
            <div>
              <button
                onClick={handleSeedDemo}
                disabled={isSeeding || !isAdmin}
                title={!isAdmin ? 'Admin role required' : ''}
                className="btn-primary btn-sm w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
                <span>{isSeeding ? 'Seeding Telemetry...' : 'Seed Demo Data'}</span>
              </button>
              {seedResult && (
                <div className="mt-2 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                  {seedResult}
                </div>
              )}
            </div>
          </div>

          {/* Celery Task Dispatch Box */}
          <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-[13px] font-medium text-[#F5F5F5] mb-1">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Async Celery Worker Tasks</span>
              </div>
              <p className="text-[11px] text-[#8E8E8E] leading-relaxed mb-3">
                Dispatch non-blocking tasks to the Celery worker queue via Redis transport.
              </p>
              <div className="mb-3">
                <label className="text-[11px] text-[#6F6F6F] block mb-1">Target Agent for Scan</label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(Number(e.target.value))}
                  className="w-full bg-[#121212] border border-[#2A2A2A] rounded-lg px-2.5 py-1 text-[12px] text-[#F5F5F5]"
                >
                  {agents.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.provider})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleDispatchScan}
                disabled={!isAdmin}
                className="btn-secondary btn-xs flex items-center justify-center gap-1 text-[11px] disabled:opacity-50"
                title={!isAdmin ? 'Admin role required' : 'Run 10 red team attack scenarios in background'}
              >
                <Play className="w-3 h-3 text-rose-400" /> Red Team
              </button>
              <button
                onClick={handleDispatchSocSummary}
                className="btn-secondary btn-xs flex items-center justify-center gap-1 text-[11px]"
                title="Aggregate executive telemetry"
              >
                <Sparkles className="w-3 h-3 text-amber-400" /> SOC Stats
              </button>
              <button
                onClick={handleDispatchAuditExport}
                disabled={!isAdmin}
                className="btn-secondary btn-xs flex items-center justify-center gap-1 text-[11px] disabled:opacity-50"
                title={!isAdmin ? 'Admin role required' : 'Export compliance audit records'}
              >
                <FileDown className="w-3 h-3 text-cyan-400" /> Export
              </button>
            </div>
          </div>
        </div>

        {/* Live Task Inspector Card */}
        {activeTask && (
          <div className="mt-4 p-4 rounded-xl bg-[#121212] border border-[#2A2A2A] animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#6F6F6F] font-mono">TASK ID: {activeTask.taskId.slice(0, 16)}...</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  activeTask.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' :
                  activeTask.status === 'FAILED' ? 'bg-rose-500/20 text-rose-400' :
                  'bg-amber-500/20 text-amber-400 animate-pulse'
                }`}>
                  {activeTask.status}
                </span>
              </div>
              <span className="text-[11px] text-[#A1A1A1] font-mono">{activeTask.name}</span>
            </div>
            {activeTask.result && (
              <pre className="text-[11px] font-mono text-[#D4D4D4] bg-[#0A0A0A] p-3 rounded-lg border border-[#222] max-h-[140px] overflow-auto">
                {JSON.stringify(activeTask.result, null, 2)}
              </pre>
            )}
            {activeTask.error && (
              <div className="text-[11px] font-mono text-rose-400 bg-rose-500/10 p-2 rounded">
                Error: {activeTask.error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <User className="w-4 h-4 text-[#6F6F6F]" />
          <h2 className="text-[14px] font-semibold text-[#F5F5F5]">Profile</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Name</label>
            <input className="input-field" defaultValue={user?.name || ''} placeholder="Your name" />
          </div>
          <div>
            <label className="input-label">Email</label>
            <input className="input-field" defaultValue={user?.email || ''} readOnly disabled />
          </div>
          <div>
            <label className="input-label">Role</label>
            <input className="input-field" value={user?.role?.replace('_', ' ') || '—'} readOnly disabled />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button className="btn-primary btn-sm">Save changes</button>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <Bell className="w-4 h-4 text-[#6F6F6F]" />
          <h2 className="text-[14px] font-semibold text-[#F5F5F5]">Notifications</h2>
        </div>
        <div className="space-y-4">
          {[
            { key: 'notif', label: 'Live event notifications', desc: 'Browser notifications for blocked actions', state: notifications, set: setNotifications },
            { key: 'email', label: 'Email alerts', desc: 'Email alerts for critical security incidents', state: emailAlerts, set: setEmailAlerts },
          ].map(s => (
            <div key={s.key} className="flex items-center justify-between py-1">
              <div>
                <div className="text-[13px] text-[#F5F5F5]">{s.label}</div>
                <div className="text-[11px] text-[#6F6F6F] mt-0.5">{s.desc}</div>
              </div>
              <button
                className={`w-10 h-6 rounded-full transition-all relative ${s.state ? 'bg-brand' : 'bg-[#2A2A2A]'}`}
                onClick={() => s.set(!s.state)}
                role="switch"
                aria-checked={s.state}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${s.state ? 'left-5' : 'left-1'}`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <Shield className="w-4 h-4 text-[#6F6F6F]" />
          <h2 className="text-[14px] font-semibold text-[#F5F5F5]">Security</h2>
        </div>
        <div>
          <label className="input-label">Current Password</label>
          <input className="input-field mb-3" type="password" placeholder="••••••••" />
          <label className="input-label">New Password</label>
          <input className="input-field mb-3" type="password" placeholder="••••••••" />
          <label className="input-label">Confirm Password</label>
          <input className="input-field mb-4" type="password" placeholder="••••••••" />
          <button className="btn-primary btn-sm">Update password</button>
        </div>
      </div>

      {/* Sign out */}
      <div className="card p-5 flex items-center justify-between" style={{ borderColor: 'rgba(224,106,98,0.15)' }}>
        <div>
          <div className="text-[13px] font-medium text-[#F5F5F5]">Sign out</div>
          <div className="text-[12px] text-[#6F6F6F] mt-0.5">End your current session</div>
        </div>
        <button onClick={logout} className="btn-danger btn-sm">
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </div>
    </div>
  );
};
