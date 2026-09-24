import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bot, Plus, ArrowRight, Shield, Lock, Wrench, Activity, CheckCircle2 } from 'lucide-react';
import apiClient from '../api/client';
import { Agent } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';

export const Agents: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [provider, setProvider] = useState('OpenAI GPT-4');
  const [environment, setEnvironment] = useState('Production');
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('LOW');

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await apiClient.get('/agents');
      return res.data.data as Agent[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/agents', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setIsCreateModalOpen(false);
      setName('');
      setDescription('');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      description,
      provider,
      environment,
      risk_level: riskLevel,
      status: 'ACTIVE',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Autonomous AI Agent Fleet
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Governed AI models with deterministic tool permissions, financial thresholds, and policy boundaries.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold font-mono tracking-wide shadow-glow-teal transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Register AI Agent</span>
        </button>
      </div>

      {/* Agents Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(agents || []).map((agent) => (
          <div
            key={agent.id}
            onClick={() => navigate(`/agents/${agent.id}`)}
            className="glass-panel p-6 hover:border-cyan-500/40 hover:bg-dark-850/80 cursor-pointer transition-all duration-200 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 group-hover:shadow-glow-teal transition-all">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                      {agent.name}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      {agent.provider} • {agent.environment}
                    </span>
                  </div>
                </div>
                <StatusBadge status={agent.status} />
              </div>

              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
                {agent.description || 'Autonomous agent performing governed operations.'}
              </p>

              <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800/80 text-center font-mono">
                <div className="bg-dark-950/60 p-2 rounded border border-slate-800/60">
                  <div className="text-[10px] text-slate-500 uppercase">SCORE</div>
                  <div className="text-sm font-bold text-emerald-400">{agent.security_score}</div>
                </div>
                <div className="bg-dark-950/60 p-2 rounded border border-slate-800/60">
                  <div className="text-[10px] text-slate-500 uppercase">TOOLS</div>
                  <div className="text-sm font-bold text-cyan-400">{agent.tools_count || 0}</div>
                </div>
                <div className="bg-dark-950/60 p-2 rounded border border-slate-800/60">
                  <div className="text-[10px] text-slate-500 uppercase">RISK</div>
                  <div className="text-xs font-bold text-slate-300 mt-0.5">{agent.risk_level}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-2 text-xs font-mono text-cyan-400 group-hover:text-cyan-300">
              <RiskBadge level={agent.risk_level} size="sm" />
              <span className="flex items-center gap-1">
                Configure Agent <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Agent Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel-elevated p-6 border-slate-700 shadow-2xl">
            <h3 className="text-base font-bold text-white tracking-tight mb-1">
              Register New Autonomous Agent
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Define the AI agent identity, LLM provider, and default operational risk boundary.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Agent Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BillingAuditorBot"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Description & Purpose
                </label>
                <textarea
                  rows={2}
                  placeholder="Briefly describe what tasks this autonomous agent is authorized to perform..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                    LLM Provider
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="OpenAI GPT-4">OpenAI GPT-4</option>
                    <option value="Anthropic Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
                    <option value="Google Gemini 1.5 Pro">Gemini 1.5 Pro</option>
                    <option value="Custom LangChain Agent">Custom LangChain</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                    Environment
                  </label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="Production">Production</option>
                    <option value="Staging">Staging</option>
                    <option value="Development">Development</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-dark-900 border border-slate-800 text-xs font-mono text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-semibold shadow-glow-teal"
                >
                  {createMutation.isPending ? 'Registering...' : 'Register Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
