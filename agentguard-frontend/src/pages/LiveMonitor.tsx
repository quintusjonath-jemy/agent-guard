import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Activity, Shield } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';

export const LiveMonitor: React.FC = () => {
  const { isConnected, liveEvents } = useWebSocket();
  const navigate = useNavigate();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [liveEvents.length]);

  const fmt = (ts: string) =>
    ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';

  return (
    <div className="p-6 max-w-[1000px] mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-[#F5F5F5]">Live Monitor</h1>
          <p className="text-[13px] text-[#6F6F6F] mt-1">Real-time security event stream</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`live-dot ${isConnected ? '' : 'gray'}`} />
          <span className="text-[12px] font-mono text-[#A1A1A1]">
            {isConnected ? 'LIVE — WebSocket connected' : 'Reconnecting...'}
          </span>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total Events', val: liveEvents.length },
          { label: 'Blocked', val: liveEvents.filter(e => e.data.decision === 'BLOCKED').length, color: 'text-danger' },
          { label: 'Critical', val: liveEvents.filter(e => e.data.risk_level === 'CRITICAL').length, color: 'text-critical' },
          { label: 'Allowed', val: liveEvents.filter(e => e.data.decision === 'ALLOWED').length, color: 'text-success' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className={`text-[24px] font-bold font-mono ${s.color ?? 'text-[#F5F5F5]'}`}>{s.val}</div>
            <div className="text-[11px] text-[#6F6F6F] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Event feed */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A]">
          <h2 className="text-[14px] font-semibold text-[#F5F5F5]">Security Events</h2>
          <span className="text-[11px] font-mono text-[#6F6F6F]">Last 50 events</span>
        </div>
        <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: '65vh' }}>
          {liveEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Radio className="w-10 h-10 text-[#2A2A2A] mb-3" />
              <p className="text-[14px] font-medium text-[#F5F5F5]">Monitoring is active</p>
              <p className="text-[12px] text-[#6F6F6F] mt-1">Waiting for agent activity...</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1F1F1F]">
              {liveEvents.map((ev, i) => {
                const d = ev.data;
                const isBlocked = d.decision === 'BLOCKED' || d.decision === 'FAILED';
                const isCritical = d.risk_level === 'CRITICAL';
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-4 px-5 py-3.5 hover:bg-[#1A1A1A] cursor-pointer transition-colors animate-enter-row ${isCritical ? 'border-l-2 border-[#F04444] pl-[18px]' : ''}`}
                    onClick={() => d.execution_id && navigate(`/executions/${d.execution_id}`)}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isBlocked ? 'bg-[#F04444]' : 'bg-[#35B77A]'}`} />
                    <div className="text-[11px] font-mono text-[#6F6F6F] w-20 flex-shrink-0 tabular-nums">{fmt(d.timestamp ?? '')}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-[#F5F5F5]">{d.agent_name ?? '—'}</span>
                        <span className="text-[11px] font-mono text-[#6F6F6F]">{d.tool_name}</span>
                        {d.action_name && d.action_name !== d.tool_name && (
                          <span className="text-[11px] font-mono text-[#6F6F6F]">· {d.action_name}</span>
                        )}
                      </div>
                      {d.reason && isBlocked && (
                        <p className="text-[11px] text-[#6F6F6F] mt-0.5 truncate">{d.reason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {d.risk_level && <RiskBadge level={d.risk_level} />}
                      {d.decision && <StatusBadge status={d.decision} />}
                      {d.duration_ms && (
                        <span className="text-[10px] font-mono text-[#6F6F6F] hidden sm:inline">{d.duration_ms.toFixed(0)}ms</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
