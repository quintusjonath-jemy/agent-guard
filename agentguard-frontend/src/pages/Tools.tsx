import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wrench, Plus, Shield, CheckCircle2, Lock, Cpu } from 'lucide-react';
import apiClient from '../api/client';
import { Tool, PermissionType, RiskLevel } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';

export const Tools: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [toolType, setToolType] = useState('API');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('LOW');
  const [requiredPermission, setRequiredPermission] = useState<PermissionType>('READ');
  const [requiresApproval, setRequiresApproval] = useState(false);

  const queryClient = useQueryClient();

  const { data: tools, isLoading } = useQuery({
    queryKey: ['tools'],
    queryFn: async () => {
      const res = await apiClient.get('/tools');
      return res.data.data as Tool[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/tools', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      setIsModalOpen(false);
      setName('');
      setDescription('');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      description,
      tool_type: toolType,
      risk_level: riskLevel,
      required_permission: requiredPermission,
      requires_approval: requiresApproval,
      enabled: true,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Governed Tool Registry
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Registered tools, API endpoints, and real-world system actions protected behind AgentGuard firewall.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold font-mono tracking-wide shadow-glow-teal transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Register New Tool</span>
        </button>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(tools || []).map((tool) => (
          <div key={tool.id} className="glass-panel p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="text-sm font-bold font-mono text-cyan-400">{tool.name}</span>
                <RiskBadge level={tool.risk_level} size="sm" />
              </div>

              <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-dark-950 border border-slate-800 text-slate-400 mb-2">
                {tool.tool_type} • Required Perm: {tool.required_permission}
              </span>

              <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-4">
                {tool.description || 'Gated tool endpoint.'}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-500">
                {tool.requires_approval ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Approval Required
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Auto-Authorized
                  </span>
                )}
              </span>
              <StatusBadge status={tool.enabled ? 'ACTIVE' : 'DISABLED'} />
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel-elevated p-6 border-slate-700 shadow-2xl">
            <h3 className="text-base font-bold text-white tracking-tight mb-1">
              Register Governed Tool
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Configure tool risk classification and mandatory permission requirements.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Tool Identifier
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. database.export or refund_customer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-800 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="What does this tool execute in production?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                    Risk Classification
                  </label>
                  <select
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="LOW">LOW RISK</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH RISK</option>
                    <option value="CRITICAL">CRITICAL RISK</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                    Required Permission
                  </label>
                  <select
                    value={requiredPermission}
                    onChange={(e) => setRequiredPermission(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="READ">READ</option>
                    <option value="WRITE">WRITE</option>
                    <option value="FINANCIAL">FINANCIAL</option>
                    <option value="EXTERNAL_COMMUNICATION">EXTERNAL_COMMUNICATION</option>
                    <option value="DELETE">DELETE</option>
                    <option value="DATABASE_EXPORT">DATABASE_EXPORT</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="reqApp"
                  checked={requiresApproval}
                  onChange={(e) => setRequiresApproval(e.target.checked)}
                  className="rounded bg-dark-950 border-slate-800 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="reqApp" className="text-xs text-slate-300 font-mono cursor-pointer">
                  Always require supervisor human approval
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-dark-900 border border-slate-800 text-xs font-mono text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-semibold shadow-glow-teal"
                >
                  {createMutation.isPending ? 'Saving...' : 'Register Tool'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
