import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, AlertTriangle, DollarSign, Clock, Bot, Wrench, Shield } from 'lucide-react';
import apiClient from '../api/client';
import { ApprovalResponse } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';

export const Approvals: React.FC = () => {
  const [selectedApproval, setSelectedApproval] = useState<ApprovalResponse | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [notes, setNotes] = useState('');

  const queryClient = useQueryClient();

  const { data: approvals, isLoading } = useQuery({
    queryKey: ['approvals'],
    queryFn: async () => {
      const res = await apiClient.get('/approvals');
      return res.data.data as ApprovalResponse[];
    },
  });

  const decisionMutation = useMutation({
    mutationFn: async ({ id, type, notes }: { id: number; type: 'approve' | 'reject'; notes: string }) => {
      const endpoint = `/approvals/${id}/${type}`;
      const res = await apiClient.post(endpoint, { decision_notes: notes });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
      setSelectedApproval(null);
      setNotes('');
    },
  });

  const pendingList = (approvals || []).filter((a) => a.status === 'PENDING');
  const historyList = (approvals || []).filter((a) => a.status !== 'PENDING');

  const handleDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApproval) return;
    decisionMutation.mutate({
      id: selectedApproval.id,
      type: actionType,
      notes,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Human-in-the-Loop Approval Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Supervisor review queue for high-risk autonomous agent operations exceeding configured policy thresholds.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{pendingList.length} Actions Awaiting Review</span>
        </div>
      </div>

      {/* Pending Action Cards */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400">
          Pending High-Risk Requests ({pendingList.length})
        </h3>

        {pendingList.length === 0 ? (
          <div className="glass-panel p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400/50 mx-auto mb-2" />
            <p className="text-sm text-slate-300 font-mono">
              Inbox Zero — No pending human approvals required.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              All agent tool requests are within automated limits.
            </p>
          </div>
        ) : (
          pendingList.map((app) => (
            <div
              key={app.id}
              className="glass-panel-elevated p-6 border-amber-500/30 bg-amber-950/10 shadow-glow-amber flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                    <AlertTriangle className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white font-mono">
                        {app.requested_by_agent}
                      </span>
                      <span className="text-xs text-slate-400">wants to execute</span>
                      <span className="text-xs font-mono font-bold text-cyan-400 bg-dark-950 px-2 py-0.5 rounded border border-slate-800">
                        {app.action_name}
                      </span>
                    </div>
                    {app.amount && (
                      <div className="text-sm font-mono font-bold text-white mt-1">
                        Requested Amount: <span className="text-amber-400">₹{app.amount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 font-sans pl-11">
                  <strong>Policy Alert:</strong> {app.reason || 'Operation exceeds automated safety limit.'}
                </p>

                <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 pl-11">
                  <span>Risk Score: {app.risk_score} / 100</span>
                  <span>•</span>
                  <span>Requested: {new Date(app.requested_at).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => {
                    setSelectedApproval(app);
                    setActionType('reject');
                  }}
                  className="px-4 py-2 rounded-lg bg-dark-900 hover:bg-red-950/60 border border-slate-800 hover:border-red-500/50 text-slate-300 hover:text-red-400 text-xs font-mono font-semibold transition-all"
                >
                  Reject Action
                </button>
                <button
                  onClick={() => {
                    setSelectedApproval(app);
                    setActionType('approve');
                  }}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold shadow-md transition-all"
                >
                  Approve Execution
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Decision Confirmation Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel-elevated p-6 border-slate-700 shadow-2xl">
            <h3 className="text-base font-bold text-white tracking-tight mb-1">
              Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Agent <strong className="text-white">{selectedApproval.requested_by_agent}</strong> • Action <strong className="text-cyan-400">{selectedApproval.action_name}</strong>
            </p>

            <form onSubmit={handleDecision} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Supervisor Audit Notes
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={
                    actionType === 'approve'
                      ? 'e.g. Verified customer refund with accounting manager.'
                      : 'e.g. Denied due to suspicious transaction pattern.'
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedApproval(null)}
                  className="px-4 py-2 rounded-lg bg-dark-900 border border-slate-800 text-xs font-mono text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={decisionMutation.isPending}
                  className={`px-4 py-2 rounded-lg text-white text-xs font-mono font-bold transition-all ${
                    actionType === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-red-600 hover:bg-red-500'
                  }`}
                >
                  {decisionMutation.isPending
                    ? 'Processing...'
                    : actionType === 'approve'
                    ? 'Authorize Execution'
                    : 'Stop Execution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
