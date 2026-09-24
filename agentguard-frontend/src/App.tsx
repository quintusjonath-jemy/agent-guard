import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Shield, Lock, Activity, Bot, Cpu, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl w-full glass-panel-elevated p-10 border border-cyan-500/20 shadow-glow-teal">
        <div className="inline-flex p-4 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 mb-6 animate-pulse-subtle">
          <Shield className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white mb-2">
          Agent<span className="text-cyan-400">Guard</span>
        </h1>
        <p className="text-sm uppercase tracking-widest text-cyan-400/80 font-mono mb-4">
          The Security Firewall for AI Agents
        </p>
        <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-lg mx-auto">
          AI decides what it wants to do. <br className="hidden sm:inline" />
          AgentGuard decides whether it is allowed to do it.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left mb-8">
          <div className="bg-dark-950/80 border border-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-1">
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              AGENTS
            </div>
            <div className="text-lg font-bold text-white">4 Active</div>
          </div>
          <div className="bg-dark-950/80 border border-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-1">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              POLICIES
            </div>
            <div className="text-lg font-bold text-white">5 Enforced</div>
          </div>
          <div className="bg-dark-950/80 border border-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-1">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              GATEWAY
            </div>
            <div className="text-lg font-bold text-white font-mono text-emerald-400">ONLINE</div>
          </div>
          <div className="bg-dark-950/80 border border-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-1">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              RISK SCORE
            </div>
            <div className="text-lg font-bold text-white">96 / 100</div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          Phase 1 Complete — Architecture & Database Ready
        </div>
      </div>
    </div>
  );
}
