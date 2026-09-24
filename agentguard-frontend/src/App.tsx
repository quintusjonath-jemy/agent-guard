import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppShell } from './layouts/AppShell';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { LiveMonitor } from './pages/LiveMonitor';
import { Agents } from './pages/Agents';
import { AgentDetail } from './pages/AgentDetail';
import { Tools } from './pages/Tools';
import { Policies } from './pages/Policies';
import { Executions } from './pages/Executions';
import { ExecutionInspector } from './pages/ExecutionInspector';
import { Approvals } from './pages/Approvals';
import { SecurityTestLab } from './pages/SecurityTestLab';
import { Incidents } from './pages/Incidents';
import { AuditLogs } from './pages/AuditLogs';
import { Integrations } from './pages/Integrations';
import { ApiKeys } from './pages/ApiKeys';
import { Settings } from './pages/Settings';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center text-cyan-400 font-mono text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span>INITIALIZING AGENTGUARD...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected App Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="live-monitor" element={<LiveMonitor />} />
          <Route path="executions" element={<Executions />} />
          <Route path="executions/:id" element={<ExecutionInspector />} />
          <Route path="agents" element={<Agents />} />
          <Route path="agents/:id" element={<AgentDetail />} />
          <Route path="tools" element={<Tools />} />
          <Route path="policies" element={<Policies />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="security-tests" element={<SecurityTestLab />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="api-keys" element={<ApiKeys />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
