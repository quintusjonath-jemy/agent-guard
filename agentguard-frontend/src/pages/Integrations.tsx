import React, { useState } from 'react';
import { Workflow, Bot, Check, Copy, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export const Integrations: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const samplePythonSnippet = `import requests

# 1. External AI Agent sends action through AgentGuard Gateway
response = requests.post(
    "http://localhost:8000/api/v1/execute",
    headers={"X-API-Key": "ag_live_your_generated_secret_key"},
    json={
        "agent_id": 1,
        "tool": "refund_customer",
        "action": "refund",
        "payload": {
            "customer_id": 381,
            "amount": 8500.0  # Safe <= ₹10,000 threshold
        }
    }
)

result = response.json()
print("AgentGuard Decision:", result["data"]["decision"])
print("Execution Result:", result["data"]["response_payload"])`;

  const sampleN8nNode = `{
  "nodes": [
    {
      "parameters": {
        "url": "http://backend:8000/api/v1/execute",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "X-API-Key",
              "value": "ag_live_your_agentguard_key"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            { "name": "agent_id", "value": "={{$json.agent_id}}" },
            { "name": "tool", "value": "={{$json.tool_name}}" },
            { "name": "action", "value": "={{$json.action}}" },
            { "name": "payload", "value": "={{$json.tool_payload}}" }
          ]
        }
      },
      "name": "AgentGuard Security Firewall",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2
    }
  ]
}`;

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Integrations & Autonomous Workflow Bridge
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Connect n8n autonomous workflows, LangChain agents, or Python services to the AgentGuard security proxy.
        </p>
      </div>

      {/* Architecture Visual Diagram Card */}
      <div className="glass-panel p-6 border-cyan-500/20 bg-cyan-950/10">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-4 h-4" />
          <span>Governance Architecture Pipeline</span>
        </div>
        <div className="p-4 rounded-lg bg-dark-950/80 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre leading-relaxed">
{`n8n AI Agent / Script 
      ↓  (POST /api/v1/execute with X-API-Key)
AgentGuard Core Gateway
      ↓
Authentication → Agent Check → Tool Validation → DLP Scanner → Policy Engine → Risk Engine
      ↓
Decision:
 ┌───────────────────────┬───────────────────────┐
 │ ALLOWED               │ PENDING_APPROVAL      │ BLOCKED
 ↓                       ↓                       ↓
Safe Mock Tool Execution  Supervisor Inbox Alert   Immutable SOC Incident Log`}
        </div>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: n8n Workflow Node */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-orange-950/60 border border-orange-500/30 text-orange-400">
                <Workflow className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">n8n Workflow Node</h3>
                <span className="text-[10px] font-mono text-emerald-400">READY TO IMPORT</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Place the AgentGuard HTTP Request node directly before any tool or database step in your n8n canvas.
            </p>

            <pre className="code-box max-h-48 overflow-auto text-[11px]">
              {sampleN8nNode}
            </pre>
          </div>

          <button
            onClick={() => copyToClipboard(sampleN8nNode, 'n8n')}
            className="mt-4 w-full py-2 rounded-lg bg-dark-950 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
          >
            {copiedSection === 'n8n' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{copiedSection === 'n8n' ? 'Copied JSON!' : 'Copy n8n Node JSON'}</span>
          </button>
        </div>

        {/* Card 2: Python SDK / LangChain */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Python / LangChain Agent</h3>
                <span className="text-[10px] font-mono text-cyan-400">REST API CLIENT</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Wrap your tool calls with the AgentGuard client to ensure every action is independently validated.
            </p>

            <pre className="code-box max-h-48 overflow-auto text-[11px]">
              {samplePythonSnippet}
            </pre>
          </div>

          <button
            onClick={() => copyToClipboard(samplePythonSnippet, 'python')}
            className="mt-4 w-full py-2 rounded-lg bg-dark-950 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
          >
            {copiedSection === 'python' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{copiedSection === 'python' ? 'Copied Code!' : 'Copy Python Snippet'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
