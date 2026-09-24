import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Bot, ArrowRight, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
      setError(
        err.response?.data?.detail || err.response?.data?.error?.message || 'Invalid email or password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col md:flex-row text-slate-100">
      {/* Left Column: Brand Hero */}
      <div className="md:w-1/2 p-10 lg:p-16 flex flex-col justify-between border-r border-slate-800/80 bg-gradient-to-b from-dark-900/60 to-dark-950 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-glow-teal">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white font-mono">
              Agent<span className="text-cyan-400">Guard</span>
            </span>
            <div className="text-[10px] uppercase font-mono text-cyan-400/80 -mt-1">
              The Security Firewall for AI Agents
            </div>
          </div>
        </div>

        <div className="my-12 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            Deterministic AI Governance Layer
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Secure your AI agents before they touch the real world.
          </h1>

          <p className="text-sm text-slate-400 leading-relaxed font-sans">
            AI decides what it wants to do. <br />
            <strong>AgentGuard decides whether it is allowed to do it.</strong>
          </p>

          <div className="grid grid-cols-2 gap-3 pt-4 font-mono text-xs text-slate-300">
            <div className="p-3 rounded-lg bg-dark-950/60 border border-slate-800/80">
              <span className="text-cyan-400 font-bold">✓</span> Least Privilege
            </div>
            <div className="p-3 rounded-lg bg-dark-950/60 border border-slate-800/80">
              <span className="text-cyan-400 font-bold">✓</span> Financial Thresholds
            </div>
            <div className="p-3 rounded-lg bg-dark-950/60 border border-slate-800/80">
              <span className="text-cyan-400 font-bold">✓</span> Prompt Injection Defense
            </div>
            <div className="p-3 rounded-lg bg-dark-950/60 border border-slate-800/80">
              <span className="text-cyan-400 font-bold">✓</span> Real-time SOC Monitor
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          AgentGuard Security Platform • v1.0.0
        </div>
      </div>

      {/* Right Column: Sign In Form */}
      <div className="md:w-1/2 p-10 lg:p-16 flex items-center justify-center">
        <div className="max-w-md w-full glass-panel-elevated p-8 border-slate-800 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Sign In to AgentGuard
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your credentials to access the SOC command center.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-dark-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-dark-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs tracking-wider uppercase shadow-glow-teal transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-2">
              Quick Demo Fill:
            </span>
            <div className="flex gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => fillDemo('admin@agentguard.io', 'Admin123!')}
                className="flex-1 py-1.5 px-2 rounded bg-dark-950 border border-slate-800 hover:border-cyan-500 text-slate-300 text-[11px]"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemo('analyst@agentguard.io', 'Analyst123!')}
                className="flex-1 py-1.5 px-2 rounded bg-dark-950 border border-slate-800 hover:border-cyan-500 text-slate-300 text-[11px]"
              >
                SOC Analyst
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400 font-mono">
            Don't have an account?{' '}
            <Link to="/register" className="text-cyan-400 hover:underline font-bold">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
