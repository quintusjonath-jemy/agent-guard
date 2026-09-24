import React from 'react';
import { Settings as SettingsIcon, Shield, Database, Bell, Lock, Server } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Settings: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Platform Governance & Security Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          System policies, RBAC access configuration, and audit retention settings.
        </p>
      </div>

      <div className="space-y-4">
        {/* User Identity Section */}
        <div className="glass-panel p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Active Administrator Identity</h3>
              <p className="text-xs text-slate-400">Authenticated user profile and permissions.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="bg-dark-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase">NAME</span>
              <div className="font-bold text-white mt-0.5">{user?.name}</div>
            </div>
            <div className="bg-dark-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase">EMAIL</span>
              <div className="font-bold text-cyan-400 mt-0.5">{user?.email}</div>
            </div>
            <div className="bg-dark-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase">ROLE</span>
              <div className="font-bold text-emerald-400 mt-0.5">{user?.role}</div>
            </div>
          </div>
        </div>

        {/* Security & System Architecture */}
        <div className="glass-panel p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-dark-950 text-emerald-400 border border-slate-800">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Engine Architecture Configuration</h3>
              <p className="text-xs text-slate-400">Deterministic security controls status.</p>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-dark-950 border border-slate-800">
              <span className="text-slate-300">Deterministic Least Privilege Engine</span>
              <span className="text-emerald-400 font-bold">ENFORCED</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-dark-950 border border-slate-800">
              <span className="text-slate-300">Sensitive Data (DLP) Regex Scanner</span>
              <span className="text-emerald-400 font-bold">ACTIVE (8 Patterns)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-dark-950 border border-slate-800">
              <span className="text-slate-300">Sliding Window Rate Limiter (Redis)</span>
              <span className="text-emerald-400 font-bold">5 REQ / MIN ON AUTH</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-dark-950 border border-slate-800">
              <span className="text-slate-300">WebSocket Live Event Broadcaster</span>
              <span className="text-cyan-400 font-bold">STREAMING ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
