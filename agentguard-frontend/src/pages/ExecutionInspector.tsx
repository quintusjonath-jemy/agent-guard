import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Copy, Check, Bot, Clock } from 'lucide-react';
import apiClient from '../api/client';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';

const stepIcon = (status: string) => {
  if (status === 'PASS') return <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />;
  if (status === 'WARN' || status === 'REQUIRED') return <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />;
  return <XCircle className="w-4 h-4 text-danger flex-shrink-0" />;
};

const stepColor = (status: string) => {
  if (status === 'PASS') return 'border-l-success';
  if (status === 'WARN' || status === 'REQUIRED') return 'border-l-warning';
  return 'border-l-danger';
};

export const ExecutionInspector: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const { data: ex, isLoading } = useQuery({
    queryKey: ['execution', id],
    queryFn: () => apiClient.get(`/executions/${id}`).then(r => r.data.data),
  });

  const handleCopy = () => {
    if (ex?.sanitized_payload) {
      navigator.clipboard.writeText(JSON.stringify(ex.sanitized_payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-[900px] mx-auto space-y-4 animate-fade-in">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-32 w-full" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  if (!ex) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-[14px] text-[#6F6F6F]">Execution not found</p>
        <button onClick={() => navigate('/executions')} className="btn-secondary btn-sm mt-4">Back to executions</button>
      </div>
    );
  }

  const isBlocked = ex.decision === 'BLOCKED' || ex.decision === 'FAILED';
  const fmt = (ts: string) => ts ? new Date(ts).toLocaleString() : '—';

  return (
    <div className="p-6 max-w-[900px] mx-auto animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate('/executions')} className="btn-ghost btn-sm mb-5 -ml-2">
        <ArrowLeft className="w-4 h-4" /> Back to executions
      </button>

      {/* Header */}
      <div className="card p-6 mb-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-[11px] font-mono text-[#6F6F6F] mb-1">EXECUTION #{ex.id ?? ex.execution_id}</div>
            <h1 className="text-[22px] font-semibold text-[#F5F5F5] tracking-tight">{ex.agent_name}</h1>
            <div className="text-[13px] font-mono text-[#A1A1A1] mt-1">{ex.tool_name} · {ex.action_name}</div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <RiskBadge level={ex.risk_level} score={ex.risk_score} />
              <StatusBadge status={ex.decision} />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#6F6F6F]">
              <Clock className="w-3.5 h-3.5" />
              {fmt(ex.created_at)}
            </div>
            {ex.duration_ms && (
              <div className="text-[11px] font-mono text-[#6F6F6F]">{ex.duration_ms.toFixed(1)}ms</div>
            )}
          </div>
        </div>

        {/* Plain-English explanation */}
        {(ex.plain_english_explanation || ex.reason) && (
          <div className="mt-5 pt-4 border-t border-[#2A2A2A]">
            <div className="text-[11px] text-[#6F6F6F] mb-1.5 uppercase tracking-wide font-semibold">Decision Explanation</div>
            <p className="text-[13px] text-[#A1A1A1] leading-relaxed">{ex.plain_english_explanation || ex.reason}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Pipeline */}
        <div className="card p-5">
          <h2 className="text-[14px] font-semibold text-[#F5F5F5] mb-4">Security Pipeline</h2>
          <div className="space-y-2">
            {(ex.pipeline_breakdown || []).map((step: any, i: number) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg bg-[#1A1A1A] border-l-2 ${stepColor(step.status)}`}
              >
                {stepIcon(step.status)}
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-[#F5F5F5]">{step.name}</div>
                  {step.details && (
                    <div className="text-[11px] text-[#6F6F6F] mt-0.5 leading-relaxed">{step.details}</div>
                  )}
                </div>
                <span className={`text-[10px] font-mono font-bold flex-shrink-0 ${
                  step.status === 'PASS' ? 'text-success' :
                  step.status === 'WARN' || step.status === 'REQUIRED' ? 'text-warning' : 'text-danger'
                }`}>{step.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payload + Response */}
        <div className="space-y-5">
          {/* Request payload */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[14px] font-semibold text-[#F5F5F5]">Request Payload</h2>
              <button onClick={handleCopy} className="btn-ghost btn-xs">
                {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="code-block text-[11px] max-h-[180px] overflow-auto">
              {JSON.stringify(ex.sanitized_payload ?? {}, null, 2)}
            </div>
          </div>

          {/* Response payload */}
          {ex.response_payload && (
            <div className="card p-5">
              <h2 className="text-[14px] font-semibold text-[#F5F5F5] mb-3">Tool Response</h2>
              <div className="code-block text-[11px] max-h-[200px] overflow-auto">
                {JSON.stringify(ex.response_payload, null, 2)}
              </div>
            </div>
          )}

          {/* Why blocked */}
          {isBlocked && (
            <div className="card p-5" style={{ borderColor: 'rgba(240,68,68,0.15)', background: 'rgba(240,68,68,0.04)' }}>
              <h2 className="text-[13px] font-semibold text-danger mb-3">Why was this action blocked?</h2>
              <div className="text-[12px] text-[#A1A1A1] leading-relaxed space-y-2">
                <p><span className="text-[#F5F5F5] font-medium">{ex.agent_name}</span> attempted to perform <span className="font-mono text-[#F5F5F5]">{ex.action_name}</span> on <span className="font-mono text-[#F5F5F5]">{ex.tool_name}</span>.</p>
                {ex.reason && <p>{ex.reason}</p>}
                <p className="text-[#6F6F6F]">AgentGuard blocked this action to prevent a policy violation. A security incident has been logged and an approval request has been created if required.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
