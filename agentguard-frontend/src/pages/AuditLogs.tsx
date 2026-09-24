import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileSpreadsheet, Search, Filter, Download } from 'lucide-react';
import apiClient from '../api/client';
import { AuditLog } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';

export const AuditLogs: React.FC = () => {
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit_logs', eventFilter],
    queryFn: async () => {
      let url = '/audit-logs?limit=100';
      if (eventFilter) url += `&event_type=${eventFilter}`;
      const res = await apiClient.get(url);
      return res.data.data as AuditLog[];
    },
  });

  const filtered = (logs || []).filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      l.event_type.toLowerCase().includes(q)
    );
  });

  const exportCSV = () => {
    if (!filtered || filtered.length === 0) return;
    const headers = 'ID,Event Type,Action,Decision,Risk,Description,IP,Timestamp\n';
    const rows = filtered
      .map(
        (l) =>
          `${l.id},"${l.event_type}","${l.action}","${l.decision || ''}","${l.risk_level || ''}","${l.description.replace(/"/g, '""')}","${l.ip_address}","${l.created_at}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agentguard-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Immutable Security Audit Logs
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete compliance trail capturing every policy change, gateway action, approval, and test run.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-900 border border-slate-700 hover:border-slate-600 text-xs font-mono text-slate-200 transition-all"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search audit trail by description or event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-dark-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-dark-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="">All Event Types</option>
            <option value="ACTION_EXECUTED">ACTION_EXECUTED</option>
            <option value="ACTION_BLOCKED">ACTION_BLOCKED</option>
            <option value="APPROVAL_APPROVED">APPROVAL_APPROVED</option>
            <option value="APPROVAL_REJECTED">APPROVAL_REJECTED</option>
            <option value="SECURITY_TEST_EXECUTED">SECURITY_TEST_EXECUTED</option>
            <option value="AUTH_SUCCESS">AUTH_SUCCESS</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 bg-dark-950/60">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Source IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No audit records match the current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-dark-850/60 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-cyan-400 text-[11px]">
                      {log.event_type}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-semibold">
                      {log.action}
                    </td>
                    <td className="py-3 px-4">
                      {log.decision ? <StatusBadge status={log.decision} /> : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate font-sans text-xs">
                      {log.description}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 text-[11px]">
                      {log.ip_address}
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
