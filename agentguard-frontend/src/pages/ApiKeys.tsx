import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Key, Plus, Trash2, Copy, Check, Eye, EyeOff } from 'lucide-react';
import apiClient from '../api/client';

export const ApiKeys: React.FC = () => {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [visible, setVisible] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['api_keys'],
    queryFn: () => apiClient.get('/api-keys').then(r => r.data.data),
  });

  const create = useMutation({
    mutationFn: (n: string) => apiClient.post('/api-keys', { name: n }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['api_keys'] }); setName(''); setCreating(false); },
  });

  const del = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/api-keys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api_keys'] }),
  });

  const keys = Array.isArray(data) ? data : (data?.items ?? []);

  const copyKey = (id: number, key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const fmt = (ts: string) => ts ? new Date(ts).toLocaleDateString() : '—';

  return (
    <div className="p-6 max-w-[800px] mx-auto animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-[#F5F5F5]">API Keys</h1>
          <p className="text-[13px] text-[#6F6F6F] mt-1">Manage authentication credentials for AgentGuard gateway</p>
        </div>
        <button onClick={() => setCreating(c => !c)} className="btn-primary btn-sm">
          <Plus className="w-3.5 h-3.5" /> Create Key
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="card p-5 mb-5 animate-slide-down">
          <h2 className="text-[14px] font-semibold text-[#F5F5F5] mb-4">New API Key</h2>
          <div className="flex gap-3">
            <input
              className="input-field flex-1"
              placeholder="Key name (e.g. Production Agent)"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && name.trim() && create.mutate(name.trim())}
              autoFocus
            />
            <button
              className="btn-primary btn-sm"
              disabled={!name.trim() || create.isPending}
              onClick={() => create.mutate(name.trim())}
            >
              Generate
            </button>
            <button className="btn-secondary btn-sm" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Keys list */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card h-20 p-5"><div className="skeleton h-full" /></div>)}</div>
      ) : keys.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <Key className="w-8 h-8 text-[#2A2A2A] mb-3" />
          <p className="text-[14px] text-[#6F6F6F]">No API keys</p>
          <p className="text-[12px] text-[#6F6F6F] mt-1 mb-4">Create an API key to allow agents to authenticate</p>
          <button onClick={() => setCreating(true)} className="btn-primary btn-sm"><Plus className="w-3.5 h-3.5" /> Create Key</button>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((k: any) => (
            <div key={k.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[14px] font-medium text-[#F5F5F5]">{k.name}</span>
                    <span className={`badge ${k.is_active ? 'badge-active' : 'badge-inactive'}`}>{k.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-[12px] font-mono text-[#6F6F6F] bg-[#1A1A1A] px-3 py-1.5 rounded-md border border-[#2A2A2A] flex-1 min-w-0 truncate">
                      {visible[k.id] ? (k.key_value || k.api_key || '••••••••••••••••') : '••••••••••••••••••••••••••••••••'}
                    </code>
                    <button
                      onClick={() => setVisible(v => ({ ...v, [k.id]: !v[k.id] }))}
                      className="btn-ghost btn-xs"
                    >
                      {visible[k.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => copyKey(k.id, k.key_value || k.api_key || '')}
                      className="btn-ghost btn-xs"
                    >
                      {copied === k.id ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="text-[11px] text-[#6F6F6F] font-mono mt-1.5">Created {fmt(k.created_at)} · Last used {fmt(k.last_used_at)}</div>
                </div>
                <button
                  onClick={() => { if (confirm('Delete this API key?')) del.mutate(k.id); }}
                  className="btn-danger btn-xs flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
