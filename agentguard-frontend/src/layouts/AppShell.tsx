import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  Radio,
  ScrollText,
  Bot,
  Wrench,
  Lock,
  CheckCircle2,
  FlaskConical,
  AlertTriangle,
  FileSpreadsheet,
  Workflow,
  Key,
  Settings as SettingsIcon,
  Search,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { CommandPalette } from '../components/CommandPalette';

export const AppShell: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isConnected } = useWebSocket();
  const location = useLocation();

  const navSections = [
    {
      label: 'OVERVIEW',
      items: [{ path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      label: 'LIVE MONITOR',
      items: [
        { path: '/live-monitor', label: 'Live Monitor', icon: Radio, live: true },
        { path: '/executions', label: 'Executions', icon: ScrollText },
      ],
    },
    {
      label: 'GOVERNANCE',
      items: [
        { path: '/agents', label: 'AI Agents', icon: Bot },
        { path: '/tools', label: 'Tools Registry', icon: Wrench },
        { path: '/policies', label: 'Policies', icon: Lock },
        { path: '/approvals', label: 'Approval Inbox', icon: CheckCircle2 },
      ],
    },
    {
      label: 'SECURITY',
      items: [
        { path: '/security-tests', label: 'Security Test Lab', icon: FlaskConical },
        { path: '/incidents', label: 'SOC Incidents', icon: AlertTriangle },
        { path: '/audit-logs', label: 'Audit Logs', icon: FileSpreadsheet },
      ],
    },
    {
      label: 'SYSTEM',
      items: [
        { path: '/integrations', label: 'Integrations & n8n', icon: Workflow },
        { path: '/api-keys', label: 'API Keys', icon: Key },
        { path: '/settings', label: 'Settings', icon: SettingsIcon },
      ],
    },
  ];

  const getPageTitle = () => {
    const p = location.pathname;
    if (p.startsWith('/dashboard')) return 'Executive Security Overview';
    if (p.startsWith('/live-monitor')) return 'Live SOC Operations Monitor';
    if (p.startsWith('/executions')) return 'Execution & Action Inspector';
    if (p.startsWith('/agents')) return 'Autonomous AI Agent Fleet';
    if (p.startsWith('/tools')) return 'Governed Tool Registry';
    if (p.startsWith('/policies')) return 'Security & Compliance Policy Builder';
    if (p.startsWith('/approvals')) return 'Human-in-the-Loop Approval Center';
    if (p.startsWith('/security-tests')) return 'Agent Attack & Security Test Lab';
    if (p.startsWith('/incidents')) return 'Incident Response & SOC Center';
    if (p.startsWith('/audit-logs')) return 'Immutable Security Audit Logs';
    if (p.startsWith('/integrations')) return 'AI Integrations & n8n Webhook Bridge';
    if (p.startsWith('/api-keys')) return 'Developer API Key Management';
    if (p.startsWith('/settings')) return 'Platform Governance Settings';
    return 'AgentGuard Security Platform';
  };

  return (
    <div className="flex h-screen bg-dark-950 text-slate-100 overflow-hidden">
      {/* 1. Sidebar */}
      <aside
        className={`flex flex-col border-r border-slate-800/80 bg-dark-950/95 backdrop-blur-xl transition-all duration-300 z-30 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-glow-teal shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight text-white font-mono">
                  Agent<span className="text-cyan-400">Guard</span>
                </span>
                <span className="text-[10px] tracking-wider uppercase font-mono text-cyan-400/70 -mt-1">
                  AI Firewall Platform
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-dark-850 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1.5">
                  {section.label}
                </div>
              )}
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={itemIdx}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group relative ${
                        isActive
                          ? 'bg-cyan-500/10 text-cyan-300 font-semibold border-l-2 border-cyan-400 shadow-[inset_0_1px_0_rgba(6,182,212,0.1)]'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-dark-850/80'
                      }`
                    }
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    {!isCollapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}
                    {!isCollapsed && item.live && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Card */}
        <div className="p-3 border-t border-slate-800/80 bg-dark-900/60">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs font-mono font-bold shrink-0">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AG'}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium text-white truncate">
                    {user?.name || 'Administrator'}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400/80 truncate">
                    {user?.role || 'SUPER_ADMIN'}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-dark-850 rounded-md transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800/80 bg-dark-950/80 backdrop-blur-md px-6 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-3.5">
            {/* Quick Search Shortcut */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-900 border border-slate-800 text-xs text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-all font-mono"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>Search platform...</span>
              <kbd className="px-1 py-0.5 rounded bg-dark-950 border border-slate-700 text-[10px] text-slate-400 ml-2">
                Ctrl+K
              </kbd>
            </button>

            {/* Live Status Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              ></span>
              <span>{isConnected ? 'SYSTEM SECURE' : 'RECONNECTING'}</span>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-lg bg-dark-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            </button>
          </div>
        </header>

        {/* Page Outlet */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};
