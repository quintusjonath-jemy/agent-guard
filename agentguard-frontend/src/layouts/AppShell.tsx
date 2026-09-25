import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield, LayoutDashboard, Radio, ScrollText, Bot, Wrench,
  Lock, CheckCircle2, FlaskConical, AlertTriangle, FileText,
  Plug, Key, Settings as SettingsIcon, Search, Bell, LogOut,
  ChevronLeft, ChevronRight, Menu, X, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { CommandPalette } from '../components/CommandPalette';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: boolean;
  live?: boolean;
}
interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Monitor',
    items: [
      { path: '/live-monitor', label: 'Live Monitor', icon: Radio, live: true },
      { path: '/executions',   label: 'Executions',   icon: ScrollText },
    ],
  },
  {
    label: 'Governance',
    items: [
      { path: '/agents',    label: 'AI Agents',  icon: Bot },
      { path: '/tools',     label: 'Tools',       icon: Wrench },
      { path: '/policies',  label: 'Policies',    icon: Lock },
      { path: '/approvals', label: 'Approvals',   icon: CheckCircle2, badge: true },
    ],
  },
  {
    label: 'Security',
    items: [
      { path: '/security-tests', label: 'Security Tests', icon: FlaskConical },
      { path: '/incidents',      label: 'Incidents',       icon: AlertTriangle },
      { path: '/audit-logs',     label: 'Audit Logs',      icon: FileText },
    ],
  },
  {
    label: 'System',
    items: [
      { path: '/integrations', label: 'Integrations', icon: Plug },
      { path: '/api-keys',     label: 'API Keys',      icon: Key },
      { path: '/settings',     label: 'Settings',      icon: SettingsIcon },
    ],
  },
];

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export const AppShell: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected, liveEvents } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);

  // Track new events as notifications
  useEffect(() => {
    if (liveEvents.length > 0) {
      const last = liveEvents[0];
      if (last.data.decision === 'BLOCKED' || last.data.decision === 'FAILED') {
        setNotifications(n => Math.min(n + 1, 99));
      }
    }
  }, [liveEvents]);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const currentPageLabel = navSections.flatMap(s => s.items).find(i => location.pathname.startsWith(i.path))?.label ?? 'AgentGuard';

  const systemStatus = isConnected
    ? liveEvents.some(e => e.data.risk_level === 'CRITICAL') ? 'Security Event' : 'Operational'
    : 'Connecting...';

  const statusColor = systemStatus === 'Operational' ? '#35B77A' : systemStatus === 'Security Event' ? '#F04444' : '#D6A84F';

  const SidebarContent = ({ compact }: { compact?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-2.5 px-4 h-14 border-b border-[#2A2A2A] flex-shrink-0 ${compact ? 'justify-center px-0' : ''}`}>
        <div className="w-7 h-7 rounded-lg bg-[#153D34] border border-[#10A37F]/30 flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-brand" strokeWidth={2.5} />
        </div>
        {!compact && (
          <div>
            <div className="text-[14px] font-bold text-[#F5F5F5] tracking-tight leading-none">AgentGuard</div>
            <div className="text-[9px] text-[#6F6F6F] font-mono uppercase tracking-widest mt-0.5">AI Security Platform</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navSections.map((section) => (
          <div key={section.label}>
            {!compact && (
              <div className="nav-section-label">{section.label}</div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${isActive ? 'active' : ''} ${compact ? 'justify-center px-2' : ''}`}
                  title={compact ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!compact && <span className="flex-1">{item.label}</span>}
                  {!compact && item.live && (
                    <span className={`live-dot ${isConnected ? '' : 'gray'}`} />
                  )}
                  {!compact && item.badge && notifications > 0 && (
                    <span className="text-[10px] font-mono font-bold bg-[#F04444] text-white rounded-full w-4 h-4 flex items-center justify-center">
                      {notifications > 9 ? '9+' : notifications}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className={`border-t border-[#2A2A2A] p-3 flex-shrink-0 ${compact ? 'flex justify-center' : ''}`}>
        {compact ? (
          <button
            onClick={logout}
            className="w-8 h-8 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#6F6F6F] hover:text-[#F5F5F5] hover:bg-[#222] transition-all"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#153D34] border border-[#10A37F]/25 flex items-center justify-center text-brand text-[11px] font-bold flex-shrink-0">
              {user ? getInitials(user.name || user.email) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-[#F5F5F5] truncate leading-none">{user?.name || 'User'}</div>
              <div className="text-[10px] text-[#6F6F6F] font-mono mt-0.5 truncate">{user?.role?.replace('_', ' ')}</div>
            </div>
            <button
              onClick={logout}
              className="w-6 h-6 rounded-md flex items-center justify-center text-[#6F6F6F] hover:text-[#F5F5F5] hover:bg-[#1A1A1A] transition-all"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0D0D0D] overflow-hidden relative z-0">
      {/* Command Palette */}
      {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} />}

      {/* ── Desktop Sidebar ─────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 border-r border-[#2A2A2A] bg-[#111111] transition-all duration-200 ease-in-out ${
          collapsed ? 'w-14' : 'w-[220px]'
        }`}
      >
        <SidebarContent compact={collapsed} />
      </aside>

      {/* ── Collapse toggle ──────────────────────────── */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="hidden md:flex absolute top-[50px] z-30 w-5 h-5 items-center justify-center rounded-full bg-[#1A1A1A] border border-[#2A2A2A] text-[#6F6F6F] hover:text-[#F5F5F5] transition-all"
        style={{ left: collapsed ? '46px' : '208px' }}
        aria-label="Toggle sidebar"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* ── Mobile overlay ───────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[220px] bg-[#111111] border-r border-[#2A2A2A] z-10 animate-slide-right">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main area ────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between h-14 border-b border-[#2A2A2A] bg-[#0D0D0D] px-4 flex-shrink-0 z-20">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-[#6F6F6F] hover:text-[#F5F5F5] hover:bg-[#1A1A1A] transition-all"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-4 h-4" />
            </button>
            <h1 className="text-[14px] font-semibold text-[#F5F5F5]">{currentPageLabel}</h1>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Search trigger */}
            <button
              onClick={() => setCmdOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-[#6F6F6F] hover:text-[#A1A1A1] transition-all text-[12px]"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
              <span className="font-mono text-[10px] ml-1 opacity-60">⌘K</span>
            </button>

            {/* Status pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A]">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
              <span className="text-[11px] text-[#A1A1A1] font-mono">{systemStatus}</span>
            </div>

            {/* Notifications */}
            <button
              onClick={() => setNotifications(0)}
              className="relative w-8 h-8 flex items-center justify-center rounded-lg text-[#6F6F6F] hover:text-[#F5F5F5] hover:bg-[#1A1A1A] transition-all"
            >
              <Bell className="w-4 h-4" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#F04444] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {notifications > 9 ? '9+' : notifications}
                </span>
              )}
            </button>

            {/* Avatar */}
            <div className="w-7 h-7 rounded-lg bg-[#153D34] border border-[#10A37F]/25 flex items-center justify-center text-brand text-[10px] font-bold">
              {user ? getInitials(user.name || user.email) : 'U'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
