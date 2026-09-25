import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, CheckCircle2, XCircle, Copy, Check,
  Shield, Bot, Wrench, Activity, FileCode,
  Clock, Zap, AlertOctagon,
} from 'lucide-react';
import apiClient from '../api/client';
import { ExecutionDetailResponse } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';

// ── Pipeline step status helpers ──────────────────────────
const stepMeta = (status: string) => {
  switch (status) {
    case 'PASS':
      return {
        dot: 'bg-emerald-500',
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/20',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      };
    case 'WARN':
    case 'REQUIRED':
      return {
        dot: 'bg-amber-400',
        text: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/20',
        icon: <AlertOctagon className="w-4 h-4 text-amber-400" />,
      };
    case 'FAIL':
    default:
      return {
        dot: 'bg-red-500',
        text: 'text-red-400',
        bg: 'bg-red-500/10 border-red-500/20',
        icon: <XCircle className="w-4 h-4 text-red-400" />,
      };
  }
};

export const ExecutionInspector: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const { data: execution, isLoading } = useQuery({
    queryKey: ['execution', id],
    queryFn: async () => (await apiClient.get(`/executions/${id}`)).data.data as ExecutionDetailResponse,
  });

  const handleCopy = () => {
    if (execution?.sanitized_payload) {
      navigator.clipboard.writeText(JSON.stringify(execution.sanitized_payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading || !execution) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-36 rounded-2xl" />
        <div className="skeleton h-24 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="skeleton h-72 rounded-2xl" />
          <div className="skeleton h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  const isBlocked = execution.decision === 'BLOCKED';
  const traceId = `EXE-${execution.id.toString().padStart(6, '0')}`;

  return (
    <div className="space-y-5 max-w-6xl">

      {/* ── Back + Trace ID ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/executions')}
          className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Executions
        </button>

        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
          {traceId}
        </div>
      </div>

      {/* ── Header Decision Banner ── */}
      <div className={`glass-panel-elevated p-5 lg:p-6 ${
        isBlocked ? 'border-red-500/25 bg-red-950/10 ring-critical' : 'border-emerald-500/20'
      }`}>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            {/* Big icon */}
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 ${
              isBlocked
                ? 'bg-red-950/60 border-red-500/30 shadow-glow-red'
                : 'bg-emerald-950/40 border-emerald-500/25 shadow-glow-emerald'
            }`}>
              {isBlocked
                ? <XCircle className="w-7 h-7 text-red-400" />
                : <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              }
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h2 className="text-lg font-extrabold text-white font-mono tracking-tight">
                  EXECUTION #{execution.id}
                </h2>
                <StatusBadge status={execution.decision} />
                <RiskBadge level={execution.risk_level} score={execution.risk_score} size="md" />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Bot className="w-3 h-3 text-cyan-400" />
                  <span className="text-slate-300">{execution.agent_name}</span>
                </div>
                <span className="text-slate-700">·</span>
                <div className="flex items-center gap-1.5">
                  <Wrench className="w-3 h-3 text-slate-500" />
                  <span className="text-cyan-400">{execution.tool_name}</span>
                </div>
                <span className="text-slate-700">·</span>
                <span>{execution.action_name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 shrink-0">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {new Date(execution.created_at).toLocaleString()}
            </div>
            {execution.duration_ms && (
              <>
                <span>·</span>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  {execution.duration_ms}ms
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Plain English Explanation ── */}
      <div className="glass-panel p-5 border-cyan-500/15 bg-gradient-to-r from-cyan-950/10 to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
            AgentGuard Decision Reasoning
          </span>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed">
          {execution.plain_english_explanation}
        </p>
      </div>

      {/* ── Main Grid: Pipeline + Payload ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ── Decision Pipeline (7 cols) ── */}
        <div className="lg:col-span-7 glass-panel p-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-[11px] font-mono font-bold uppercase tracking-widest text-white">
              Deterministic Decision Pipeline
            </h3>
          </div>

          {/* Timeline */}
          <div className="relative space-y-4">
            {/* Vertical connector line */}
            <div className="absolute left-3.5 top-4 bottom-4 w-px bg-gradient-to-b from-slate-700/60 via-slate-700/40 to-transparent" />

            {(execution.pipeline_breakdown || []).map((step, idx) => {
              const meta = stepMeta(step.status);
              const isLast = idx === (execution.pipeline_breakdown?.length || 0) - 1;

              return (
                <div key={idx} className="flex gap-4">
                  {/* Step Indicator */}
                  <div className="flex flex-col items-center z-10 shrink-0">
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${meta.bg}`}>
                      {meta.icon}
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 pb-1">
                    <div className={`rounded-xl border p-3.5 ${meta.bg}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-semibold font-mono text-white">{step.name}</span>
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-dark-800 ${meta.text}`}>
                          {step.status}
                        </span>
                      </div>
                      {step.details && (
                        <p className="text-[11px] font-mono text-slate-400 leading-relaxed">{step.details}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Payload Inspector (5 cols) ── */}
        <div className="lg:col-span-5 space-y-4">

          {/* Request Payload */}
          <div className="glass-panel p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-white">
                  Sanitized Request Payload
                </h4>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-white transition-colors"
              >
                {copied
                  ? <><Check className="w-3 h-3 text-emerald-400" /> Copied</>
                  : <><Copy className="w-3 h-3" /> Copy</>
                }
              </button>
            </div>

            <pre className="code-box max-h-52 overflow-auto text-[11px]">
              {JSON.stringify(execution.sanitized_payload || {}, null, 2)}
            </pre>

            <p className="text-[9px] text-slate-600 font-mono mt-2 flex items-center gap-1">
              <Shield className="w-2.5 h-2.5" />
              API keys, passwords & tokens are automatically redacted by AgentGuard DLP
            </p>
          </div>

          {/* Response Payload */}
          {execution.response_payload && (
            <div className="glass-panel p-5 border-emerald-500/15">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-white">
                  Tool Execution Result
                </h4>
              </div>
              <pre className="code-box max-h-48 overflow-auto text-[11px] text-emerald-300">
                {JSON.stringify(execution.response_payload, null, 2)}
              </pre>
            </div>
          )}

          {/* Blocked reason */}
          {isBlocked && (
            <div className="glass-panel-danger p-5">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-400">
                  Execution Blocked
                </h4>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                This action was stopped by the AgentGuard policy engine before reaching the tool.
                No external systems were affected.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
