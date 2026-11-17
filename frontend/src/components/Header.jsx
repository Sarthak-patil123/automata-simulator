import React, { useState } from 'react';
import { Layers, BookOpen, Check, Copy } from 'lucide-react';

export default function Header({
  sessionId,
  onOpenBenchmarks,
  onOpenHelp,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopySession = () => {
    if (!sessionId) return;
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          {/* δ logo mark */}
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center font-mono font-bold text-white text-base shadow-sm shadow-violet-200">
            δ
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900 tracking-tight">
              Automata Studio
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200 font-semibold uppercase tracking-wider">
              v2 · L*
            </span>
          </div>
        </div>

        {/* Nav Actions */}
        <div className="flex items-center gap-2">
          {/* Benchmarks */}
          <button
            onClick={onOpenBenchmarks}
            className="px-3.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            title="Browse all 20 benchmark problems"
          >
            <Layers className="w-3.5 h-3.5 text-violet-500" />
            <span>Benchmarks</span>
          </button>

          {/* Guide */}
          <button
            onClick={onOpenHelp}
            className="px-3.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            <span>Guide</span>
          </button>

          {/* Session Pill */}
          <div className="hidden sm:flex items-center gap-1 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-gray-500">
            <span className="text-gray-400">sess:</span>
            <span className="text-violet-600 font-semibold">{sessionId ? sessionId.slice(0, 8) : 'init'}…</span>
            <button
              onClick={handleCopySession}
              className="p-0.5 hover:text-gray-700 transition text-gray-400"
              title="Copy Session ID"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          {/* Engine badge */}
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="hidden md:inline font-semibold">Engine Ready</span>
          </div>
        </div>
      </div>
    </header>
  );
}
