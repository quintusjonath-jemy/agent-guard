import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wrench, Plus, Search, ChevronRight } from 'lucide-react';
import apiClient from '../api/client';
import { StatusBadge } from '../components/StatusBadge';

export const Tools: React.FC = () => {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['tools'],
    queryFn: () => apiClient.get('/tools').then(r => r.data.data),
  });

  const tools = Array.isArray(data) ? data : (data?.items ?? []);
  const filtered = tools.filter((t: any) =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1100px] mx-auto animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-[#F5F5F5]">Tool Registry</h1>
          <p className="text-[13px] text-[#6F6F6F] mt-1">{tools.length} governed tools</p>
        </div>
        <button className="btn-primary btn-sm"><Plus className="w-3.5 h-3.5" /> Register Tool</button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F6F6F]" />
        <input className="input-field pl-9" placeholder="Search tools..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-40 p-5"><div className="skeleton h-full" /></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <Wrench className="w-8 h-8 text-[#2A2A2A] mb-3" />
          <p className="text-[14px] text-[#6F6F6F]">No tools registered</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t: any) => (
            <div key={t.id} className="card-interactive p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-[#A1A1A1]" />
                </div>
                <StatusBadge status={t.is_active ? 'ACTIVE' : 'INACTIVE'} />
              </div>
              <h3 className="text-[14px] font-semibold text-[#F5F5F5] mb-0.5">{t.name}</h3>
              {t.category && <span className="text-[11px] font-mono text-brand">{t.category}</span>}
              <p className="text-[12px] text-[#6F6F6F] mt-2 truncate-2 leading-relaxed">{t.description}</p>
              <div className="mt-4 pt-3 border-t border-[#2A2A2A] flex items-center justify-between">
                <span className="text-[11px] text-[#6F6F6F]">{Array.isArray(t.actions) ? t.actions.length : 0} actions</span>
                <span className="text-[11px] text-brand flex items-center gap-0.5">Details <ChevronRight className="w-3 h-3" /></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
