import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bot, Shield, AlertTriangle, Play, FileText, CheckCircle2, X } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickActions = [
    {
      title: 'Run Security Test Lab',
      category: 'Actions',
      icon: Play,
      path: '/security-tests',
    },
    {
      title: 'Open Approval Center',
      category: 'Actions',
      icon: CheckCircle2,
      path: '/approvals',
    },
    {
      title: 'View Blocked Executions',
      category: 'Executions',
      icon: Shield,
      path: '/executions',
    },
    {
      title: 'FinanceBot — Financial Operations Agent',
      category: 'Agents',
      icon: Bot,
      path: '/agents/1',
    },
    {
      title: 'SupportBot — Customer Support Agent',
      category: 'Agents',
      icon: Bot,
      path: '/agents/2',
    },
    {
      title: 'Financial Limit Policy (Max ₹10,000)',
      category: 'Policies',
      icon: Shield,
      path: '/policies',
    },
    {
      title: 'SOC Incident Center',
      category: 'Incidents',
      icon: AlertTriangle,
      path: '/incidents',
    },
    {
      title: 'System Audit Logs',
      category: 'Audit',
      icon: FileText,
      path: '/audit-logs',
    },
  ];

  const filtered = query.trim()
    ? quickActions.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.category.toLowerCase().includes(query.toLowerCase())
      )
    : quickActions;

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-dark-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl glass-panel-elevated border-slate-700 shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 gap-3">
          <Search className="w-5 h-5 text-cyan-400" />
          <input
            type="text"
            placeholder="Search agents, policies, tools, executions... (Esc to exit)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-dark-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 font-mono">
              No matching records or actions found for "{query}".
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(item.path)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-dark-800/80 text-left transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-dark-950 border border-slate-800 text-cyan-400 group-hover:text-cyan-300">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-slate-200 group-hover:text-white font-medium">
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 bg-dark-950/60 px-2 py-0.5 rounded border border-slate-800">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 bg-dark-950/90 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Navigate with arrows or click</span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-dark-900 border border-slate-700 rounded text-slate-400">
              Esc
            </kbd>{' '}
            to close
          </span>
        </div>
      </div>
    </div>
  );
};
