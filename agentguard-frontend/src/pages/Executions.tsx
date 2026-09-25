import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ScrollText, Search, Filter, ChevronRight } from 'lucide-react';
import apiClient from '../api/client';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';

export const Executions: React.FC = () => {
  const navigate = useNavigate();
  const [decision, setDecision] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['executions', decision],
    queryFn: () => apiClient.get(`/executions${decision ? `?decision=${decision}` : ''}&limit=100`).then(r => r.data.data),
    refetchInterval: 10000,
  });

  const rows = Array.isArray(data) ? data : (data?.items ?? []);
  const filtered = rows.filter((r: any) =>
    !search || r.agent_name?.toLowerCase().includes(search.toLowerCase()) || r.tool_name?.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (ts: string) => ts ? new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

  return (
    <div className="p-6 max-w-[1200px] mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[#F5F5F5]">Executions</h1>
        <p className="text-[13px] text-[#6F6F6F] mt-1">Complete action history and security decisions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F6F6F]" />
          <input className="input-field pl-9" placeholder="Search agent or tool..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          className="input-field w-auto"
          value={decision}
          onChange={e => setDecision(e.target.value)}
        >
          <option value="">All decisions</option>
          <option value="ALLOWED">Allowed</option>
          <option value="BLOCKED">Blocked</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-10 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ScrollText className="w-8 h-8 text-[#2A2A2A] mb-3" />
            <p className="text-[14px] text-[#6F6F6F]">No executions found</p>
            <p className="text-[12px] text-[#6F6F6F] mt-1">Executions will appear here once agents start making requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Timestamp</th>
                  <th>Agent</th>
                  <th>Tool</th>
                  <th>Risk</th>
                  <th>Decision</th>
                  <th>Duration</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ex: any) => (
                  <tr key={ex.id} className="cursor-pointer" onClick={() => navigate(`/executions/${ex.id}`)}>
                    <td className="font-mono text-[11px] text-[#6F6F6F]">#{ex.id}</td>
                    <td className="font-mono text-[11px] text-[#6F6F6F] whitespace-nowrap">{fmt(ex.created_at)}</td>
                    <td className="text-[#F5F5F5] font-medium text-[13px]">{ex.agent_name}</td>
                    <td className="font-mono text-[12px] text-[#A1A1A1]">{ex.tool_name}</td>
                    <td><RiskBadge level={ex.risk_level} score={ex.risk_score} /></td>
                    <td><StatusBadge status={ex.decision} /></td>
                    <td className="font-mono text-[11px] text-[#6F6F6F]">{ex.duration_ms ? `${ex.duration_ms.toFixed(0)}ms` : '—'}</td>
                    <td><ChevronRight className="w-4 h-4 text-[#6F6F6F]" /></td>
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
