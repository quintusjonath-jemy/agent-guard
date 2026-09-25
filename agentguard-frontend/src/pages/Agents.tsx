import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bot, Plus, Search, ChevronRight, Activity, Shield } from 'lucide-react';
import apiClient from '../api/client';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';

export const Agents: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => apiClient.get('/agents').then(r => r.data.data),
  });

  const agents = Array.isArray(data) ? data : (data?.items ?? []);
  const filtered = agents.filter((a: any) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.provider?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1200px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-[#F5F5F5]">AI Agents</h1>
          <p className="text-[13px] text-[#6F6F6F] mt-1">{agents.length} registered agents</p>
        </div>
        <button onClick={() => navigate('/agents/new')} className="btn-primary btn-sm">
          <Plus className="w-3.5 h-3.5" />
          Register Agent
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F6F6F]" />
        <input
          className="input-field pl-9"
          placeholder="Search agents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 h-[180px]">
              <div className="skeleton w-8 h-8 rounded-lg mb-3" />
              <div className="skeleton w-32 h-4 mb-2" />
              <div className="skeleton w-48 h-3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <Bot className="w-10 h-10 text-[#2A2A2A] mb-3" />
          <p className="text-[14px] text-[#6F6F6F]">No agents found</p>
          <p className="text-[12px] text-[#6F6F6F] mt-1 mb-4">Register your first AI agent to get started</p>
          <button onClick={() => navigate('/agents/new')} className="btn-primary btn-sm">
            <Plus className="w-3.5 h-3.5" /> Register Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((agent: any) => (
            <div
              key={agent.id}
              className="card-interactive p-5"
              onClick={() => navigate(`/agents/${agent.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-9 h-9 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
                  <Bot className="w-5 h-5 text-[#A1A1A1]" />
                </div>
                <div className="flex items-center gap-1.5">
                  <StatusBadge status={agent.status} />
                  <RiskBadge level={agent.risk_level} />
                </div>
              </div>

              <h3 className="text-[14px] font-semibold text-[#F5F5F5] mb-0.5">{agent.name}</h3>
              <p className="text-[12px] text-[#6F6F6F] truncate-2 leading-relaxed mb-4">{agent.description}</p>

              <div className="grid grid-cols-3 gap-2 border-t border-[#2A2A2A] pt-3">
                <div className="text-center">
                  <div className="text-[14px] font-semibold font-mono text-[#F5F5F5]">{agent.security_score ?? '—'}</div>
                  <div className="text-[10px] text-[#6F6F6F]">Score</div>
                </div>
                <div className="text-center">
                  <div className="text-[14px] font-semibold font-mono text-[#F5F5F5]">{agent.total_executions ?? 0}</div>
                  <div className="text-[10px] text-[#6F6F6F]">Actions</div>
                </div>
                <div className="text-center">
                  <div className="text-[14px] font-semibold font-mono text-[#F5F5F5]">{agent.blocked_executions ?? 0}</div>
                  <div className="text-[10px] text-[#6F6F6F]">Blocked</div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2A2A2A]">
                <span className="text-[11px] font-mono text-[#6F6F6F]">{agent.provider}</span>
                <span className="text-[11px] text-brand flex items-center gap-0.5">
                  View <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
