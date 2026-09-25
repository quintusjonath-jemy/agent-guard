import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlaskConical, Play, CheckCircle2, XCircle, AlertTriangle, Shield, Bot, RefreshCw } from 'lucide-react';
import apiClient from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { RiskBadge } from '../components/RiskBadge';

export const SecurityTestLab: React.FC = () => {
  const qc = useQueryClient();
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [running, setRunning] = useState<Set<string>>(new Set());
  const [lastReport, setLastReport] = useState<any>(null);

  // Fetch agents
  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => apiClient.get('/agents').then(r => r.data.data),
  });

  // Set default agent if none selected
  const activeAgentId = selectedAgentId || (agents.length > 0 ? agents[0].id : null);

  // Fetch preconfigured scenarios from backend
  const { data: scenarios = [] } = useQuery({
    queryKey: ['security_test_scenarios'],
    queryFn: () => apiClient.get('/security-tests/scenarios').then(r => r.data.data),
  });

  // Fetch test execution history
  const { data: testHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['security_tests_history'],
    queryFn: () => apiClient.get('/security-tests?limit=50').then(r => r.data.data),
    refetchInterval: 5000,
  });

  const runTestMutation = useMutation({
    mutationFn: ({ scenarioIds }: { scenarioIds?: string[] }) => {
      if (!activeAgentId) throw new Error('No agent selected');
      return apiClient.post('/security-tests/run', {
        agent_id: activeAgentId,
        scenario_ids: scenarioIds,
      }).then(r => r.data.data);
    },
    onSuccess: (report) => {
      setLastReport(report);
      qc.invalidateQueries({ queryKey: ['security_tests_history'] });
      qc.invalidateQueries({ queryKey: ['dashboard_stats'] });
    },
    onSettled: () => {
      setRunning(new Set());
    },
  });

  const handleRunScenario = (scenarioId: string) => {
    if (!activeAgentId) return;
    setRunning(new Set([scenarioId]));
    runTestMutation.mutate({ scenarioIds: [scenarioId] });
  };

  const handleRunAll = () => {
    if (!activeAgentId) return;
    setRunning(new Set(['ALL']));
    runTestMutation.mutate({});
  };

  const tests = Array.isArray(testHistory) ? testHistory : [];
  const fmt = (ts: string) => ts ? new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

  return (
    <div className="p-6 max-w-[1200px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-[#F5F5F5]">Security Test Lab</h1>
          <p className="text-[13px] text-[#6F6F6F] mt-1">Automated red-team simulations to verify policy & DLP enforcement</p>
        </div>

        {/* Target Agent Selector & Run All Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#141414] border border-[#27272a] rounded-lg px-3 py-1.5">
            <Bot className="w-4 h-4 text-[#A1A1A1]" />
            <select
              className="bg-transparent text-[13px] text-[#F5F5F5] outline-none cursor-pointer"
              value={activeAgentId || ''}
              onChange={(e) => setSelectedAgentId(Number(e.target.value))}
            >
              {agents.map((a: any) => (
                <option key={a.id} value={a.id} className="bg-[#18181b] text-white">
                  Target: {a.name} ({a.environment})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRunAll}
            disabled={runTestMutation.isPending || !activeAgentId}
            className="btn-primary btn-sm flex items-center gap-1.5"
          >
            {running.has('ALL') ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Run All Scenarios
          </button>
        </div>
      </div>

      {/* Last Report Banner if available */}
      {lastReport && (
        <div className="mb-6 p-4 rounded-xl bg-[#141414] border border-[#27272a] flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${lastReport.failed_tests > 0 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
              {lastReport.failed_tests > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-[14px] font-medium text-[#F5F5F5]">
                Simulation Completed: {lastReport.passed_tests} of {lastReport.total_tests} Passed
              </p>
              <p className="text-[12px] text-[#6F6F6F]">
                {lastReport.failed_tests === 0 ? 'All attack vectors successfully defended by AgentGuard firewall.' : `${lastReport.failed_tests} security policies triggered alerts or requires mitigation.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[12px] font-mono">
            <span className="text-success font-semibold">{lastReport.passed_tests} Passed</span>
            <span className={lastReport.critical_findings > 0 ? 'text-critical font-semibold' : 'text-[#6F6F6F]'}>{lastReport.critical_findings} Critical</span>
            <span className={lastReport.high_risk_findings > 0 ? 'text-danger font-semibold' : 'text-[#6F6F6F]'}>{lastReport.high_risk_findings} High</span>
          </div>
        </div>
      )}

      {/* Scenarios Grid */}
      <h2 className="text-[14px] font-semibold text-[#A1A1A1] uppercase tracking-wider mb-3">Red Team Scenarios</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {scenarios.map((s: any) => {
          const isRunning = running.has(s.id) || running.has('ALL');
          return (
            <div key={s.id} className="card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[11px] font-mono text-[#6F6F6F] font-semibold">{s.id}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${s.difficulty === 'HARD' ? 'text-danger border-danger/20 bg-danger/10' : 'text-warning border-warning/20 bg-warning/10'}`}>
                    {s.difficulty}
                  </span>
                </div>
                <h3 className="text-[14px] font-semibold text-[#F5F5F5] mb-1">{s.name}</h3>
                <p className="text-[12px] text-[#6F6F6F] mb-3 leading-relaxed">
                  Category: <span className="text-[#A1A1A1]">{s.category}</span> · Tool: <code className="text-[11px] text-accent">{s.tool}</code>
                </p>
              </div>

              <button
                className={`btn w-full justify-center ${isRunning ? 'btn-secondary' : 'btn-primary'}`}
                onClick={() => !isRunning && handleRunScenario(s.id)}
                disabled={isRunning || !activeAgentId}
              >
                {isRunning ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Simulating...</>
                ) : (
                  <><Play className="w-3.5 h-3.5" /> Execute Attack</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* History Table */}
      <div>
        <h2 className="text-[14px] font-semibold text-[#A1A1A1] uppercase tracking-wider mb-3">Execution History</h2>
        {historyLoading ? (
          <div className="card h-40 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 animate-spin text-[#6F6F6F]" />
          </div>
        ) : tests.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center">
            <FlaskConical className="w-8 h-8 text-[#2A2A2A] mb-3" />
            <p className="text-[14px] text-[#6F6F6F]">No tests run yet</p>
            <p className="text-[12px] text-[#6F6F6F] mt-1">Select an agent and trigger a scenario above</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th>Target Agent</th>
                  <th>Category</th>
                  <th>Firewall Result</th>
                  <th>Risk Level</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((t: any) => (
                  <tr key={t.id}>
                    <td>
                      <div className="text-[13px] font-medium text-[#F5F5F5]">{t.scenario_name}</div>
                      {t.remediation && <div className="text-[11px] text-[#6F6F6F] mt-0.5 line-clamp-1">{t.remediation}</div>}
                    </td>
                    <td className="text-[13px] text-[#A1A1A1]">{t.agent_name || 'Agent'}</td>
                    <td className="text-[12px] text-[#6F6F6F]">{t.category}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${t.passed ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                        {t.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {t.passed ? 'PASS (Defended)' : 'FAIL (Breached)'}
                      </span>
                    </td>
                    <td><RiskBadge level={t.risk_level} /></td>
                    <td className="font-mono text-[11px] text-[#6F6F6F]">{fmt(t.executed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
