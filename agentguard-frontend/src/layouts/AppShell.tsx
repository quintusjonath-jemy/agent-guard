import React, { useState, useEffect, useCallback } from 'react';
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
  Zap,
  Activity,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { CommandPalette } from '../components/CommandPalette';

// ─── Navigation Structure ───────────────────────────────────
interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  description?: string;
  live?: boolean;
  badge?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}
const navSections: NavSection[] = [
  {
    label: 'OVERVIEW',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Security control center' },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { path: '/live-monitor', label: 'Live Monitor', icon: Radio, live: true, description: 'Real-time SOC feed' },
      { path: '/executions', label: 'Executions', icon: ScrollText, description: 'Action history & inspector' },
    ],
  },
  {
    label: 'GOVERNANCE',
    items: [
      { path: '/agents',    label: 'AI Agents',     icon: Bot,          description: 'Registered agent fleet' },
      { path: '/tools',     label: 'Tool Registry',  icon: Wrench,       description: 'Governed tool catalog' },
      { path: '/policies',  label: 'Policies',       icon: Lock,         description: 'Policy rule builder' },
      { path: '/approvals', label: 'Approval Inbox', icon: CheckCircle2, description: 'Human-in-the-loop queue', badge: true },
    ],
  },
  {
    label: 'SECURITY',
    items: [
      { path: '/security-tests', label: 'Security Lab',  icon: FlaskConical,  description: 'Attack simulation suite' },
      { path: '/incidents',      label: 'SOC Incidents', icon: AlertTriangle,  description: 'Threat response center' },
      { path: '/audit-logs',     label: 'Audit Logs',    icon: FileSpreadsheet, description: 'Immutable audit trail' },
    ],
  },
  {
    label: 'PLATFORM',
    items: [
      { path: '/integrations', label: 'Integrations', icon: Workflow,     description: 'n8n & webhook bridge' },
      { path: '/api-keys',     label: 'API Keys',     icon: Key,          description: 'Developer credentials' },
      { path: '/settings',     label: 'Settings',     icon: SettingsIcon, description: 'Platform configuration' },
    ],
  },
];

const pageTitles: Record<string, string> = {
  '/dashboard':     'Security Control Center',
  '/live-monitor':  'Live SOC Operations',
  '/executions':    'Execution Inspector',
  '/agents':        'AI Agent Fleet',
  '/tools':         'Tool Registry',
  '/policies':      'Policy Builder',
  '/approvals':     'Approval Inbox',
  '/security-tests':'Security Test Lab',
  '/incidents':     'SOC Incidents',
  '/audit-logs':    'Audit Logs',
  '/integrations':  'Integrations',
  '/api-keys':      'API Keys',
  '/settings':      'Settings',
};

// ─── Component ──────────────────────────────────────────────
export const AppShell: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifCount] = useState(3);

  const { user, logout } = useAuth();
  const { isConnected } = useWebSocket();
  const location = useLocation();
  const navigate = useNavigate();

  // Keyboard shortcut: Ctrl+K
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setIsSearchOpen(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const getPageTitle = () => {
    const match = Object.keys(pageTitles).find(k => location.pathname.startsWith(k));
    return match ? pageTitles[match] : 'AgentGuard';
  };

  const userInitials = user?.name ? user.name.slice(0, 2).toUpperCase() : 'AG';

  // ── Sidebar ────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* ── Logo ── */}
      <div className="h-16 flex items-center justify-between px-4 shrink-0 border-b border-white/[0.05]">
        <button
          className="flex items-center gap-3 overflow-hidden min-w-0"
          onClick={() => navigate('/dashboard')}
        >
          {/* Shield icon with glow */}
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-xl bg-cyan-400/20 blur-md" />
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Shield className="w-4.5 h-4.5" strokeWidth={2.5} />
            </div>
          </div>

          {!isCollapsed && (
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-[15px] font-extrabold tracking-tight text-white font-mono leading-tight">
                Agent<span className="text-cyan-400">Guard</span>
              </span>
              <span className="text-[9px] tracking-[0.12em] uppercase font-mono text-slate-500 font-medium leading-tight">
                AI Firewall Platform
              </span>
            </div>
          )}
        </button>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.05] transition-all shrink-0"
        >
          {isCollapsed
            ? <ChevronRight className="w-3.5 h-3.5" />
            : <ChevronLeft  className="w-3.5 h-3.5" />
          }
        </button>

        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Nav Items ── */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-0.5">
            {!isCollapsed && (
              <p className="section-label px-3 mb-2">{section.label}</p>
            )}

            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? 'active' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`relative shrink-0 transition-transform duration-150 ${isActive ? '' : 'group-hover:scale-110'}`}>
                        <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-200'}`} />
                        {item.live && (
                          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400">
                            <span className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-75" />
                          </span>
                        )}
                      </div>

                      {!isCollapsed && (
                        <>
                          <span className={`flex-1 truncate text-xs ${isActive ? 'text-cyan-200 font-semibold' : 'text-slate-400 font-medium'}`}>
                            {item.label}
                          </span>
                          {item.badge && notifCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[9px] font-mono font-bold leading-none">
                              {notifCount}
                            </span>
                          )}
                        </>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── System Status ── */}
      {!isCollapsed && (
        <div className="px-3 py-2 mx-2.5 mb-2 rounded-xl bg-dark-800/60 border border-white/[0.04]">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'} ${isConnected ? 'animate-pulse' : ''}`} />
              <span className={isConnected ? 'text-emerald-400' : 'text-amber-400'}>
                {isConnected ? 'SYSTEM ONLINE' : 'RECONNECTING'}
              </span>
            </div>
            <span className="text-slate-600">WS</span>
          </div>
        </div>
      )}

      {/* ── User Card ── */}
      <div className="px-2.5 pb-3 shrink-0">
        <div className={`flex items-center gap-2.5 p-2.5 rounded-xl bg-dark-800/50 border border-white/[0.04] hover:border-white/[0.07] transition-all ${isCollapsed ? 'justify-center' : ''}`}>
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-white/[0.08] flex items-center justify-center text-cyan-300 text-xs font-mono font-bold">
              {userInitials}
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-dark-800" />
          </div>

          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white truncate">{user?.name || 'Administrator'}</div>
                <div className="text-[9px] font-mono text-slate-500 truncate uppercase tracking-wide">{user?.role || 'SUPER_ADMIN'}</div>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-dark-950 text-slate-100 overflow-hidden">

      {/* ── Desktop Sidebar ── */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 border-r border-white/[0.05] bg-dark-900/60 backdrop-blur-xl transition-all duration-300 z-30 ${isCollapsed ? 'w-[68px]' : 'w-[220px]'}`}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="relative w-[220px] flex flex-col bg-dark-900 border-r border-white/[0.05]">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Top Bar ── */}
        <header className="h-14 shrink-0 flex items-center justify-between px-4 lg:px-6 border-b border-white/[0.05] bg-dark-950/60 backdrop-blur-md z-20">

          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>

            {/* Page Title */}
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">{getPageTitle()}</h1>
              <p className="hidden sm:block text-[10px] font-mono text-slate-500 tracking-wide mt-0.5">
                {location.pathname.replace('/', '').replace('-', ' ').toUpperCase() || 'DASHBOARD'}
              </p>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">

            {/* Search trigger */}
            <button
              id="search-btn"
              onClick={() => setIsSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-800/80 border border-white/[0.06] hover:border-white/[0.10] text-xs text-slate-500 hover:text-slate-200 transition-all font-mono group"
            >
              <Search className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 transition-colors" />
              <span className="hidden md:inline">Quick search...</span>
              <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded-md bg-dark-900 border border-white/[0.06] text-[9px] text-slate-600 ml-1">
                ⌘K
              </kbd>
            </button>

            {/* Connection status pill */}
            <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono font-semibold transition-all ${
              isConnected
                ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/8 border-amber-500/20 text-amber-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {isConnected ? 'SECURE' : 'RECONNECTING'}
            </div>

            {/* Notification Bell */}
            <button
              id="notif-btn"
              onClick={() => setIsSearchOpen(true)}
              className="relative p-2 rounded-xl bg-dark-800/80 border border-white/[0.06] hover:border-white/[0.10] text-slate-500 hover:text-white transition-all"
            >
              <Bell className="w-3.5 h-3.5" />
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400" />
              )}
            </button>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-7">
          <div className="page-enter max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Global Command Palette ── */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};
