import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FlaskConical,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  Bot,
  Zap,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import apiClient from '../api/client';
import { Agent, SecurityTestReportResponse } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';

export const SecurityTestLab: React.FC = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<number>(1);
  const [running, setRunning] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [report, setReport] = useState<SecurityTestReportResponse | null>(null);

  const queryClient = useQueryClient();

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await apiClient.get('/agents');
      return res.data.data as Agent[];
    },
  });

  const { data: scenarios } = useQuery({
    queryKey: ['scenarios'],
    queryFn: async () => {
      const res = await apiClient.get('/security-tests/scenarios');
      return res.data.data as any[];
    },
  });

  const runTestMutation = useMutation({
    mutationFn: async () => {
      setRunning(true);
      const res = await apiClient.post('/security-tests/run', {
        agent_id: selectedAgentId,
      });
      return res.data.data as SecurityTestReportResponse;
    },
    onSuccess: (data) => {
      setReport(data);
      setRunning(false);
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
    },
    onError: () => {
      setRunning(false);
    },
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Agent Security & Attack Simulator Lab
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Execute controlled attack scenarios against active AI agent policies to benchmark enforcement boundaries.
          </p>
        </div>

        {/* Target Agent Selector & Run Button */}
        <div className="flex items-center gap-3">
          <select
            value={selectedAgentId}
            onChange={(e) => {
              setSelectedAgentId(parseInt(e.target.value));
              setReport(null);
            }}
            className="px-3 py-2 rounded-lg bg-dark-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
          >
            {(agents || []).map((a) => (
              <option key={a.id} value={a.id}>
                Target: {a.name} ({a.provider})
              </option>
            ))}
          </select>

          <button
            onClick={() => runTestMutation.mutate()}
            disabled={running}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs shadow-glow-teal transition-all disabled:opacity-50"
          >
            {running ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Simulating Attacks...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Run 10 Security Tests</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Test Report Banner (if run) */}
      {report && (
        <div className="glass-panel-elevated p-6 border-cyan-500/30 bg-cyan-950/10 shadow-glow-teal animate-in zoom-in-95">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Security Assessment Complete for {report.agent_name}</span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {report.passed_tests} Passed / {report.failed_tests} Intercepted Boundaries
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Tested against Prompt Injections, Financial Bypasses, Excessive Privileges, and Secret Exfiltration.
              </p>
            </div>

            <div className="flex items-center gap-3 font-mono text-center">
              <div className="bg-dark-950/80 px-4 py-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Passed</div>
                <div className="text-lg font-bold text-emerald-400">{report.passed_tests}</div>
              </div>
              <div className="bg-dark-950/80 px-4 py-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Critical</div>
                <div className="text-lg font-bold text-red-400">{report.critical_findings}</div>
              </div>
              <div className="bg-dark-950/80 px-4 py-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">High</div>
                <div className="text-lg font-bold text-orange-400">{report.high_risk_findings}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10 Attack Scenario Cards */}
      <div className="space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400">
          Pre-Configured Attack Scenarios (10 Scenarios)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {((report?.results) || scenarios || []).map((sc: any, idx: number) => {
            const isReportItem = !!report;
            const passed = isReportItem ? sc.passed : true;
            const isExpanded = expandedIndex === idx;

            return (
              <div
                key={idx}
                className={`glass-panel p-5 border transition-all ${
                  isReportItem
                    ? passed
                      ? 'border-emerald-500/30 hover:border-emerald-500/50'
                      : 'border-red-500/40 hover:border-red-500/60 shadow-glow-red'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    {isReportItem ? (
                      passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                      )
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    )}
                    <h4 className="text-sm font-bold text-white font-mono">
                      {sc.name || sc.scenario_name}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-950 border border-slate-800 text-slate-400 uppercase">
                    {sc.category}
                  </span>
                </div>

                <div className="text-xs font-mono text-slate-400 space-y-1 mb-3 pl-5">
                  <div>Tool: <code className="text-cyan-300">{sc.tool}</code></div>
                  {isReportItem && (
                    <div className="flex items-center gap-3">
                      <span>Expected: <strong>{sc.expected_result}</strong></span>
                      <span>•</span>
                      <span>Actual: <strong className={passed ? 'text-emerald-400' : 'text-red-400'}>{sc.actual_result}</strong></span>
                    </div>
                  )}
                </div>

                {/* Practical Remediation Guidance */}
                <div className="mt-3 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                    className="w-full flex items-center justify-between text-left text-xs font-mono text-cyan-400 hover:text-cyan-300"
                  >
                    <span>Remediation Guidance</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 p-3 rounded bg-dark-950 border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed animate-in fade-in">
                      {sc.remediation || sc.remediation_guidance}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
