import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, Radio, ScrollText, Bot, Wrench, Lock, CheckCircle2, FlaskConical, AlertTriangle, FileText, Plug, Key, Settings, X } from 'lucide-react';

const COMMANDS = [
  { label: 'Dashboard',      path: '/dashboard',      icon: LayoutDashboard },
  { label: 'Live Monitor',   path: '/live-monitor',   icon: Radio },
  { label: 'Executions',     path: '/executions',     icon: ScrollText },
  { label: 'AI Agents',      path: '/agents',         icon: Bot },
  { label: 'Tools',          path: '/tools',          icon: Wrench },
  { label: 'Policies',       path: '/policies',       icon: Lock },
  { label: 'Approvals',      path: '/approvals',      icon: CheckCircle2 },
  { label: 'Security Tests', path: '/security-tests', icon: FlaskConical },
  { label: 'SOC Incidents',  path: '/incidents',      icon: AlertTriangle },
  { label: 'Audit Logs',     path: '/audit-logs',     icon: FileText },
  { label: 'Integrations',   path: '/integrations',   icon: Plug },
  { label: 'API Keys',       path: '/api-keys',       icon: Key },
  { label: 'Settings',       path: '/settings',       icon: Settings },
];

interface Props { onClose: () => void; }

export const CommandPalette: React.FC<Props> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setActive(0); }, [query]);

  const go = (path: string) => { navigate(path); onClose(); };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    if (e.key === 'Enter' && filtered[active]) go(filtered[active].path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[520px] animate-scale-in" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)', background: '#1A1A1A', borderRadius: 12 }}>
        {/* Search */}
        <div className="flex items-center gap-3 px-4 border-b border-[#2A2A2A]">
          <Search className="w-4 h-4 text-[#6F6F6F] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            className="flex-1 bg-transparent py-4 text-[14px] text-[#F5F5F5] placeholder-[#6F6F6F] outline-none"
            placeholder="Search pages..."
          />
          <button onClick={onClose} className="text-[#6F6F6F] hover:text-[#A1A1A1] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-[#6F6F6F]">No results for "{query}"</div>
          ) : (
            <div className="p-2">
              {filtered.map((cmd, i) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.path}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${i === active ? 'bg-[#2A2A2A] text-[#F5F5F5]' : 'text-[#A1A1A1] hover:bg-[#222] hover:text-[#F5F5F5]'}`}
                    onClick={() => go(cmd.path)}
                    onMouseEnter={() => setActive(i)}
                  >
                    <div className="w-7 h-7 rounded-md bg-[#141414] border border-[#2A2A2A] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[13px] font-medium">{cmd.label}</span>
                    <kbd className="ml-auto text-[10px] font-mono text-[#6F6F6F] bg-[#141414] border border-[#2A2A2A] px-1.5 py-0.5 rounded">↵</kbd>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-[#2A2A2A] flex items-center gap-4 text-[10px] font-mono text-[#6F6F6F]">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
};
