import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEMO_CREDS = [
  { label: 'Super Admin', email: 'admin@agentguard.io', password: 'Admin123!', color: 'cyan' },
  { label: 'SOC Analyst', email: 'analyst@agentguard.io', password: 'Analyst123!', color: 'indigo' },
];

export const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@agentguard.io');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.error?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const featureItems = [
    { title: 'Least Privilege', desc: 'Tool-level permission enforcement per agent' },
    { title: 'Financial Thresholds', desc: 'Monetary limits with human approval gates' },
    { title: 'Prompt Injection Defense', desc: 'AI input sanitization & anomaly detection' },
    { title: 'Real-time SOC Monitor', desc: 'Live WebSocket policy enforcement stream' },
    { title: 'Human-in-the-Loop', desc: 'Mandatory supervisor review for critical ops' },
    { title: 'Immutable Audit Trail', desc: 'Tamper-proof execution log for compliance' },
  ];

  return (
    <div className="min-h-screen bg-dark-950 flex overflow-hidden">
      {/* Background mesh */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-cyan-500/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-indigo-500/[0.04] blur-[100px]" />
        {/* dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:28px_28px]" />
      </div>

      {/* ── Left: Brand Panel ── */}
      <div className="hidden md:flex md:w-[52%] lg:w-[55%] flex-col justify-between p-10 lg:p-14 relative z-10 border-r border-white/[0.05]">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-cyan-400/20 blur-lg" />
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-700/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <div className="text-xl font-extrabold tracking-tight text-white font-mono">
              Agent<span className="text-cyan-400">Guard</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.12em] font-mono text-slate-500">
              AI Firewall Platform
            </div>
          </div>
        </div>

        {/* Hero content */}
        <div className="space-y-8 max-w-[500px]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-mono mb-5">
              <Sparkles className="w-3 h-3" />
              <span>Deterministic AI Governance Layer</span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
              Secure your AI agents<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
                before they act.
              </span>
            </h1>

            <p className="text-slate-400 text-sm mt-4 leading-relaxed">
              AI decides what it wants to do.<br />
              <span className="text-slate-200 font-medium">AgentGuard decides whether it is allowed to do it.</span>
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-3">
            {featureItems.map((f) => (
              <div
                key={f.title}
                className="p-3 rounded-xl bg-dark-800/50 border border-white/[0.05] hover:border-cyan-500/20 transition-all group"
              >
                <div className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors mb-0.5">
                  <span className="text-cyan-500 mr-1.5">✓</span>
                  {f.title}
                </div>
                <div className="text-[10px] text-slate-500 font-mono leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-[10px] font-mono text-slate-600">
          AgentGuard Security Platform &nbsp;·&nbsp; v1.0.0 &nbsp;·&nbsp; Enterprise Edition
        </div>
      </div>

      {/* ── Right: Auth Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-[400px] space-y-6">

          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-base font-extrabold text-white font-mono">
              Agent<span className="text-cyan-400">Guard</span>
            </span>
          </div>

          {/* Card */}
          <div className="glass-panel-elevated p-7">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight">Sign In</h2>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                Access the SOC command center
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="text-xs text-red-300 font-mono">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="section-label block mb-1.5">Email Address</label>
                <input
                  id="email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="operator@agentguard.io"
                />
              </div>

              <div>
                <label className="section-label block mb-1.5">Password</label>
                <div className="relative">
                  <input
                    id="password-input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="••••••••"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600 pointer-events-none" />
                </div>
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 mt-2 text-[13px]"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-dark-950/30 border-t-dark-950 rounded-full animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In to Platform
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Demo fill */}
            <div className="mt-5 pt-4 border-t border-white/[0.06]">
              <p className="section-label mb-2.5">Quick Demo Access</p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_CREDS.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    id={`demo-${c.label.toLowerCase().replace(' ', '-')}`}
                    onClick={() => { setEmail(c.email); setPassword(c.password); }}
                    className="btn-secondary py-2 text-[11px] justify-center hover:border-cyan-500/30 hover:text-cyan-300"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-4 text-center text-[11px] text-slate-500 font-mono">
              No account?{' '}
              <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold">
                Register here
              </Link>
            </p>
          </div>

          <p className="text-center text-[10px] text-slate-600 font-mono">
            Secured by AgentGuard Policy Engine &nbsp;·&nbsp; All access is audited
          </p>
        </div>
      </div>
    </div>
  );
};
