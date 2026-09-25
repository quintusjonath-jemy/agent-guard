import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Search, Download } from 'lucide-react';
import apiClient from '../api/client';

export const AuditLogs: React.FC = () => {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['audit_logs'],
    queryFn: () => apiClient.get('/audit-logs?limit=200').then(r => r.data.data),
    refetchInterval: 30000,
  });

  const logs = Array.isArray(data) ? data : (data?.items ?? []);
  const filtered = logs.filter((l: any) =>
    !search ||
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    l.resource_type?.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (ts: string) => ts ? new Date(ts).toLocaleString() : '—';

  const methodColor = (method: string) => {
    const m = method?.toUpperCase();
    if (m === 'DELETE') return 'text-danger';
    if (m === 'POST' || m === 'PUT' || m === 'PATCH') return 'text-warning';
    return 'text-[#A1A1A1]';
  };

  return (
    <div className="p-6 max-w-[1100px] mx-auto animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-[#F5F5F5]">Audit Logs</h1>
          <p className="text-[13px] text-[#6F6F6F] mt-1">Immutable audit trail of all platform activity</p>
        </div>
        <button className="btn-secondary btn-sm">
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F6F6F]" />
        <input className="input-field pl-9" placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{[...Array(10)].map((_, i) => <div key={i} className="skeleton h-10 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-8 h-8 text-[#2A2A2A] mb-3" />
            <p className="text-[14px] text-[#6F6F6F]">No audit logs</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th className="hidden lg:table-cell">IP Address</th>
                  <th className="hidden md:table-cell">Method</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l: any, i: number) => (
                  <tr key={l.id ?? i}>
                    <td className="font-mono text-[11px] text-[#6F6F6F] whitespace-nowrap">{fmt(l.timestamp || l.created_at)}</td>
                    <td className="text-[13px] text-[#A1A1A1]">{l.user_email || l.user_name || '—'}</td>
                    <td className="text-[13px] font-medium text-[#F5F5F5]">{l.action}</td>
                    <td className="font-mono text-[12px] text-[#6F6F6F]">{l.resource_type}{l.resource_id ? `:${l.resource_id}` : ''}</td>
                    <td className="hidden lg:table-cell font-mono text-[11px] text-[#6F6F6F]">{l.ip_address || '—'}</td>
                    <td className="hidden md:table-cell">
                      <span className={`font-mono text-[11px] font-semibold ${methodColor(l.http_method || l.method)}`}>
                        {l.http_method || l.method || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
