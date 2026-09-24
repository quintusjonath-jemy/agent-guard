import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Key, Plus, Trash2, Copy, Check, ShieldAlert, AlertTriangle } from 'lucide-react';
import apiClient from '../api/client';
import { APIKey } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const ApiKeys: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [newKeyData, setNewKeyData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const queryClient = useQueryClient();

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['api_keys'],
    queryFn: async () => {
      const res = await apiClient.get('/api-keys');
      return res.data.data as APIKey[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiClient.post('/api-keys', { name });
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api_keys'] });
      setNewKeyData(data);
      setKeyName('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(`/api-keys/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api_keys'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(keyName);
  };

  const handleCopySecret = () => {
    if (newKeyData?.api_key) {
      navigator.clipboard.writeText(newKeyData.api_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Developer API Key Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Authenticate autonomous AI agent scripts, LangChain agents, and n8n webhooks through the AgentGuard Gateway.
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setNewKeyData(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold font-mono tracking-wide shadow-glow-teal transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create New API Key</span>
        </button>
      </div>

      {/* Keys Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 bg-dark-950/60">
                <th className="py-3 px-4">Key Name</th>
                <th className="py-3 px-4">Prefix</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4">Last Used</th>
                <th className="py-3 px-4 text-right">Revoke</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(apiKeys || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No active API keys found. Generate one to connect your external AI agent.
                  </td>
                </tr>
              ) : (
                apiKeys?.map((k) => (
                  <tr key={k.id} className="hover:bg-dark-850/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">
                      {k.name}
                    </td>
                    <td className="py-3 px-4 text-cyan-400">
                      <code>{k.prefix}••••••••••••</code>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={k.is_active ? 'ACTIVE' : 'REVOKED'} />
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(k.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {k.last_used_at ? new Date(k.last_used_at).toLocaleTimeString() : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => deleteMutation.mutate(k.id)}
                        className="p-1.5 rounded bg-dark-950 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/40 transition-colors"
                        title="Revoke Key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Key Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel-elevated p-6 border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight">
              {newKeyData ? 'Save Your API Key Secret' : 'Create Agent API Key'}
            </h3>

            {!newKeyData ? (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                    Key Description Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. n8n Production Workflow Agent"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
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
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold"
                  >
                    {createMutation.isPending ? 'Generating...' : 'Generate Key'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Store this key securely now. For security purposes, this secret key will never be displayed again.
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-dark-950 border border-slate-800 flex items-center justify-between gap-3">
                  <code className="text-xs font-mono text-cyan-300 break-all select-all">
                    {newKeyData.api_key}
                  </code>
                  <button
                    onClick={handleCopySecret}
                    className="p-2 rounded bg-dark-900 hover:bg-dark-850 text-slate-300 hover:text-white border border-slate-800 shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold"
                  >
                    Done & Saved
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
