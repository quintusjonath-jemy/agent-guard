import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FlaskConical, Play, CheckCircle2, XCircle, AlertTriangle, Shield,
  Bot, RefreshCw, Eye, ShieldAlert, Sparkles, Filter, Check, X,
  FileCode, Layers, Activity, ChevronRight, CheckSquare, Square
} from 'lucide-react';
import apiClient from '../api/client';
import { RiskBadge } from '../components/RiskBadge';

interface Scenario {
  id: string;
  name: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'CRITICAL';
  tool: string;
  action: string;
  payload: Record<string, any>;
  expected_decision: string;
  remediation: string;
}

interface ScenarioResult {
  scenario_id: string;
  scenario_name: string;
  category: string;
  difficulty: string;
  input_data: Record<string, any>;
  expected_result: string;
  actual_result: string;
  passed: boolean;
  risk_level: string;
  violated_control?: string | null;
  remediation_guidance: string;
}

interface TestReport {
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  critical_findings: number;
  high_risk_findings: number;
  medium_findings: number;
  low_findings: number;
  overall_health: string;
  agent_id: number;
  agent_name: string;
  executed_at: string;
  results: ScenarioResult[];
}

export const SecurityTestLab: React.FC = () => {
  const qc = useQueryClient();
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [selectedScenarioIds, setSelectedScenarioIds] = useState<Set<string>>(new Set());
  const [runningScenarios, setRunningScenarios] = useState<Set<string>>(new Set());
  const [lastReport, setLastReport] = useState<TestReport | null>(null);
  const [inspectItem, setInspectItem] = useState<ScenarioResult | any | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'PASSED' | 'FAILED'>('ALL');

  // Fetch agents
  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => apiClient.get('/agents').then(r => r.data.data),
  });

  // Set default agent if none selected
  const activeAgentId = selectedAgentId || (agents.length > 0 ? agents[0].id : null);
  const activeAgent = agents.find((a: any) => a.id === activeAgentId);

  // Fetch preconfigured scenarios from backend
  const { data: scenarios = [] } = useQuery({
    queryKey: ['security_test_scenarios'],
    queryFn: () => apiClient.get('/security-tests/scenarios').then(r => r.data.data),
  });

  // Fetch test execution history
  const { data: testHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['security_tests_history'],
    queryFn: () => apiClient.get('/security-tests?limit=100').then(r => r.data.data),
    refetchInterval: 5000,
  });

  // Run test mutation
  const runTestMutation = useMutation({
    mutationFn: ({ scenarioIds }: { scenarioIds?: string[] }) => {
      if (!activeAgentId) throw new Error('No agent selected');
      return apiClient.post('/security-tests/run', {
        agent_id: activeAgentId,
        scenario_ids: scenarioIds,
      }).then(r => r.data.data);
    },
    onSuccess: (report: TestReport) => {
      setLastReport(report);
      qc.invalidateQueries({ queryKey: ['security_tests_history'] });
      qc.invalidateQueries({ queryKey: ['dashboard_stats'] });
      setSelectedScenarioIds(new Set());
    },
    onSettled: () => {
      setRunningScenarios(new Set());
    },
  });

  // Handlers
  const handleRunSingle = (scenarioId: string) => {
    if (!activeAgentId) return;
    setRunningScenarios(new Set([scenarioId]));
    runTestMutation.mutate({ scenarioIds: [scenarioId] });
  };

  const handleRunSelected = () => {
    if (!activeAgentId || selectedScenarioIds.size === 0) return;
    const ids = Array.from(selectedScenarioIds);
    setRunningScenarios(new Set(ids));
    runTestMutation.mutate({ scenarioIds: ids });
  };

  const handleRunAll = () => {
    if (!activeAgentId) return;
    setRunningScenarios(new Set(['ALL']));
    runTestMutation.mutate({});
  };

  const toggleSelectScenario = (id: string) => {
    setSelectedScenarioIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllScenarios = () => {
    if (selectedScenarioIds.size === scenarios.length) {
      setSelectedScenarioIds(new Set());
    } else {
      setSelectedScenarioIds(new Set(scenarios.map((s: Scenario) => s.id)));
    }
  };

  // History calculation
  const historyList = Array.isArray(testHistory) ? testHistory : [];
  const filteredHistory = historyList.filter((item: any) => {
    if (historyFilter === 'PASSED') return item.passed === true;
    if (historyFilter === 'FAILED') return item.passed === false;
    return true;
  });

  const totalTestsRun = historyList.length;
  const passedTestsCount = historyList.filter((t: any) => t.passed).length;
  const passRate = totalTestsRun > 0 ? Math.round((passedTestsCount / totalTestsRun) * 100) : 100;
  const criticalFindingsCount = historyList.filter((t: any) => !t.passed && t.risk_level === 'CRITICAL').length;
  const highFindingsCount = historyList.filter((t: any) => !t.passed && t.risk_level === 'HIGH').length;

  const fmtDate = (ts?: string) => {
    if (!ts) return '—';
    try {
      const d = new Date(ts);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return ts;
    }
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto animate-fade-in space-y-6">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <FlaskConical className="w-4 h-4" />
            </div>
            <h1 className="text-[24px] font-semibold text-[#F5F5F5] tracking-tight">Security & Attack Simulator</h1>
          </div>
          <p className="text-[13px] text-[#888] mt-1">
            Controlled, harmless red-team simulations to benchmark agent policies, DLP boundaries, and financial limits.
          </p>
        </div>

        {/* Target Agent Selector & Main Execution Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-[#161616] border border-[#2A2A2A] rounded-lg px-3 py-1.5">
            <Bot className="w-4 h-4 text-emerald-400" />
            <select
              className="bg-transparent text-[13px] text-[#F5F5F5] outline-none cursor-pointer font-medium"
              value={activeAgentId || ''}
              onChange={(e) => setSelectedAgentId(Number(e.target.value))}
            >
              {agents.map((a: any) => (
                <option key={a.id} value={a.id} className="bg-[#1C1C1C] text-white">
                  Target: {a.name} ({a.environment})
                </option>
              ))}
            </select>
          </div>

          {selectedScenarioIds.size > 0 && (
            <button
              onClick={handleRunSelected}
              disabled={runTestMutation.isPending || !activeAgentId}
              className="btn-secondary btn-sm flex items-center gap-1.5 border-[#F59E0B]/40 text-[#F59E0B]"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Run Selected ({selectedScenarioIds.size})</span>
            </button>
          )}

          <button
            onClick={handleRunAll}
            disabled={runTestMutation.isPending || !activeAgentId}
            className="btn-primary btn-sm flex items-center gap-1.5"
          >
            {runningScenarios.has('ALL') ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>Run All 10 Scenarios</span>
          </button>
        </div>
      </div>

      {/* ── Simulator Metric Cards (Section 15) ───────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 bg-[#141414] border border-[#222]">
          <div className="text-[11px] font-mono text-[#777] uppercase">Simulations Run</div>
          <div className="text-[22px] font-bold font-mono text-[#F5F5F5] mt-1">{totalTestsRun}</div>
          <div className="text-[11px] text-[#888] mt-0.5">Automated test executions</div>
        </div>

        <div className="card p-4 bg-[#141414] border border-[#222]">
          <div className="text-[11px] font-mono text-[#777] uppercase">Defense Pass Rate</div>
          <div className="text-[22px] font-bold font-mono text-emerald-400 mt-1">{passRate}%</div>
          <div className="text-[11px] text-[#888] mt-0.5">{passedTestsCount} defended / {totalTestsRun} total</div>
        </div>

        <div className="card p-4 bg-[#141414] border border-[#222]">
          <div className="text-[11px] font-mono text-[#777] uppercase">Critical Findings</div>
          <div className={`text-[22px] font-bold font-mono mt-1 ${criticalFindingsCount > 0 ? 'text-rose-500' : 'text-[#888]'}`}>
            {criticalFindingsCount}
          </div>
          <div className="text-[11px] text-[#888] mt-0.5">Urgent policy gaps</div>
        </div>

        <div className="card p-4 bg-[#141414] border border-[#222]">
          <div className="text-[11px] font-mono text-[#777] uppercase">High-Risk Warnings</div>
          <div className={`text-[22px] font-bold font-mono mt-1 ${highFindingsCount > 0 ? 'text-amber-400' : 'text-[#888]'}`}>
            {highFindingsCount}
          </div>
          <div className="text-[11px] text-[#888] mt-0.5">Elevated risk anomalies</div>
        </div>
      </div>

      {/* ── Latest Test Report Banner (Section 31) ───────── */}
      {lastReport && (
        <div className="p-5 rounded-xl bg-[#141414] border border-[#2A2A2A] shadow-xl animate-fade-in space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222] pb-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                lastReport.failed_tests > 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {lastReport.failed_tests > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[#F5F5F5]">
                  Security Test Benchmark Report: {lastReport.agent_name}
                </h3>
                <p className="text-[12px] text-[#888] mt-0.5">
                  {lastReport.total_tests} scenarios evaluated · {lastReport.passed_tests} Defended · {lastReport.failed_tests} Breached
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-md uppercase border ${
                lastReport.overall_health === 'SECURE'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : lastReport.overall_health === 'ATTENTION_REQUIRED'
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
              }`}>
                STATUS: {lastReport.overall_health}
              </span>
            </div>
          </div>

          {/* Quick results badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px] font-mono">
            <div className="p-2.5 bg-[#1A1A1A] rounded border border-[#252525] flex justify-between">
              <span className="text-[#777]">Defended:</span>
              <span className="text-emerald-400 font-semibold">{lastReport.passed_tests}</span>
            </div>
            <div className="p-2.5 bg-[#1A1A1A] rounded border border-[#252525] flex justify-between">
              <span className="text-[#777]">Critical Gaps:</span>
              <span className={lastReport.critical_findings > 0 ? 'text-rose-400 font-bold' : 'text-[#777]'}>{lastReport.critical_findings}</span>
            </div>
            <div className="p-2.5 bg-[#1A1A1A] rounded border border-[#252525] flex justify-between">
              <span className="text-[#777]">High Gaps:</span>
              <span className={lastReport.high_risk_findings > 0 ? 'text-amber-400 font-bold' : 'text-[#777]'}>{lastReport.high_risk_findings}</span>
            </div>
            <div className="p-2.5 bg-[#1A1A1A] rounded border border-[#252525] flex justify-between">
              <span className="text-[#777]">Medium / Low:</span>
              <span className="text-[#AAA] font-semibold">{lastReport.medium_findings + lastReport.low_findings}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 10 Red Team Attack Scenarios Grid (Section 14) ─── */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h2 className="text-[14px] font-semibold text-[#A1A1A1] uppercase tracking-wider">Pre-Configured Attack Scenarios</h2>
            <p className="text-[12px] text-[#777] mt-0.5">Click any scenario to execute it individually or check multiple to run a batch.</p>
          </div>
          <button
            onClick={selectAllScenarios}
            className="text-[12px] font-mono text-[#888] hover:text-[#CCC] flex items-center gap-1.5 transition-colors"
          >
            {selectedScenarioIds.size === scenarios.length ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4" />}
            <span>{selectedScenarioIds.size === scenarios.length ? 'Deselect All' : 'Select All'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map((s: Scenario) => {
            const isRunning = runningScenarios.has(s.id) || runningScenarios.has('ALL');
            const isSelected = selectedScenarioIds.has(s.id);

            return (
              <div
                key={s.id}
                className={`card p-5 bg-[#141414] border transition-all flex flex-col justify-between rounded-xl ${
                  isSelected ? 'border-emerald-500/50 bg-[#161B18]' : 'border-[#262626] hover:border-[#383838]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSelectScenario(s.id)}
                        className="text-[#666] hover:text-[#DDD] p-0.5 transition-colors"
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4" />}
                      </button>
                      <span className="text-[11px] font-mono font-bold text-[#888]">{s.id}</span>
                    </div>

                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                      s.difficulty === 'CRITICAL'
                        ? 'text-rose-400 border-rose-500/30 bg-rose-500/10'
                        : s.difficulty === 'HARD'
                        ? 'text-orange-400 border-orange-500/30 bg-orange-500/10'
                        : s.difficulty === 'MEDIUM'
                        ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                        : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                    }`}>
                      {s.difficulty}
                    </span>
                  </div>

                  <h3 className="text-[14px] font-semibold text-[#F5F5F5] mb-1.5 leading-snug">{s.name}</h3>
                  <div className="text-[12px] text-[#777] mb-3 space-y-1">
                    <div>Category: <span className="text-[#BBB] font-medium">{s.category}</span></div>
                    <div>Target: <code className="text-[11px] text-emerald-400 font-mono">{s.tool} · {s.action}</code></div>
                    <div>Expected Defense: <span className="text-amber-400/90 font-mono text-[11px]">{s.expected_decision}</span></div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#222]">
                  <button
                    onClick={() => setInspectItem({
                      scenario_id: s.id,
                      scenario_name: s.name,
                      category: s.category,
                      difficulty: s.difficulty,
                      input_data: s.payload,
                      expected_result: s.expected_decision,
                      actual_result: 'Not yet run in this view',
                      passed: true,
                      risk_level: s.difficulty === 'CRITICAL' ? 'CRITICAL' : s.difficulty === 'HARD' ? 'HIGH' : 'MEDIUM',
                      remediation_guidance: s.remediation,
                    })}
                    className="btn-ghost btn-xs text-[#888] hover:text-white flex items-center gap-1"
                    title="View payload and scenario details"
                  >
                    <Eye className="w-3 h-3" /> Details
                  </button>

                  <button
                    className={`btn-sm flex-1 justify-center flex items-center gap-1.5 ${isRunning ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => !isRunning && handleRunSingle(s.id)}
                    disabled={isRunning || !activeAgentId}
                  >
                    {isRunning ? (
                      <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Simulating...</>
                    ) : (
                      <><Play className="w-3.5 h-3.5" /> Execute</>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Test Execution History (Section 15 & 31) ────────── */}
      <div className="space-y-3 pt-4 border-t border-[#222]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-semibold text-[#A1A1A1] uppercase tracking-wider">Benchmark History</h2>
            <p className="text-[12px] text-[#777] mt-0.5">Click any row to inspect the full input payload, results, and recommended remediation.</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-[#141414] border border-[#262626] p-1 rounded-lg self-start sm:self-auto">
            {(['ALL', 'PASSED', 'FAILED'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setHistoryFilter(filter)}
                className={`px-2.5 py-1 text-[11px] font-mono rounded font-medium transition-all ${
                  historyFilter === filter
                    ? 'bg-[#2A2A2A] text-white'
                    : 'text-[#777] hover:text-[#BBB]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {historyLoading ? (
          <div className="card h-40 flex items-center justify-center bg-[#141414] border border-[#222]">
            <RefreshCw className="w-5 h-5 animate-spin text-[#6F6F6F]" />
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center bg-[#141414] border border-[#222]">
            <FlaskConical className="w-8 h-8 text-[#333] mb-3" />
            <p className="text-[14px] text-[#888]">No matching simulation records</p>
            <p className="text-[12px] text-[#666] mt-1">Run an attack scenario from the grid above to benchmark security defenses.</p>
          </div>
        ) : (
          <div className="card overflow-hidden bg-[#141414] border border-[#262626] rounded-xl">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th>Target Agent</th>
                  <th>Category</th>
                  <th>Firewall Result</th>
                  <th>Risk Tier</th>
                  <th>Timestamp</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((t: any) => (
                  <tr
                    key={t.id}
                    onClick={() => setInspectItem({
                      scenario_id: t.id,
                      scenario_name: t.scenario_name,
                      category: t.category,
                      difficulty: t.risk_level || 'MEDIUM',
                      input_data: t.input_data || {},
                      expected_result: t.expected_result,
                      actual_result: t.actual_result,
                      passed: t.passed,
                      risk_level: t.risk_level,
                      remediation_guidance: t.remediation || 'Enforce configured least-privilege policies.',
                    })}
                    className="cursor-pointer hover:bg-[#1A1A1A] transition-colors"
                  >
                    <td>
                      <div className="text-[13px] font-medium text-[#F5F5F5]">{t.scenario_name}</div>
                      {t.remediation && (
                        <div className="text-[11px] text-[#777] mt-0.5 line-clamp-1">{t.remediation}</div>
                      )}
                    </td>
                    <td className="text-[13px] font-medium text-[#BBB]">{t.agent_name || 'Agent'}</td>
                    <td className="text-[12px] text-[#777]">{t.category}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                        t.passed ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                      }`}>
                        {t.passed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {t.passed ? 'PASS (Defended)' : 'FAIL (Breached)'}
                      </span>
                    </td>
                    <td><RiskBadge level={t.risk_level} /></td>
                    <td className="font-mono text-[11px] text-[#777]">{fmtDate(t.executed_at)}</td>
                    <td className="text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectItem({
                            scenario_id: t.id,
                            scenario_name: t.scenario_name,
                            category: t.category,
                            difficulty: t.risk_level || 'MEDIUM',
                            input_data: t.input_data || {},
                            expected_result: t.expected_result,
                            actual_result: t.actual_result,
                            passed: t.passed,
                            risk_level: t.risk_level,
                            remediation_guidance: t.remediation || 'Enforce configured least-privilege policies.',
                          });
                        }}
                        className="btn-ghost btn-xs text-[#888] hover:text-white"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal: Inspect Scenario & Remediation Guidance (Section 31) ── */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#141414] border border-[#2E2E2E] rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#222] pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                    inspectItem.passed ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-rose-400 border-rose-500/30 bg-rose-500/10'
                  }`}>
                    {inspectItem.passed ? '✓ DEFENSE SUCCESS' : '✕ SECURITY BREACH'}
                  </span>
                  <RiskBadge level={inspectItem.risk_level || 'HIGH'} />
                </div>
                <h3 className="text-[17px] font-semibold text-[#F5F5F5]">{inspectItem.scenario_name}</h3>
                <p className="text-[12px] text-[#888] mt-0.5">Category: {inspectItem.category}</p>
              </div>

              <button
                onClick={() => setInspectItem(null)}
                className="text-[#666] hover:text-[#CCC] transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#1A1A1A] border border-[#262626] rounded-lg text-[12px]">
              <div>
                <div className="text-[11px] font-mono text-[#777] uppercase mb-0.5">Expected Decision</div>
                <div className="font-mono text-[#F59E0B] font-semibold">{inspectItem.expected_result}</div>
              </div>
              <div>
                <div className="text-[11px] font-mono text-[#777] uppercase mb-0.5">Actual AgentGuard Decision</div>
                <div className={`font-mono font-semibold ${inspectItem.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {inspectItem.actual_result}
                </div>
              </div>
            </div>

            {/* Simulated Attack Payload */}
            <div>
              <h4 className="text-[12px] font-mono text-[#777] uppercase mb-2 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simulated Attack Payload (Input)</span>
              </h4>
              <div className="p-3 bg-[#0D0D0D] border border-[#222] rounded-lg font-mono text-[11px] text-[#A3E635] max-h-44 overflow-y-auto">
                <pre>{JSON.stringify(inspectItem.input_data || {}, null, 2)}</pre>
              </div>
            </div>

            {/* Actionable Engineering Remediation Guidance (Section 31 requirement) */}
            <div className="p-4 bg-[#181818] border border-[#2A2A2A] rounded-lg space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 text-[12px] font-semibold">
                <ShieldAlert className="w-4 h-4" />
                <span>Recommended Engineering Remediation</span>
              </div>
              <p className="text-[12px] text-[#CCC] leading-relaxed">
                {inspectItem.remediation_guidance}
              </p>
              <p className="text-[10px] text-[#666] italic mt-1">
                * General security engineering recommendations for configuring least-privilege agent policies.
              </p>
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
    </div>
  );
};
