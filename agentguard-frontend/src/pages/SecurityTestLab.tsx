import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlaskConical, Play, CheckCircle2, XCircle, AlertTriangle, ChevronRight, Clock } from 'lucide-react';
import apiClient from '../api/client';
import { StatusBadge } from '../components/StatusBadge';

const SUITES = [
  { id: 'prompt_injection', label: 'Prompt Injection', desc: 'Tests for prompt injection vulnerabilities in AI input pipelines', severity: 'HIGH' },
  { id: 'privilege_escalation', label: 'Privilege Escalation', desc: 'Attempts to access tools beyond agent permission scope', severity: 'CRITICAL' },
  { id: 'data_exfiltration', label: 'Data Exfiltration', desc: 'Tests DLP scanning for sensitive PII and financial data', severity: 'HIGH' },
  { id: 'financial_threshold', label: 'Financial Limits', desc: 'Tests monetary threshold enforcement and approval gates', severity: 'HIGH' },
  { id: 'tool_misuse', label: 'Tool Misuse', desc: 'Detects behavioral anomalies and unusual tool usage patterns', severity: 'MEDIUM' },
  { id: 'rate_limiting', label: 'Rate Limiting', desc: 'Tests action rate limits and velocity controls', severity: 'MEDIUM' },
];

export const SecurityTestLab: React.FC = () => {
  const qc = useQueryClient();
  const [running, setRunning] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['security_tests'],
    queryFn: () => apiClient.get('/security-tests?limit=50').then(r => r.data.data),
    refetchInterval: 5000,
  });

  const runTest = useMutation({
    mutationFn: (suiteId: string) => apiClient.post('/security-tests/run', { test_suite: suiteId }),
    onMutate: (suiteId) => setRunning(r => new Set(r).add(suiteId)),
    onSettled: (_, __, suiteId) => {
      setRunning(r => { const s = new Set(r); s.delete(suiteId); return s; });
      qc.invalidateQueries({ queryKey: ['security_tests'] });
    },
  });

  const tests = Array.isArray(data) ? data : (data?.items ?? []);
  const severityColor = (s: string) => s === 'CRITICAL' ? 'text-critical' : s === 'HIGH' ? 'text-danger' : 'text-warning';

  const fmt = (ts: string) => ts ? new Date(ts).toLocaleString() : '—';

  return (
    <div className="p-6 max-w-[1100px] mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[#F5F5F5]">Security Test Lab</h1>
        <p className="text-[13px] text-[#6F6F6F] mt-1">Automated red-team simulations to verify policy enforcement</p>
      </div>

      {/* Test suites */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {SUITES.map(suite => {
          const isRunning = running.has(suite.id);
          return (
            <div key={suite.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
                  <FlaskConical className="w-4 h-4 text-[#A1A1A1]" />
                </div>
                <span className={`text-[10px] font-mono font-bold ${severityColor(suite.severity)}`}>{suite.severity}</span>
              </div>
              <h3 className="text-[13px] font-semibold text-[#F5F5F5] mb-1">{suite.label}</h3>
              <p className="text-[12px] text-[#6F6F6F] leading-relaxed mb-4">{suite.desc}</p>
              <button
                className={`btn w-full justify-center ${isRunning ? 'btn-secondary' : 'btn-primary'}`}
                onClick={() => !isRunning && runTest.mutate(suite.id)}
                disabled={isRunning}
              >
                {isRunning ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Running...</>
                ) : (
                  <><Play className="w-3.5 h-3.5" /> Run Test</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Results */}
      <div>
        <h2 className="text-[16px] font-semibold text-[#F5F5F5] mb-4">Test Results</h2>
        {isLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="card h-20 p-5"><div className="skeleton h-full" /></div>)}</div>
        ) : tests.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <FlaskConical className="w-8 h-8 text-[#2A2A2A] mb-3" />
            <p className="text-[14px] text-[#6F6F6F]">No tests run yet</p>
            <p className="text-[12px] text-[#6F6F6F] mt-1">Select a test suite above to begin</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Test Suite</th>
                  <th>Status</th>
                  <th>Pass Rate</th>
                  <th className="hidden md:table-cell">Vulnerabilities</th>
                  <th className="hidden lg:table-cell">Duration</th>
                  <th className="hidden lg:table-cell">Run At</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tests.map((t: any) => {
                  const passRate = t.total_tests > 0 ? Math.round((t.passed_tests / t.total_tests) * 100) : 0;
                  return (
                    <tr key={t.id}>
                      <td>
                        <div className="text-[13px] font-medium text-[#F5F5F5]">{t.test_suite_name || t.test_suite}</div>
                        {t.description && <div className="text-[11px] text-[#6F6F6F] mt-0.5">{t.description}</div>}
                      </td>
                      <td><StatusBadge status={t.status} /></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-[#1A1A1A] rounded-full h-1.5" style={{ maxWidth: 80 }}>
                            <div
                              className="h-1.5 rounded-full transition-all"
                              style={{ width: `${passRate}%`, background: passRate >= 80 ? '#35B77A' : passRate >= 60 ? '#D6A84F' : '#F04444' }}
                            />
                          </div>
                          <span className="text-[12px] font-mono text-[#A1A1A1]">{passRate}%</span>
                        </div>
                      </td>
                      <td className="hidden md:table-cell font-mono text-[12px]">
                        <span className={t.vulnerabilities_found > 0 ? 'text-danger' : 'text-success'}>
                          {t.vulnerabilities_found ?? 0}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell font-mono text-[11px] text-[#6F6F6F]">
                        {t.duration_seconds ? `${t.duration_seconds.toFixed(1)}s` : '—'}
                      </td>
                      <td className="hidden lg:table-cell font-mono text-[11px] text-[#6F6F6F]">{fmt(t.created_at)}</td>
                      <td><ChevronRight className="w-4 h-4 text-[#6F6F6F]" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
