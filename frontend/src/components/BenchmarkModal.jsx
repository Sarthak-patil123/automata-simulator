import React, { useState } from 'react';
import { X, Layers, Search, Play } from 'lucide-react';
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

  const levelStyle = (level) => {
    if (level.includes('1') || level.toLowerCase().includes('easy')) return 'text-teal-700 bg-teal-50 border-teal-200';
    if (level.includes('2')) return 'text-sky-700 bg-sky-50 border-sky-200';
    if (level.includes('3')) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-zinc-900 flex items-center gap-2">
                Automata Benchmark Suite
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 font-mono border border-brand-200">
                  20 problems
                </span>
              </h2>
              <p className="text-xs text-zinc-500">
                Ground-truth regular languages across 4 difficulty levels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search */}
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between gap-3 flex-wrap bg-zinc-50/50">
          <div className="flex items-center gap-1.5 flex-wrap">
            {levels.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${selectedLevel === lvl
                  ? 'bg-brand-600 text-white border-brand-600 font-bold shadow-xs'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
              >
                {lvl === 'ALL' ? 'All Difficulties' : lvl.replace('Level ', 'L')}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search benchmarks..."
              className="w-full bg-white border border-zinc-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-brand-500 font-mono transition"
            />
          </div>
        </div>

        {/* Grid of Cards — styled strictly like Screenshot 3 */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => {
            const isNfa = item.title?.toLowerCase().includes('nfa') || item.slug?.includes('nfa');
            const machineLabel = isNfa ? 'NFA' : 'DFA';
            const machineBg = isNfa
              ? 'bg-sky-50 text-sky-700 border-sky-200'
              : 'bg-brand-50 text-brand-700 border-brand-200';

            const posStrings = item.csv
              ? item.csv
                .split('\n')
                .slice(1)
                .filter((r) => r.endsWith(',1'))
                .map((r) => r.split(',')[0])
                .filter(Boolean)
              : [];
            const tryString = posStrings[0] || '0101';

            return (
              <div
                key={item.id}
                className="bg-white border border-zinc-200 hover:border-brand-300 rounded-2xl p-5 transition flex flex-col justify-between shadow-xs hover:shadow-md group"
              >
                <div>
                  {/* Top badges */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono border ${machineBg}`}>
                      {machineLabel}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${levelStyle(item.level)}`}>
                      {item.level.split('–')[0]?.trim() || item.level}
                    </span>
                  </div>

                  <h3 className="font-heading text-sm font-bold text-zinc-900 group-hover:text-brand-600 transition mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>

                  {/* TRY row styled after reference */}
                  <div className="mt-3.5 flex items-center gap-2 bg-zinc-50 border border-zinc-200/80 rounded-xl px-3 py-2 font-mono text-xs text-zinc-800">
                    <span className="text-zinc-400 font-bold text-[10px] uppercase">TRY</span>
                    <span className="font-bold tracking-wider">{tryString}</span>
                  </div>
                </div>

                {/* Dark Load Button */}
                <button
                  onClick={() => {
                    onSelectBenchmark(item);
                    onClose();
                  }}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs active:scale-95 group-hover:bg-brand-600"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-brand-400 group-hover:text-white" />
                  <span>Load into canvas</span>
                </button>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-12 text-zinc-400">
              <Layers className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
              <p className="text-sm font-semibold">No benchmarks match your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
