import { useEffect, useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export interface LiveSecurityEvent {
  type: string;
  data: {
    execution_id?: number;
    agent_name?: string;
    tool_name?: string;
    action_name?: string;
    decision?: string;
    risk_score?: number;
    risk_level?: string;
    reason?: string;
    duration_ms?: number;
    timestamp?: string;
    approval_id?: number;
    incident_id?: number;
    title?: string;
    severity?: string;
    status?: string;
  };
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [liveEvents, setLiveEvents] = useState<LiveSecurityEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/events`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const parsed: LiveSecurityEvent = JSON.parse(event.data);
        if (parsed.type && parsed.data) {
          setLiveEvents((prev) => [parsed, ...prev.slice(0, 49)]); // Keep last 50 events

          // Invalidate affected TanStack Queries
          if (parsed.type === 'LIVE_SECURITY_EVENT') {
            queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
            queryClient.invalidateQueries({ queryKey: ['executions'] });
            queryClient.invalidateQueries({ queryKey: ['security_trends'] });
          } else if (parsed.type === 'APPROVAL_REQUESTED' || parsed.type === 'APPROVAL_DECIDED') {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
          } else if (parsed.type === 'INCIDENT_CREATED' || parsed.type === 'INCIDENT_UPDATED') {
            queryClient.invalidateQueries({ queryKey: ['incidents'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
          } else if (parsed.type === 'SECURITY_TEST_COMPLETED') {
            queryClient.invalidateQueries({ queryKey: ['security_tests'] });
          }
        }
      } catch (e) {
        // Silent catch for non-json ping/pong
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Auto-reconnect after 3 seconds
      setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [queryClient]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { isConnected, liveEvents };
}
