import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Register: React.FC = () => {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState('SECURITY_ANALYST');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password, role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-6 relative">
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-[#10A37F]/[0.03] blur-[120px]" />
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-7 h-7 rounded-lg bg-[#153D34] border border-[#10A37F]/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-brand" strokeWidth={2.5} />
          </div>
          <span className="text-[14px] font-bold text-[#F5F5F5]">AgentGuard</span>
        </div>

        <div className="card-elevated p-8">
          <div className="mb-7">
            <h1 className="text-[22px] font-semibold text-[#F5F5F5] tracking-tight">Create account</h1>
            <p className="text-[13px] text-[#6F6F6F] mt-1">Join the AgentGuard platform</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-lg bg-[rgba(224,106,98,0.08)] border border-[rgba(224,106,98,0.2)]">
              <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
              <span className="text-[12px] text-danger">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Full Name</label>
              <input id="name-input" type="text" required value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Your name" autoComplete="name" />
            </div>
            <div>
              <label className="input-label">Email address</label>
              <input id="email-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="you@company.com" autoComplete="email" />
            </div>
            <div>
              <label className="input-label">Password</label>
              <input id="password-input" type="password" required value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="••••••••" autoComplete="new-password" />
            </div>
            <div>
              <label className="input-label">Role</label>
              <select id="role-select" value={role} onChange={e => setRole(e.target.value)} className="input-field">
                <option value="SECURITY_ANALYST">Security Analyst</option>
                <option value="ADMIN">Administrator</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>

            <button id="register-submit" type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
              {loading ? (
                <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account...</>
              ) : (
                <>Create account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-[12px] text-[#6F6F6F]">
            Already have an account?{' '}
            <Link to="/login" className="text-brand hover:text-[#0d8f6f] font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
