export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SECURITY_ANALYST' | 'VIEWER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type AgentStatus = 'ACTIVE' | 'PAUSED' | 'DISABLED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ExecutionDecision = 'ALLOWED' | 'BLOCKED' | 'PENDING_APPROVAL' | 'FAILED';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED';
export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type PolicyType =
  | 'FINANCIAL_LIMIT'
  | 'DATA_ACCESS'
  | 'EXTERNAL_COMMUNICATION'
  | 'DELETE_OPERATION'
  | 'RATE_LIMIT'
  | 'APPROVAL_REQUIRED'
  | 'SENSITIVE_DATA'
  | 'TOOL_RESTRICTION';

export type PermissionType =
  | 'READ'
  | 'WRITE'
  | 'DELETE'
  | 'FINANCIAL'
  | 'EXTERNAL_COMMUNICATION'
  | 'SENSITIVE_DATA'
  | 'DATABASE_EXPORT'
  | 'FILE_MODIFICATION';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: number;
  name: string;
  description?: string;
  provider: string;
  environment: string;
  status: AgentStatus;
  risk_level: RiskLevel;
  security_score: number;
  owner_id?: number;
  tools_count?: number;
  policies_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Tool {
  id: number;
  name: string;
  description?: string;
  tool_type: string;
  endpoint?: string;
  risk_level: RiskLevel;
  required_permission: PermissionType;
  requires_approval: boolean;
  enabled: boolean;
  usage_count?: number;
  created_at: string;
}

export interface Policy {
  id: number;
  name: string;
  description?: string;
  policy_type: PolicyType;
  rule_definition: Record<string, any>;
  severity: RiskLevel;
  enabled: boolean;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface ExecutionPipelineStep {
  name: string;
  passed: boolean;
  status: 'PASS' | 'FAIL' | 'WARN' | 'REQUIRED';
  details?: string;
}

export interface Execution {
  id: number;
  agent_id: number;
  agent_name?: string;
  tool_id?: number;
  tool_name?: string;
  action_name: string;
  request_payload?: Record<string, any>;
  sanitized_payload?: Record<string, any>;
  decision: ExecutionDecision;
  risk_score: number;
  risk_level: RiskLevel;
  reason?: string;
  pipeline_breakdown?: ExecutionPipelineStep[];
  execution_status: string;
  response_payload?: Record<string, any>;
  duration_ms: number;
  created_at: string;
}

export interface Approval {
  id: number;
  execution_id: number;
  requested_by_agent: string;
  action_name?: string;
  amount?: number;
  risk_score?: number;
  risk_level?: RiskLevel;
  approved_by?: number;
  status: ApprovalStatus;
  reason?: string;
  decision_notes?: string;
  requested_at: string;
  decided_at?: string;
  execution?: Execution;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_name?: string;
  agent_id?: number;
  agent_name?: string;
  event_type: string;
  action: string;
  decision?: string;
  risk_level?: string;
  description: string;
  metadata_json?: Record<string, any>;
  ip_address: string;
  created_at: string;
}

export interface Incident {
  id: number;
  title: string;
  description: string;
  severity: IncidentSeverity;
  agent_id: number;
  agent_name?: string;
  execution_id?: number;
  status: IncidentStatus;
  assigned_to?: number;
  assignee_name?: string;
  analyst_notes?: string;
  detected_at: string;
  resolved_at?: string;
}

export interface SecurityTest {
  id: number;
  agent_id: number;
  agent_name?: string;
  scenario_name: string;
  category: string;
  input_data: Record<string, any>;
  expected_result: string;
  actual_result: string;
  passed: boolean;
  risk_level: RiskLevel;
  remediation?: string;
  executed_at: string;
}

export interface APIKey {
  id: number;
  name: string;
  prefix: string;
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
  expires_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
