import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEMO_CREDS = [
  { label: 'Admin',   email: 'admin@agentguard.io',   password: 'Admin123!' },
  { label: 'Analyst', email: 'analyst@agentguard.io', password: 'Analyst123!' },
];

export const Login: React.FC = () => {
  const [email, setEmail]       = useState('admin@agentguard.io');
  const [password, setPassword] = useState('Admin123!');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex overflow-hidden">
      {/* Subtle bg texture */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#10A37F]/[0.03] blur-[120px]" />
      </div>

      {/* ── Left: Brand ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between p-14 relative z-10 border-r border-[#2A2A2A]">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#153D34] border border-[#10A37F]/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-brand" strokeWidth={2.5} />
          </div>
          <div className="text-[15px] font-bold text-[#F5F5F5] tracking-tight">AgentGuard</div>
        </div>

        {/* Hero */}
        <div className="max-w-[460px]">
          <h1 className="text-[44px] font-bold text-[#F5F5F5] leading-[1.1] tracking-tight mb-6">
            Secure your AI agents<br />
            <span className="text-[#10A37F]">before they touch<br />the real world.</span>
          </h1>
          <p className="text-[15px] text-[#6F6F6F] leading-relaxed mb-8">
            AI decides what it wants to do.<br />
            <span className="text-[#A1A1A1]">AgentGuard decides whether it is allowed to do it.</span>
          </p>

          {/* Feature list */}
          <div className="space-y-3">
            {[
              'Deterministic security pipeline for every agent action',
              'Real-time DLP scanning, policy enforcement, risk scoring',
              'Human-in-the-loop approvals for critical operations',
              'Immutable audit trail and compliance-ready logging',
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded flex items-center justify-center bg-[#153D34] border border-[#10A37F]/25 flex-shrink-0 mt-0.5">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1 4l2 2 4-4" stroke="#10A37F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-[13px] text-[#A1A1A1] leading-relaxed">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-[11px] text-[#6F6F6F] font-mono">
          AgentGuard · v1.0.0 · Enterprise Edition
        </div>
      </div>

      {/* ── Right: Auth Form ──────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded-lg bg-[#153D34] border border-[#10A37F]/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-brand" strokeWidth={2.5} />
            </div>
            <span className="text-[14px] font-bold text-[#F5F5F5]">AgentGuard</span>
          </div>

          {/* Card */}
          <div className="card-elevated p-8">
            <div className="mb-7">
              <h2 className="text-[22px] font-semibold text-[#F5F5F5] tracking-tight">Sign in</h2>
              <p className="text-[13px] text-[#6F6F6F] mt-1">Access the AgentGuard platform</p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 p-3 rounded-lg bg-[rgba(224,106,98,0.08)] border border-[rgba(224,106,98,0.2)]">
                <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
                <span className="text-[12px] text-[#E06A62]">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="input-label">Email address</label>
                <input
                  id="email-input"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@company.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="input-label">Password</label>
                <div className="relative">
                  <input
                    id="password-input"
                    type={showPw ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6F6F6F] hover:text-[#A1A1A1] transition-colors"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 text-[13px] mt-2"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Demo access */}
            <div className="mt-6 pt-5 border-t border-[#2A2A2A]">
              <p className="text-[11px] text-[#6F6F6F] mb-3">Quick demo access</p>
              <div className="flex gap-2">
                {DEMO_CREDS.map(c => (
                  <button
                    key={c.label}
                    type="button"
                    id={`demo-${c.label.toLowerCase()}`}
                    onClick={() => { setEmail(c.email); setPassword(c.password); }}
                    className="btn-secondary btn-sm flex-1"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-5 text-center text-[12px] text-[#6F6F6F]">
              No account?{' '}
              <Link to="/register" className="text-brand hover:text-[#0d8f6f] font-medium transition-colors">
                Create one
              </Link>
            </p>
          </div>

          <p className="text-center text-[11px] text-[#6F6F6F] font-mono mt-4">
            All access is audited and logged
          </p>
        </div>
      </div>
    </div>
  );
};
