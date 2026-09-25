import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import apiClient from '../api/client';
import { RiskBadge } from '../components/RiskBadge';

export const Approvals: React.FC = () => {
  const qc = useQueryClient();
  const [notes, setNotes] = useState<Record<number, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['approvals'],
    queryFn: () => apiClient.get('/approvals?status_filter=PENDING&limit=50').then(r => r.data.data),
    refetchInterval: 10000,
  });

  const decide = useMutation({
    mutationFn: ({ id, decision, note }: { id: number; decision: string; note: string }) => {
      const endpoint = decision === 'APPROVED' ? `/approvals/${id}/approve` : `/approvals/${id}/reject`;
      return apiClient.post(endpoint, { decision_notes: note });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approvals'] }),
  });

  const approvals = Array.isArray(data) ? data : (data?.items ?? []);

  const fmt = (ts: string) => ts ? new Date(ts).toLocaleString() : '—';

  return (
    <div className="p-6 max-w-[900px] mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[#F5F5F5]">Approval Center</h1>
        <p className="text-[13px] text-[#6F6F6F] mt-1">
          {approvals.length > 0 ? `${approvals.length} action${approvals.length > 1 ? 's' : ''} require${approvals.length === 1 ? 's' : ''} your review` : 'No pending approvals'}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-48 p-5"><div className="skeleton h-full" /></div>)}
        </div>
      ) : approvals.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-24 text-center">
          <CheckCircle2 className="w-10 h-10 text-success mb-3" />
          <p className="text-[15px] font-medium text-[#F5F5F5]">No pending approvals</p>
          <p className="text-[13px] text-[#6F6F6F] mt-1">All agent actions are within approved policy limits</p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((a: any) => (
            <div key={a.id} className="card p-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="text-[11px] text-[#6F6F6F] font-mono mb-1">ACTION REQUIRES APPROVAL</div>
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] font-semibold text-[#F5F5F5]">{a.agent_name}</span>
                    <RiskBadge level={a.risk_level || 'HIGH'} />
                  </div>
                  <div className="text-[13px] font-mono text-[#A1A1A1] mt-1">{a.tool_name} · {a.action_name}</div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#6F6F6F]">
                  <Clock className="w-3.5 h-3.5" />
                  {fmt(a.created_at)}
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#1A1A1A] rounded-lg mb-5">
                {a.reason && (
                  <div>
                    <div className="text-[11px] text-[#6F6F6F] mb-1 uppercase tracking-wide">Reason</div>
                    <p className="text-[12px] text-[#A1A1A1]">{a.reason}</p>
                  </div>
                )}
                {a.request_payload && Object.keys(a.request_payload).length > 0 && (
                  <div>
                    <div className="text-[11px] text-[#6F6F6F] mb-1 uppercase tracking-wide">Payload</div>
                    <div className="code-block text-[11px] max-h-[100px] overflow-auto">
                      {JSON.stringify(a.request_payload, null, 2)}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes + Actions */}
              <div className="flex items-center gap-3">
                <input
                  className="input-field flex-1 text-[12px]"
                  placeholder="Add a note (optional)..."
                  value={notes[a.id] ?? ''}
                  onChange={e => setNotes(n => ({ ...n, [a.id]: e.target.value }))}
                />
                <button
                  className="btn-danger btn-sm"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ id: a.id, decision: 'REJECTED', note: notes[a.id] ?? '' })}
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button
                  className="btn-primary btn-sm"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ id: a.id, decision: 'APPROVED', note: notes[a.id] ?? '' })}
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
