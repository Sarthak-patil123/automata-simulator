import React, { useState } from 'react';
import { Sparkles, BookOpen, Layers, Check, Copy, Activity } from 'lucide-react';

export default function Header({
  sessionId,
  onOpenBenchmarks,
  onOpenHelp,
  isBackendHealthy = true,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopySession = () => {
    if (!sessionId) return;
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-6 py-3.5 sticky top-0 z-40 shadow-lg backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-mono font-bold text-lg text-white shadow-md shadow-blue-500/20">
            δ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                Automata Learning Studio
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold uppercase tracking-wider">
                  v2.0 Active L*
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Infer, Verify & Simulate Deterministic & Non-Deterministic Finite Automata
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5">
          {/* Benchmarks Catalog Button */}
          <button
            onClick={onOpenBenchmarks}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            title="Browse all 20 Benchmark Problems"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Benchmark Catalog (20)</span>
          </button>

          {/* Quick Help Guide Button */}
          <button
            onClick={onOpenHelp}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Workflow Guide</span>
          </button>

          {/* Session ID Pill */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 border border-slate-700/80 px-2.5 py-1 rounded-lg text-[11px] font-mono text-slate-400">
            <span className="text-slate-500">Session:</span>
            <span className="text-blue-300 font-semibold">{sessionId ? sessionId.slice(0, 8) : 'init'}...</span>
            <button
              onClick={handleCopySession}
              className="p-1 hover:text-white transition text-slate-400"
              title="Copy Session ID"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          {/* Engine Status */}
          <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-lg text-[11px] font-mono text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="hidden md:inline font-semibold">Engine Ready</span>
          </div>
        </div>
      </div>
    </header>
  );
}
