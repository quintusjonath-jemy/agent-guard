import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  Shield,
  Clock,
  Bot,
  Wrench,
  Activity,
  FileCode,
} from 'lucide-react';
import apiClient from '../api/client';
import { ExecutionDetailResponse } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';

export const ExecutionInspector: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const { data: execution, isLoading } = useQuery({
    queryKey: ['execution', id],
    queryFn: async () => {
      const res = await apiClient.get(`/executions/${id}`);
      return res.data.data as ExecutionDetailResponse;
    },
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
      <div className="py-20 text-center font-mono text-sm text-slate-500 animate-pulse">
        Loading deep execution inspection trace...
      </div>
    );
  }

  const isBlocked = execution.decision === 'BLOCKED';

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/executions')}
          className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Executions Console</span>
        </button>

        <span className="text-xs font-mono text-slate-500">
          Trace ID: EXE-{execution.id.toString().padStart(6, '0')}
        </span>
      </div>

      {/* Header Inspector Banner */}
      <div
        className={`glass-panel-elevated p-6 border ${
          isBlocked ? 'border-red-500/30 bg-red-950/10' : 'border-slate-800'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`p-3.5 rounded-2xl border ${
                isBlocked
                  ? 'bg-red-950/60 border-red-500/40 text-red-400 shadow-glow-red'
                  : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
              }`}
            >
              {isBlocked ? <XCircle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-extrabold text-white tracking-tight font-mono">
                  EXECUTION #{execution.id}
                </h2>
                <StatusBadge status={execution.decision} />
                <RiskBadge level={execution.risk_level} score={execution.risk_score} />
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs font-mono text-slate-400">
                <span>
                  Agent: <strong className="text-white">{execution.agent_name}</strong>
                </span>
                <span>•</span>
                <span>
                  Tool: <strong className="text-cyan-400">{execution.tool_name}</strong>
                </span>
                <span>•</span>
                <span>
                  Action: <strong className="text-slate-300">{execution.action_name}</strong>
                </span>
                <span>•</span>
                <span>Latency: {execution.duration_ms}ms</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">
              {new Date(execution.created_at).toUTCString()}
            </span>
          </div>
        </div>
      </div>

      {/* Plain English Decision Explanation Card */}
      <div className="glass-panel p-6 border-cyan-500/20 bg-cyan-950/10">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-wider font-bold mb-2">
          <Shield className="w-4 h-4" />
          <span>Plain-English Decision Reasoning</span>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed font-sans">
          {execution.plain_english_explanation}
        </p>
      </div>

      {/* Main Grid: Decision Pipeline Timeline + Payload Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Step-by-Step Decision Pipeline (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6">
          <h3 className="text-sm font-bold text-white tracking-tight font-mono mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>DETERMINISTIC DECISION PIPELINE</span>
          </h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
            {(execution.pipeline_breakdown || []).map((step, idx) => {
              const isPass = step.status === 'PASS';
              const isWarn = step.status === 'WARN' || step.status === 'REQUIRED';
              const isFail = step.status === 'FAIL';

              return (
                <div key={idx} className="relative">
                  {/* Pipeline Step Icon */}
                  <span
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isPass
                        ? 'bg-emerald-500 text-dark-950'
                        : isWarn
                        ? 'bg-amber-400 text-dark-950'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {isPass ? '✓' : isWarn ? '!' : '✗'}
                  </span>

                  <div className="bg-dark-950/70 border border-slate-800/80 rounded-lg p-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold font-mono text-white">
                        {step.name}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          isPass
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : isWarn
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {step.status}
                      </span>
                    </div>

                    {step.details && (
                      <p className="text-xs text-slate-400 font-mono mt-1 leading-relaxed">
                        {step.details}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Sanitized Request & Response Payload (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Request Payload */}
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-mono font-bold text-white uppercase">
                  Sanitized Request Payload
                </h4>
              </div>
              <button
                onClick={handleCopy}
                className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <pre className="code-box max-h-56 overflow-auto">
              {JSON.stringify(execution.sanitized_payload || {}, null, 2)}
            </pre>
            <p className="text-[10px] text-slate-500 font-mono mt-2">
              * Sensitive API keys, passwords, and tokens are automatically redacted by AgentGuard DLP.
            </p>
          </div>

          {/* Response Payload (if ALLOWED) */}
          {execution.response_payload && (
            <div className="glass-panel p-6 border-emerald-500/20">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-mono font-bold text-white uppercase">
                  Tool Execution Result
                </h4>
              </div>
              <pre className="code-box max-h-56 overflow-auto text-emerald-300">
                {JSON.stringify(execution.response_payload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
