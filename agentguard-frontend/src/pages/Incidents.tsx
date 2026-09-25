import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Search, ChevronRight, Shield } from 'lucide-react';
import apiClient from '../api/client';
import { StatusBadge } from '../components/StatusBadge';

export const Incidents: React.FC = () => {
  const qc = useQueryClient();
  const [status, setStatus] = useState('OPEN');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['incidents', status],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status) params.append('status_filter', status);
      const q = params.toString();
      return apiClient.get(`/incidents${q ? `?${q}` : ''}`).then(r => r.data.data);
    },
    refetchInterval: 15000,
  });

  const resolve = useMutation({
    mutationFn: (id: number) => apiClient.put(`/incidents/${id}`, { status: 'RESOLVED' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['incidents'] }),
  });

  const incidents = Array.isArray(data) ? data : (data?.items ?? []);
  const filtered = incidents.filter((i: any) =>
    !search || i.title?.toLowerCase().includes(search.toLowerCase()) || i.agent_name?.toLowerCase().includes(search.toLowerCase())
  );

  const severityColor = (sev: string) => {
    const s = sev?.toUpperCase();
    if (s === 'CRITICAL') return 'text-critical';
    if (s === 'HIGH') return 'text-danger';
    if (s === 'MEDIUM') return 'text-warning';
    return 'text-success';
  };

  const fmt = (ts: string) => ts ? new Date(ts).toLocaleString() : '—';

  return (
    <div className="p-6 max-w-[1100px] mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[#F5F5F5]">SOC Incidents</h1>
        <p className="text-[13px] text-[#6F6F6F] mt-1">Security incidents and threat response</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F6F6F]" />
          <input className="input-field pl-9" placeholder="Search incidents..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-auto" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="INVESTIGATING">Investigating</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="card h-24 p-5"><div className="skeleton h-full" /></div>)}</div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <Shield className="w-10 h-10 text-success mb-3" />
          <p className="text-[15px] font-medium text-[#F5F5F5]">No open incidents</p>
          <p className="text-[13px] text-[#6F6F6F] mt-1">All security incidents are resolved</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inc: any) => (
            <div key={inc.id} className="card p-5 hover:border-[#383838] transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${severityColor(inc.severity)}`} />
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#F5F5F5]">{inc.title}</h3>
                    {inc.description && (
                      <p className="text-[12px] text-[#6F6F6F] mt-0.5 leading-relaxed max-w-[500px]">{inc.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-[#6F6F6F]">
                      <span>{inc.agent_name}</span>
                      <span>·</span>
                      <span className={`font-semibold ${severityColor(inc.severity)}`}>{inc.severity}</span>
                      <span>·</span>
                      <span>{fmt(inc.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={inc.status} />
                  {inc.status === 'OPEN' && (
                    <button
                      onClick={() => resolve.mutate(inc.id)}
                      className="btn-secondary btn-xs"
                      disabled={resolve.isPending}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
