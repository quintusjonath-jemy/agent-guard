import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FlaskConical, Play, CheckCircle2, XCircle, AlertTriangle,
  Sparkles, ChevronDown, ChevronUp, RotateCcw, Terminal,
  ShieldCheck, TrendingUp, Bot, Target,
} from 'lucide-react';
import apiClient from '../api/client';
import { Agent, SecurityTestReportResponse } from '../types';
import { RiskBadge } from '../components/RiskBadge';

// ── Category badge colors ─────────────────────────────────
const categoryColors: Record<string, string> = {
  'PROMPT_INJECTION':     'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'FINANCIAL_BYPASS':     'bg-amber-500/10  text-amber-400  border-amber-500/20',
  'EXCESSIVE_PRIVILEGE':  'bg-red-500/10    text-red-400    border-red-500/20',
  'SECRET_EXFILTRATION':  'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'DATA_POISONING':       'bg-rose-500/10   text-rose-400   border-rose-500/20',
  'DEFAULT':              'bg-slate-500/10  text-slate-400  border-slate-500/20',
};
const getCategoryStyle = (cat: string) => categoryColors[cat] || categoryColors['DEFAULT'];

export const SecurityTestLab: React.FC = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<number>(1);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [report, setReport] = useState<SecurityTestReportResponse | null>(null);
  const [running, setRunning] = useState(false);

  const queryClient = useQueryClient();

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => (await apiClient.get('/agents')).data.data as Agent[],
  });

  const { data: scenarios } = useQuery({
    queryKey: ['scenarios'],
    queryFn: async () => (await apiClient.get('/security-tests/scenarios')).data.data as any[],
  });

  const runTestMutation = useMutation({
    mutationFn: async () => {
      setRunning(true);
      const res = await apiClient.post('/security-tests/run', { agent_id: selectedAgentId });
      return res.data.data as SecurityTestReportResponse;
    },
    onSuccess: (data) => {
      setReport(data);
      setRunning(false);
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
    },
    onError: () => setRunning(false),
  });

  const items = report?.results || scenarios || [];
  const passRate = report ? Math.round((report.passed_tests / (report.passed_tests + report.failed_tests)) * 100) : null;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <FlaskConical className="w-4.5 h-4.5 text-cyan-400" />
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Security Test Lab</h2>
          </div>
          <p className="text-xs text-slate-500 font-mono ml-[52px]">
            Execute controlled attack scenarios against active AI agent policies to benchmark enforcement boundaries.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <select
            value={selectedAgentId}
            onChange={(e) => { setSelectedAgentId(parseInt(e.target.value)); setReport(null); }}
            className="input-field py-2 w-auto min-w-[180px]"
          >
            {(agents || []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.provider})
              </option>
            ))}
          </select>

          <button
            id="run-security-test"
            onClick={() => runTestMutation.mutate()}
            disabled={running}
            className="btn-primary whitespace-nowrap"
          >
            {running ? (
              <><RotateCcw className="w-3.5 h-3.5 animate-spin" /> Simulating...</>
            ) : (
              <><Play className="w-3.5 h-3.5" /> Run 10 Tests</>
            )}
          </button>
        </div>
      </div>

      {/* ── Report Summary Banner ── */}
      {report && (
        <div className="glass-panel-elevated p-6 border-cyan-500/20 bg-cyan-950/10 animate-slide-up">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 text-[11px] font-mono font-bold uppercase mb-2">
                <Sparkles className="w-4 h-4" />
                Assessment Complete — {report.agent_name}
              </div>
              <h3 className="text-2xl font-extrabold text-white font-mono">
                {report.passed_tests}
                <span className="text-emerald-400"> Passed</span>
                {' '}/ {report.failed_tests}
                <span className="text-red-400"> Intercepted</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Tested against Prompt Injections, Financial Bypasses, Excessive Privileges, and Secret Exfiltration.
              </p>
            </div>

            <div className="flex items-stretch gap-3">
              {/* Pass Rate */}
              <div className="glass-panel px-5 py-3 text-center min-w-[80px]">
                <div className="text-[10px] font-mono text-slate-500 uppercase mb-1">Pass Rate</div>
                <div className={`text-2xl font-extrabold font-mono ${passRate! >= 70 ? 'text-emerald-400' : passRate! >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                  {passRate}%
                </div>
              </div>
              <div className="glass-panel px-5 py-3 text-center min-w-[80px]">
                <div className="text-[10px] font-mono text-slate-500 uppercase mb-1">Critical</div>
                <div className="text-2xl font-extrabold font-mono text-red-400">{report.critical_findings}</div>
              </div>
              <div className="glass-panel px-5 py-3 text-center min-w-[80px]">
                <div className="text-[10px] font-mono text-slate-500 uppercase mb-1">High</div>
                <div className="text-2xl font-extrabold font-mono text-orange-400">{report.high_risk_findings}</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {passRate !== null && (
            <div className="mt-5 pt-4 border-t border-white/[0.05]">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1.5">
                <span>Enforcement Coverage</span>
                <span>{passRate}%</span>
              </div>
              <div className="h-1.5 bg-dark-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    passRate >= 70 ? 'bg-emerald-400' : passRate >= 40 ? 'bg-amber-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${passRate}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Running state ── */}
      {running && (
        <div className="glass-panel p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Terminal className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Executing Attack Simulations...</p>
              <p className="text-xs font-mono text-slate-500 mt-0.5">
                Running 10 adversarial scenarios against policy engine
              </p>
            </div>
            <div className="flex gap-1.5 mt-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-cyan-500/30 animate-pulse"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Scenario Cards ── */}
      {!running && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="section-label">
              {report ? 'Test Results' : 'Pre-Configured Attack Scenarios'} ({items.length})
            </h3>
            {report && (
              <button
                onClick={() => setReport(null)}
                className="text-[11px] font-mono text-slate-500 hover:text-white flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((sc: any, idx: number) => {
              const isReport = !!report;
              const passed = isReport ? sc.passed : true;
              const isExpanded = expandedIndex === idx;
              const category = sc.category || 'DEFAULT';

              return (
                <div
                  key={idx}
                  className={`glass-panel p-5 transition-all duration-200 ${
                    isReport
                      ? passed
                        ? 'border-emerald-500/15 hover:border-emerald-500/30'
                        : 'border-red-500/20 hover:border-red-500/35 ring-critical'
                      : 'hover:border-white/[0.10]'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      {isReport ? (
                        passed
                          ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          : <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                      ) : (
                        <Target className="w-4.5 h-4.5 text-cyan-400 shrink-0" />
                      )}
                      <h4 className="text-[13px] font-bold text-white font-mono leading-tight">
                        {sc.name || sc.scenario_name}
                      </h4>
                    </div>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${getCategoryStyle(category)}`}>
                      {category.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="text-[11px] font-mono space-y-1 pl-8">
                    <div className="text-slate-500">
                      Tool: <code className="text-cyan-300 font-medium">{sc.tool}</code>
                    </div>
                    {isReport && (
                      <div className="flex items-center gap-3 text-slate-500 flex-wrap">
                        <span>Expected: <strong className="text-slate-300">{sc.expected_result}</strong></span>
                        <span className="text-slate-700">•</span>
                        <span>Actual: <strong className={passed ? 'text-emerald-400' : 'text-red-400'}>{sc.actual_result}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Remediation Accordion */}
                  <div className="mt-3 pt-3 border-t border-white/[0.05]">
                    <button
                      onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                      className="w-full flex items-center justify-between text-left text-[11px] font-mono text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Remediation Guidance
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="code-box mt-2 text-slate-300 leading-relaxed animate-fade-in">
                        {sc.remediation || sc.remediation_guidance || 'No guidance available.'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {items.length === 0 && !running && (
            <div className="glass-panel p-12 text-center">
              <FlaskConical className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-mono">Select an agent and run the security suite</p>
              <p className="text-xs text-slate-600 mt-1">10 adversarial attack scenarios will be executed</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
