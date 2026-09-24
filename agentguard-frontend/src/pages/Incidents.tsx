import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, ShieldAlert, Clock, UserCheck, MessageSquare } from 'lucide-react';
import apiClient from '../api/client';
import { Incident, IncidentStatus, IncidentSeverity } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { RiskBadge } from '../components/RiskBadge';

export const Incidents: React.FC = () => {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [statusVal, setStatusVal] = useState<IncidentStatus>('INVESTIGATING');
  const [noteVal, setNoteVal] = useState('');

  const queryClient = useQueryClient();

  const { data: incidents, isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const res = await apiClient.get('/incidents');
      return res.data.data as Incident[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, analyst_notes }: { id: number; status: IncidentStatus; analyst_notes: string }) => {
      const res = await apiClient.put(`/incidents/${id}`, { status, analyst_notes });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
      setSelectedIncident(null);
      setNoteVal('');
    },
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;
    updateMutation.mutate({
      id: selectedIncident.id,
      status: statusVal,
      analyst_notes: noteVal,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Security Incident Response Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Triaged security incidents triggered by blocked high-risk agent anomalies and DLP alerts.
          </p>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-500 bg-dark-950/60">
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Incident Title</th>
                <th className="py-3 px-4">Agent</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Detected</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {(incidents || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-mono">
                    No active security incidents recorded.
                  </td>
                </tr>
              ) : (
                incidents?.map((inc) => (
                  <tr key={inc.id} className="hover:bg-dark-850/60 transition-colors">
                    <td className="py-3 px-4">
                      <RiskBadge level={inc.severity} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      <div>{inc.title}</div>
                      <div className="text-[11px] text-slate-400 font-normal line-clamp-1">{inc.description}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-400">
                      {inc.agent_name}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={inc.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(inc.detected_at).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedIncident(inc);
                          setStatusVal(inc.status);
                        }}
                        className="px-3 py-1 rounded bg-dark-950 border border-slate-800 text-xs font-mono text-cyan-400 hover:text-white"
                      >
                        Triage →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Triage Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel-elevated p-6 border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight">
              Triage Incident #{selectedIncident.id}
            </h3>
            <p className="text-xs text-slate-400">
              {selectedIncident.title} • {selectedIncident.agent_name}
            </p>

            <div className="p-3 rounded-lg bg-dark-950 border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed">
              {selectedIncident.description}
            </div>

            {selectedIncident.analyst_notes && (
              <div className="p-3 rounded-lg bg-dark-900 border border-slate-800 text-xs text-cyan-300 font-mono max-h-32 overflow-auto">
                <div className="text-slate-500 uppercase text-[10px] mb-1">Analyst Audit Log:</div>
                {selectedIncident.analyst_notes}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Update SOC Status
                </label>
                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="INVESTIGATING">INVESTIGATING</option>
                  <option value="CONTAINED">CONTAINED</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Append Analyst Notes
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe containment actions, policy adjustments, or root cause..."
                  value={noteVal}
                  onChange={(e) => setNoteVal(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-dark-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="px-4 py-2 rounded-lg bg-dark-900 border border-slate-800 text-xs font-mono text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold"
                >
                  {updateMutation.isPending ? 'Updating...' : 'Save Incident Triage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
