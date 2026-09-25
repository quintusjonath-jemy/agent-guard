import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lock, Plus, Search, ChevronRight, Shield, AlertTriangle } from 'lucide-react';
import apiClient from '../api/client';
import { StatusBadge } from '../components/StatusBadge';

export const Policies: React.FC = () => {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['policies'],
    queryFn: () => apiClient.get('/policies').then(r => r.data.data),
  });

  const policies = Array.isArray(data) ? data : (data?.items ?? []);
  const filtered = policies.filter((p: any) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const typeColor = (type: string) => {
    const t = type?.toUpperCase();
    if (t === 'BLOCK') return 'text-danger';
    if (t === 'APPROVE') return 'text-warning';
    return 'text-brand';
  };

  return (
    <div className="p-6 max-w-[1100px] mx-auto animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-[#F5F5F5]">Policies</h1>
          <p className="text-[13px] text-[#6F6F6F] mt-1">{policies.length} security policies active</p>
        </div>
        <button className="btn-primary btn-sm">
          <Plus className="w-3.5 h-3.5" /> Create Policy
        </button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F6F6F]" />
        <input className="input-field pl-9" placeholder="Search policies..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="card h-24 p-5"><div className="skeleton h-full" /></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <Lock className="w-8 h-8 text-[#2A2A2A] mb-3" />
          <p className="text-[14px] text-[#6F6F6F]">No policies found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Policy Name</th>
                <th>Type</th>
                <th>Priority</th>
                <th className="hidden md:table-cell">Conditions</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => (
                <tr key={p.id} className="cursor-pointer">
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
                        <Shield className="w-3.5 h-3.5 text-[#6F6F6F]" />
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-[#F5F5F5]">{p.name}</div>
                        {p.description && (
                          <div className="text-[11px] text-[#6F6F6F] max-w-[240px] truncate">{p.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`text-[12px] font-mono font-semibold ${typeColor(p.effect)}`}>
                      {p.effect}
                    </span>
                  </td>
                  <td className="font-mono text-[12px] text-[#A1A1A1]">{p.priority ?? '—'}</td>
                  <td className="hidden md:table-cell text-[12px] text-[#6F6F6F]">
                    {Array.isArray(p.conditions) ? `${p.conditions.length} conditions` : '—'}
                  </td>
                  <td><StatusBadge status={p.is_active ? 'ACTIVE' : 'INACTIVE'} /></td>
                  <td><ChevronRight className="w-4 h-4 text-[#6F6F6F]" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
