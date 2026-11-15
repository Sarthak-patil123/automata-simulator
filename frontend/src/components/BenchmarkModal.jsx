import React, { useState } from 'react';
import { X, Layers, CheckCircle2, Search, ArrowRight, Tag } from 'lucide-react';
import { BENCHMARK_QUESTIONS } from '../data/benchmarkQuestions';

export default function BenchmarkModal({ isOpen, onClose, onSelectBenchmark }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('ALL');

  if (!isOpen) return null;

  const levels = ['ALL', 'Level 1 – Easy', 'Level 2 – Easy to Moderate', 'Level 3 – Moderate', 'Level 4 – Medium'];

  const filtered = BENCHMARK_QUESTIONS.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'ALL' || q.level.toLowerCase().includes(selectedLevel.toLowerCase());
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Automata Benchmark Suite
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                  20 Curated Problems
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Balanced, ground-truth verified regular languages across 4 difficulty levels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {levels.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedLevel === lvl
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {lvl === 'ALL' ? 'All Difficulties' : lvl.replace('Level ', 'L')}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search benchmarks..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        {/* List of Problems */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-slate-950/70 border border-slate-800 hover:border-blue-500/60 rounded-xl p-4 transition group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-bold border border-blue-800/60">
                    Q{item.id < 10 ? `0${item.id}` : item.id}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {item.level}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-[11px] text-slate-500">
                  {item.sampleCount} samples ({item.positiveCount}+ / {item.negativeCount}−)
                </span>

                <button
                  onClick={() => {
                    onSelectBenchmark(item);
                    onClose();
                  }}
                  className="px-3 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-semibold flex items-center gap-1 transition"
                >
                  <span>Load</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
