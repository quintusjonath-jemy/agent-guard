import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bot, Plus, Search, ChevronRight, X, AlertCircle } from 'lucide-react';
import apiClient from '../api/client';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';

export const Agents: React.FC = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [provider, setProvider] = useState('OpenAI');
  const [environment, setEnvironment] = useState('Production');
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => apiClient.get('/agents').then(r => r.data.data),
  });

  const createAgentMutation = useMutation({
    mutationFn: () => {
      return apiClient.post('/agents', {
        name: name.trim(),
        description: description.trim() || undefined,
        provider,
        environment,
        risk_level: riskLevel,
        status: 'ACTIVE',
        tool_ids: [],
        permission_configs: []
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents'] });
      setShowModal(false);
      setName('');
      setDescription('');
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to create agent');
    }
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Agent name is required');
      return;
    }
    setError(null);
    createAgentMutation.mutate();
  };

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
        <button onClick={() => setShowModal(true)} className="btn-primary btn-sm flex items-center gap-1.5">
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
          <button onClick={() => setShowModal(true)} className="btn-primary btn-sm flex items-center gap-1.5">
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
              <p className="text-[12px] text-[#6F6F6F] truncate-2 leading-relaxed mb-4">{agent.description || 'Autonomous AI agent protected by AgentGuard'}</p>

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
                <span className="text-[11px] text-accent flex items-center gap-0.5">
                  View <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register Agent Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-accent" />
                <h2 className="text-[16px] font-semibold text-[#F5F5F5]">Register New Agent</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#6F6F6F] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 flex items-center gap-2 text-[12px] text-danger">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[#A1A1A1] mb-1">Agent Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FinanceBot, SupportAgent"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#A1A1A1] mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Handles refund approvals and invoicing"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#A1A1A1] mb-1">Provider</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="OpenAI">OpenAI</option>
                    <option value="Anthropic">Anthropic</option>
                    <option value="Mistral">Mistral</option>
                    <option value="Google">Google</option>
                    <option value="Custom">Custom / Self-hosted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#A1A1A1] mb-1">Environment</label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="Production">Production</option>
                    <option value="Staging">Staging</option>
                    <option value="Development">Development</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#A1A1A1] mb-1">Initial Risk Level</label>
                <select
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value as any)}
                  className="input-field w-full"
                >
                  <option value="LOW">LOW — Routine read operations</option>
                  <option value="MEDIUM">MEDIUM — Financial/Data write actions</option>
                  <option value="HIGH">HIGH — Critical or admin actions</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAgentMutation.isPending}
                  className="btn-primary btn-sm"
                >
                  {createAgentMutation.isPending ? 'Registering...' : 'Register Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
