import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ScrollText, Search, Filter, ShieldAlert, ArrowRight, Eye } from 'lucide-react';
import apiClient from '../api/client';
import { ExecutionListItem } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';

export const Executions: React.FC = () => {
  const [decisionFilter, setDecisionFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const navigate = useNavigate();

  const { data: executions, isLoading } = useQuery({
    queryKey: ['executions', decisionFilter],
    queryFn: async () => {
      let url = '/executions?limit=50';
      if (decisionFilter) url += `&decision=${decisionFilter}`;
      const res = await apiClient.get(url);
      return res.data.data as ExecutionListItem[];
    },
  });

  const filtered = (executions || []).filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (e.agent_name?.toLowerCase() || '').includes(q) ||
      (e.tool_name?.toLowerCase() || '').includes(q) ||
      (e.action_name?.toLowerCase() || '').includes(q) ||
      (e.reason && e.reason.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Execution & Security Investigation Console
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of all evaluated AI agent tool requests with deep step-by-step decision breakdown.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by agent, tool, or policy violation reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-dark-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-dark-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="">All Decisions</option>
            <option value="ALLOWED">ALLOWED</option>
            <option value="BLOCKED">BLOCKED</option>
            <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-500 bg-dark-950/60">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Agent</th>
                <th className="py-3 px-4">Tool & Action</th>
                <th className="py-3 px-4">Risk Telemetry</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No executions matched the selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/executions/${item.id}`)}
                    className="hover:bg-dark-850/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-slate-400">
                      {item.created_at ? new Date(item.created_at).toLocaleTimeString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {item.agent_name}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <span className="text-cyan-400 font-semibold">{item.tool_name}</span>
                      <span className="text-slate-500 ml-1">({item.action_name})</span>
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge level={item.risk_level} score={item.risk_score} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={item.decision} />
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {item.duration_ms}ms
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/executions/${item.id}`);
                        }}
                        className="p-1.5 rounded bg-dark-950 border border-slate-800 text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-all inline-flex items-center gap-1 text-[11px]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
