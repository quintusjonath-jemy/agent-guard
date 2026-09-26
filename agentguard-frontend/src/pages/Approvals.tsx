import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2, XCircle, Clock, AlertTriangle, Eye, ShieldAlert,
  ArrowRight, Sparkles, Filter, ChevronRight, FileCode, Check, X
} from 'lucide-react';
import apiClient from '../api/client';
import { RiskBadge } from '../components/RiskBadge';

interface ApprovalItem {
  id: number;
  execution_id: number;
  requested_by_agent: string;
  agent_name?: string;
  tool_name?: string;
  action_name?: string;
  amount?: number | null;
  risk_score?: number;
  risk_level?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string;
  decision_notes?: string;
  requested_at: string;
  decided_at?: string;
  approved_by?: number;
  approver_name?: string;
  request_payload?: Record<string, any>;
  sanitized_payload?: Record<string, any>;
  pipeline_breakdown?: Array<{
    name: string;
    status: string;
    passed: boolean;
    details: string;
  }>;
}

export const Approvals: React.FC = () => {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [inspectItem, setInspectItem] = useState<ApprovalItem | null>(null);
  const [confirmApproveItem, setConfirmApproveItem] = useState<ApprovalItem | null>(null);
  const [confirmRejectItem, setConfirmRejectItem] = useState<ApprovalItem | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  // Fetch approvals based on active tab
  const { data, isLoading } = useQuery({
    queryKey: ['approvals', activeTab],
    queryFn: () => {
      const url = activeTab === 'PENDING'
        ? '/approvals?status_filter=PENDING&limit=50'
        : '/approvals?limit=50';
      return apiClient.get(url).then(r => r.data.data);
    },
    refetchInterval: 5000,
  });

  // Query pending count separately for tab badge
  const { data: pendingData } = useQuery({
    queryKey: ['approvals', 'pending_count'],
    queryFn: () => apiClient.get('/approvals?status_filter=PENDING&limit=100').then(r => r.data.data),
    refetchInterval: 5000,
  });

  const pendingCount = Array.isArray(pendingData) ? pendingData.length : 0;

  // Decision mutation
  const decideMutation = useMutation({
    mutationFn: ({ id, decision, note }: { id: number; decision: 'APPROVED' | 'REJECTED'; note: string }) => {
      const endpoint = decision === 'APPROVED' ? `/approvals/${id}/approve` : `/approvals/${id}/reject`;
      return apiClient.post(endpoint, { decision_notes: note }).then(r => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals'] });
      qc.invalidateQueries({ queryKey: ['dashboard_stats'] });
      qc.invalidateQueries({ queryKey: ['executions'] });
      setConfirmApproveItem(null);
      setConfirmRejectItem(null);
      setActionNotes('');
    },
  });

  // Simulate High-Risk Demo Scenario (Section 45: FinanceBot ₹85,000 refund)
  const handleSimulateDemo = async () => {
    setIsSimulating(true);
    try {
      await apiClient.post('/execute', {
        agent_id: 1,
        tool: 'refund_customer',
        action: 'refund_customer',
        payload: {
          customer_id: 381,
          amount: 85000,
          reason: 'Customer requested full annual subscription refund bypass',
        },
      });
      qc.invalidateQueries({ queryKey: ['approvals'] });
      qc.invalidateQueries({ queryKey: ['dashboard_stats'] });
      setActiveTab('PENDING');
    } catch (err) {
      console.error('Demo simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const rawApprovals = Array.isArray(data) ? data : (data?.items ?? []);
  const approvals: ApprovalItem[] = activeTab === 'HISTORY'
    ? rawApprovals.filter((a: ApprovalItem) => a.status !== 'PENDING')
    : rawApprovals.filter((a: ApprovalItem) => a.status === 'PENDING');

  const fmtTime = (ts?: string) => {
    if (!ts) return '—';
    try {
      const date = new Date(ts);
      const diffMs = Date.now() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return ts;
    }
  };

  return (
    <div className="p-6 max-w-[1000px] mx-auto animate-fade-in space-y-6">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[24px] font-semibold text-[#F5F5F5] tracking-tight">Human-in-the-Loop Approval Center</h1>
            {pendingCount > 0 && (
              <span className="text-[11px] font-mono font-bold bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444] px-2 py-0.5 rounded-full">
                {pendingCount} REQUIRES REVIEW
              </span>
            )}
          </div>
          <p className="text-[13px] text-[#888] mt-1">
            Supervise autonomous agent actions that exceed policy limits or financial thresholds before execution.
          </p>
        </div>

        {/* Demo Scenario Simulation Button */}
        <button
          onClick={handleSimulateDemo}
          disabled={isSimulating}
          className="btn-secondary btn-sm flex items-center gap-2 whitespace-nowrap self-start sm:self-auto bg-[#1C1C1C] border border-[#333] hover:border-[#555] text-[#ECECEC]"
          title="Simulate FinanceBot attempting a ₹85,000 refund (Policy Limit: ₹10,000)"
        >
          <Sparkles className="w-4 h-4 text-[#F59E0B]" />
          <span>{isSimulating ? 'Dispatching...' : 'Simulate High-Risk Action'}</span>
        </button>
      </div>

      {/* ── Navigation Tabs ──────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-[#222] pb-2">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all ${
            activeTab === 'PENDING'
              ? 'bg-[#222] text-[#F5F5F5] border border-[#333]'
              : 'text-[#888] hover:text-[#CCC]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>Pending Review</span>
          {pendingCount > 0 && (
            <span className="text-[10px] font-mono bg-[#EF4444] text-white px-1.5 py-0.2 rounded-full font-bold">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all ${
            activeTab === 'HISTORY'
              ? 'bg-[#222] text-[#F5F5F5] border border-[#333]'
              : 'text-[#888] hover:text-[#CCC]'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-[#6B7280]" />
          <span>Approval History</span>
        </button>
      </div>

      {/* ── Approvals List ──────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-44 p-6 bg-[#141414] border border-[#222]">
              <div className="skeleton h-full" />
            </div>
          ))}
        </div>
      ) : approvals.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center bg-[#141414] border border-[#222]">
          <div className="w-12 h-12 rounded-full bg-[#10A37F]/10 border border-[#10A37F]/30 flex items-center justify-center text-[#10A37F] mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-[16px] font-medium text-[#F5F5F5]">
            {activeTab === 'PENDING' ? 'All Agent Actions Clear' : 'No Past Approvals Found'}
          </p>
          <p className="text-[13px] text-[#6F6F6F] max-w-md mt-1">
            {activeTab === 'PENDING'
              ? 'There are currently no agent requests waiting for human approval. All autonomous executions are within configured safety bounds.'
              : 'Historical approved or rejected supervisor decisions will be logged here.'}
          </p>
          {activeTab === 'PENDING' && (
            <button
              onClick={handleSimulateDemo}
              disabled={isSimulating}
              className="mt-5 btn-primary btn-sm flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate High-Risk Refund (₹85,000)</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((item) => {
            const agentName = item.agent_name || item.requested_by_agent || 'AI Agent';
            const toolName = item.tool_name || 'custom_tool';
            const isPending = item.status === 'PENDING';
            const isApproved = item.status === 'APPROVED';

            return (
              <div
                key={item.id}
                className="card p-6 bg-[#141414] border border-[#262626] hover:border-[#383838] transition-all rounded-xl"
              >
                {/* Header Tag & Time */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] flex items-center gap-1.5">
                      <ShieldAlert className="w-3 h-3" />
                      {item.risk_level || 'HIGH'} RISK ACTION
                    </span>
                    <span className="text-[12px] font-mono text-[#666]">
                      REQ #{item.id} · EXEC #{item.execution_id}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[12px] font-mono text-[#777]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{fmtTime(item.requested_at)}</span>
                  </div>
                </div>

                {/* Primary Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#1A1A1A] border border-[#262626] rounded-lg mb-4">
                  <div>
                    <div className="text-[11px] font-mono text-[#666] uppercase mb-1">Target Agent</div>
                    <div className="text-[15px] font-semibold text-[#F5F5F5]">{agentName}</div>
                    <div className="text-[12px] font-mono text-[#888] mt-0.5">{toolName} · {item.action_name}</div>
                  </div>

                  <div>
                    <div className="text-[11px] font-mono text-[#666] uppercase mb-1">Action Parameter / Amount</div>
                    {item.amount !== null && item.amount !== undefined ? (
                      <div className="text-[18px] font-semibold font-mono text-[#F59E0B]">
                        ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    ) : (
                      <div className="text-[13px] font-mono text-[#AAA]">Standard Tool Invocation</div>
                    )}
                    <div className="text-[11px] text-[#666] mt-0.5">Policy Limit Threshold: ₹10,000.00</div>
                  </div>

                  <div>
                    <div className="text-[11px] font-mono text-[#666] uppercase mb-1">Risk Evaluation</div>
                    <div className="flex items-center gap-2">
                      <RiskBadge level={item.risk_level || 'HIGH'} />
                      <span className="text-[12px] font-mono text-[#888]">Score: {item.risk_score || 85}/100</span>
                    </div>
                    <div className="text-[11px] text-[#888] mt-1 truncate" title={item.reason}>
                      {item.reason || 'Exceeds configured safety limit.'}
                    </div>
                  </div>
                </div>

                {/* Decision Info (if already decided in history tab) */}
                {!isPending && (
                  <div className="mb-4 p-3 bg-[#181818] border border-[#2A2A2A] rounded-md text-[12px]">
                    <div className="flex items-center gap-2">
                      {isApproved ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approved by {item.approver_name || 'Administrator'}
                        </span>
                      ) : (
                        <span className="text-rose-400 font-semibold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Rejected by {item.approver_name || 'Administrator'}
                        </span>
                      )}
                      <span className="text-[#666]">· {fmtTime(item.decided_at)}</span>
                    </div>
                    {item.decision_notes && (
                      <p className="text-[#999] mt-1 italic font-sans">"{item.decision_notes}"</p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    onClick={() => setInspectItem(item)}
                    className="btn-ghost btn-sm flex items-center gap-1.5 text-[12px] text-[#AAA] hover:text-[#FFF]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Pipeline & Payload</span>
                  </button>

                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setConfirmRejectItem(item);
                          setActionNotes('');
                        }}
                        disabled={decideMutation.isPending}
                        className="btn-danger btn-sm flex items-center gap-1.5 px-3 py-1.5 text-[12px]"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => {
                          setConfirmApproveItem(item);
                          setActionNotes('');
                        }}
                        disabled={decideMutation.isPending}
                        className="btn-primary btn-sm flex items-center gap-1.5 px-4 py-1.5 text-[12px]"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Execute</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Inspect Pipeline & Payload ──────────── */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#141414] border border-[#2E2E2E] rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#222] pb-4">
              <div>
                <h3 className="text-[17px] font-semibold text-[#F5F5F5]">Execution Pipeline Inspector</h3>
                <p className="text-[12px] text-[#888] mt-0.5">
                  Approval Request #{inspectItem.id} · Execution #{inspectItem.execution_id}
                </p>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="text-[#666] hover:text-[#CCC] transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pipeline Checklist */}
            <div>
              <h4 className="text-[12px] font-mono text-[#777] uppercase mb-3">9-Step Security Verification</h4>
              <div className="space-y-2">
                {(inspectItem.pipeline_breakdown || [
                  { name: 'Authentication & Identity', status: 'PASS', passed: true, details: 'Authenticated via API_KEY' },
                  { name: 'Agent Identification', status: 'PASS', passed: true, details: `Identified agent '${inspectItem.agent_name || inspectItem.requested_by_agent}'` },
                  { name: 'Tool Authorization', status: 'PASS', passed: true, details: `Tool '${inspectItem.tool_name}' authorized` },
                  { name: 'Sensitive Data (DLP) Scan', status: 'PASS', passed: true, details: 'No secret leakage detected' },
                  { name: 'Permission & Least Privilege', status: 'FAIL', passed: false, details: 'Requested amount exceeds agent authorization' },
                  { name: 'Policy Engine Evaluation', status: 'WARN', passed: true, details: 'Violated: Financial Limit Enforcement' },
                  { name: 'Risk Engine Scoring', status: 'WARN', passed: true, details: `Score: ${inspectItem.risk_score || 85}/100 (${inspectItem.risk_level || 'HIGH'})` },
                  { name: 'Human Approval Gate', status: 'REQUIRED', passed: false, details: 'Action suspended pending supervisor approval' },
                  { name: 'Final Decision', status: 'WARN', passed: false, details: 'Action state: PENDING_APPROVAL' },
                ]).map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded bg-[#1B1B1B] border border-[#282828] text-[12px]"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        step.status === 'PASS'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : step.status === 'REQUIRED' || step.status === 'WARN'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {step.status === 'PASS' ? '✓' : step.status === 'REQUIRED' ? '!' : step.status === 'WARN' ? '⚠' : '✕'}
                      </div>
                      <span className="font-medium text-[#EEE]">{step.name}</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#888]">{step.details}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sanitized Payload */}
            <div>
              <h4 className="text-[12px] font-mono text-[#777] uppercase mb-2 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5" />
                <span>Sanitized Execution Payload</span>
              </h4>
              <div className="p-3 bg-[#0D0D0D] border border-[#222] rounded-lg font-mono text-[11px] text-[#A3E635] max-h-48 overflow-y-auto">
                <pre>{JSON.stringify(inspectItem.sanitized_payload || inspectItem.request_payload || {}, null, 2)}</pre>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#222]">
              <button
                onClick={() => setInspectItem(null)}
                className="btn-secondary btn-sm"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: High-Risk Confirmation for APPROVAL ─── */}
      {confirmApproveItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#141414] border border-[#2E2E2E] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[#F5F5F5]">Confirm High-Risk Approval</h3>
                <p className="text-[12px] text-[#888]">Supervisory override confirmation</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#1B1B1B] border border-[#282828] rounded-lg text-[12px] text-[#CCC] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#777]">Agent:</span>
                <span className="font-semibold text-white">{confirmApproveItem.agent_name || confirmApproveItem.requested_by_agent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777]">Action:</span>
                <span className="font-mono text-white">{confirmApproveItem.tool_name} · {confirmApproveItem.action_name}</span>
              </div>
              {confirmApproveItem.amount && (
                <div className="flex justify-between">
                  <span className="text-[#777]">Amount:</span>
                  <span className="font-mono font-bold text-amber-400">₹{confirmApproveItem.amount.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-[#888] uppercase">Supervisor Decision Notes (Optional)</label>
              <textarea
                className="input-field w-full text-[12px] h-20 resize-none p-2.5"
                placeholder="e.g. Verified transaction invoice with finance department. Override approved."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
              />
            </div>

            <p className="text-[11px] text-[#777] italic">
              Warning: Confirming will execute this action immediately through AgentGuard's sandbox execution layer and record your identity in the immutable audit log.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmApproveItem(null)}
                className="btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => decideMutation.mutate({
                  id: confirmApproveItem.id,
                  decision: 'APPROVED',
                  note: actionNotes,
                })}
                disabled={decideMutation.isPending}
                className="btn-primary btn-sm flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{decideMutation.isPending ? 'Executing...' : 'Confirm & Execute'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Confirmation for REJECTION ──────────── */}
      {confirmRejectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#141414] border border-[#2E2E2E] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-[#F5F5F5]">Reject & Stop Execution</h3>
                <p className="text-[12px] text-[#888]">Block autonomous agent action</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-[#888] uppercase">Rejection Reason</label>
              <textarea
                className="input-field w-full text-[12px] h-20 resize-none p-2.5"
                placeholder="e.g. Refund exceeds authorized threshold and customer account flagged for review."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmRejectItem(null)}
                className="btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => decideMutation.mutate({
                  id: confirmRejectItem.id,
                  decision: 'REJECTED',
                  note: actionNotes,
                })}
                disabled={decideMutation.isPending}
                className="btn-danger btn-sm flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>{decideMutation.isPending ? 'Blocking...' : 'Confirm Rejection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
