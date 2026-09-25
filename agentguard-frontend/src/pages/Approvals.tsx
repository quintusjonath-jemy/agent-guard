import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2, XCircle, AlertTriangle, Clock, Bot,
  Shield, ArrowRight, FileText, Users, X,
} from 'lucide-react';
import apiClient from '../api/client';
import { ApprovalResponse } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';

// ── Risk Score Bar ────────────────────────────────────────
const RiskBar: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 80 ? 'bg-red-400' : score >= 60 ? 'bg-orange-400' : score >= 40 ? 'bg-amber-400' : 'bg-emerald-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-dark-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[10px] font-mono text-slate-400 w-8 text-right">{score}</span>
    </div>
  );
};

// ── History Status ────────────────────────────────────────
const historyIcon = (status: string) => {
  if (status === 'APPROVED') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (status === 'REJECTED') return <XCircle className="w-4 h-4 text-red-400" />;
  return <Clock className="w-4 h-4 text-slate-500" />;
};

export const Approvals: React.FC = () => {
  const [selectedApproval, setSelectedApproval] = useState<ApprovalResponse | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [notes, setNotes] = useState('');

  const queryClient = useQueryClient();

  const { data: approvals, isLoading } = useQuery({
    queryKey: ['approvals'],
    queryFn: async () => (await apiClient.get('/approvals')).data.data as ApprovalResponse[],
  });

  const decisionMutation = useMutation({
    mutationFn: async ({ id, type, notes }: { id: number; type: 'approve' | 'reject'; notes: string }) => {
      return (await apiClient.post(`/approvals/${id}/${type}`, { decision_notes: notes })).data;
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
    decisionMutation.mutate({ id: selectedApproval.id, type: actionType, notes });
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Human Approval Center</h2>
          </div>
          <p className="text-xs text-slate-500 font-mono ml-[52px]">
            Supervisor review queue for high-risk autonomous agent operations exceeding policy thresholds.
          </p>
        </div>

        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold ${
          pendingList.length > 0
            ? 'bg-amber-500/10 border-amber-500/25 text-amber-400 ring-warn'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          {pendingList.length > 0
            ? <><AlertTriangle className="w-3.5 h-3.5" /> {pendingList.length} Awaiting Review</>
            : <><CheckCircle2 className="w-3.5 h-3.5" /> Inbox Clear</>
          }
        </div>
      </div>

      {/* ── Pending Queue ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="section-label">Pending Requests</h3>
          <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[9px] font-mono font-bold">
            {pendingList.length}
          </span>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
          </div>
        )}

        {!isLoading && pendingList.length === 0 && (
          <div className="glass-panel p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <h4 className="text-sm font-bold text-white">Inbox Zero</h4>
            <p className="text-xs text-slate-500 font-mono mt-1">
              All agent tool requests are within automated limits.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {pendingList.map((app) => (
            <div
              key={app.id}
              className="glass-panel p-5 ring-warn border-amber-500/20"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">

                {/* Left: Info */}
                <div className="space-y-3 flex-1">
                  {/* Agent + Action */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-dark-700 border border-white/[0.06] flex items-center justify-center">
                        <Bot className="w-4 h-4 text-cyan-400" />
                      </div>
                      <span className="text-sm font-bold text-white">{app.requested_by_agent}</span>
                    </div>
                    <span className="text-xs text-slate-500">wants to execute</span>
                    <span className="px-2.5 py-1 rounded-lg bg-dark-800 border border-white/[0.07] text-cyan-300 text-xs font-mono font-semibold">
                      {app.action_name}
                    </span>
                  </div>

                  {/* Amount */}
                  {app.amount && (
                    <div className="flex items-center gap-2 text-sm font-mono">
                      <span className="text-slate-500">Requested Amount:</span>
                      <span className="font-bold text-amber-400 text-lg">₹{app.amount.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Policy reason */}
                  <p className="text-xs text-slate-400 leading-relaxed bg-dark-800/50 px-3 py-2 rounded-lg border border-white/[0.04]">
                    <span className="text-amber-400 font-semibold">Policy Alert: </span>
                    {app.reason || 'Operation exceeds automated safety limit.'}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-[10px] font-mono text-slate-600">
                    <span>Risk Score:</span>
                    <div className="w-32">
                      <RiskBar score={app.risk_score ?? 0} />
                    </div>
                    <span>•</span>
                    <span>Requested: {new Date(app.requested_at).toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    id={`reject-${app.id}`}
                    onClick={() => { setSelectedApproval(app); setActionType('reject'); }}
                    className="btn-secondary border-red-500/15 hover:border-red-500/30 hover:text-red-400 text-xs py-2"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                  <button
                    id={`approve-${app.id}`}
                    onClick={() => { setSelectedApproval(app); setActionType('approve'); }}
                    className="btn-success text-xs py-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Decision History ── */}
      {historyList.length > 0 && (
        <section className="space-y-3">
          <h3 className="section-label">Decision History</h3>

          <div className="glass-panel divide-y divide-white/[0.04]">
            {historyList.map((app) => (
              <div key={app.id} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  {historyIcon(app.status)}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-white">{app.requested_by_agent}</span>
                      <span className="text-[10px] font-mono text-slate-500">→</span>
                      <span className="text-[11px] font-mono text-cyan-400">{app.action_name}</span>
                    </div>
                    {app.decision_notes && (
                      <p className="text-[10px] text-slate-600 font-mono truncate mt-0.5">{app.decision_notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={app.status} />
                  <span className="text-[10px] font-mono text-slate-600 hidden sm:block">
                    {new Date(app.requested_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Decision Modal ── */}
      {selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-dark-950/85 backdrop-blur-sm"
            onClick={() => setSelectedApproval(null)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md glass-panel-elevated p-6 shadow-2xl animate-slide-up">

            {/* Modal Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold mb-2 ${
                  actionType === 'approve'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/15 text-red-400 border border-red-500/20'
                }`}>
                  {actionType === 'approve' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {actionType === 'approve' ? 'APPROVE EXECUTION' : 'REJECT EXECUTION'}
                </div>
                <h3 className="text-base font-bold text-white">Confirm Decision</h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  <span className="text-white">{selectedApproval.requested_by_agent}</span>
                  {' • '}
                  <span className="text-cyan-400">{selectedApproval.action_name}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedApproval(null)}
                className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/[0.05] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Context box */}
            <div className="p-3 rounded-xl bg-dark-800/60 border border-white/[0.05] mb-4">
              <div className="text-[10px] font-mono text-slate-500 mb-1">Policy Alert</div>
              <p className="text-xs text-slate-300">{selectedApproval.reason || 'Operation exceeds automated safety limit.'}</p>
              <div className="mt-2">
                <div className="text-[10px] font-mono text-slate-600 mb-1">Risk Score</div>
                <RiskBar score={selectedApproval.risk_score ?? 0} />
              </div>
            </div>

            <form onSubmit={handleDecision} className="space-y-4">
              <div>
                <label className="section-label block mb-1.5">
                  <FileText className="w-3 h-3 inline mr-1" />
                  Supervisor Audit Notes <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={
                    actionType === 'approve'
                      ? 'e.g. Verified with accounting manager. Customer refund confirmed.'
                      : 'e.g. Denied due to suspicious transaction pattern. Flagged for review.'
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field resize-none text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.05]">
                <button
                  type="button"
                  onClick={() => setSelectedApproval(null)}
                  className="btn-secondary text-xs py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={decisionMutation.isPending}
                  className={`text-xs py-2 ${actionType === 'approve' ? 'btn-success' : 'btn-danger'}`}
                >
                  {decisionMutation.isPending
                    ? 'Processing...'
                    : actionType === 'approve'
                    ? 'Authorize Execution'
                    : 'Block Execution'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
