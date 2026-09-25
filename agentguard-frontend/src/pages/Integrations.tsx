import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plug, ExternalLink, CheckCircle2, XCircle, Copy, Check } from 'lucide-react';
import apiClient from '../api/client';
import { useState } from 'react';

const INTEGRATIONS = [
  { id: 'n8n', name: 'n8n Workflow Automation', desc: 'Connect AI agents through n8n workflows via the AgentGuard webhook gateway.', status: 'connected', url: 'http://localhost:5678', docs: 'https://n8n.io' },
  { id: 'openai', name: 'OpenAI API', desc: 'Monitor and govern OpenAI API calls made by registered agents.', status: 'available', url: null, docs: 'https://platform.openai.com' },
  { id: 'anthropic', name: 'Anthropic Claude', desc: 'Governance layer for Claude-powered agents.', status: 'available', url: null, docs: 'https://anthropic.com' },
];

export const Integrations: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const { data } = useQuery({
    queryKey: ['integrations_status'],
    queryFn: () => apiClient.get('/health').then(r => r.data).catch(() => null),
  });

  const webhookUrl = `${window.location.origin}/api/v1/execute`;

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-[900px] mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-[#F5F5F5]">Integrations</h1>
        <p className="text-[13px] text-[#6F6F6F] mt-1">Connect AgentGuard to your AI infrastructure</p>
      </div>

      {/* Webhook endpoint */}
      <div className="card p-6 mb-6">
        <h2 className="text-[14px] font-semibold text-[#F5F5F5] mb-1">Gateway Endpoint</h2>
        <p className="text-[13px] text-[#6F6F6F] mb-4">Point your agents or orchestration system to this URL to enable security enforcement.</p>
        <div className="flex items-center gap-2">
          <div className="code-block flex-1 text-[12px] py-2.5">{webhookUrl}</div>
          <button onClick={copyWebhook} className="btn-secondary btn-sm flex-shrink-0">
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="mt-5 p-4 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]">
          <p className="text-[12px] text-[#6F6F6F] mb-3 font-semibold uppercase tracking-wide">Example Request</p>
          <pre className="code-block text-[11px] overflow-auto">
{`POST ${webhookUrl}
X-API-Key: your-api-key
Content-Type: application/json

{
  "agent_id": 1,
  "tool": "customer.database",
  "action": "read",
  "payload": { "customer_id": "cust_101" }
}`}</pre>
        </div>
      </div>

      {/* Connected integrations */}
      <div className="grid grid-cols-1 gap-4">
        {INTEGRATIONS.map(int => (
          <div key={int.id} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center flex-shrink-0">
                  <Plug className="w-5 h-5 text-[#A1A1A1]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-[14px] font-semibold text-[#F5F5F5]">{int.name}</h3>
                    {int.status === 'connected' ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : (
                      <span className="badge badge-inactive text-[10px]">Available</span>
                    )}
                  </div>
                  <p className="text-[12px] text-[#6F6F6F]">{int.desc}</p>
                  {int.url && (
                    <div className="text-[11px] font-mono text-brand mt-1.5">{int.url}</div>
                  )}
                </div>
              </div>
              <a
                href={int.docs}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary btn-xs flex-shrink-0"
              >
                Docs <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
