import React from 'react';
import { Table, BarChart3, Zap, Activity, X } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   RIGHT PANEL — Transition Table δ(q, σ) + Metrics Inspector
───────────────────────────────────────────────────────────────────────────── */
export default function RightPanel({
  graphData,
  activeState,
  consumedSymbol,
  modelMetrics,
  inferenceEngine,
  automatonType = 'DFA',
  onClose,
}) {
  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];
  const alphabet = graphData?.alphabet || ['0', '1'];
  const startId = graphData?.initial_state;
  const acceptSet = new Set(graphData?.accepting_states || []);

  // Build transition map delta[state][symbol]
  const delta = {};
  nodes.forEach((n) => {
    delta[n.id] = {};
    alphabet.forEach((sym) => {
      delta[n.id][sym] = automatonType === 'NFA' ? [] : '—';
    });
  });

  edges.forEach((e) => {
    const rawSymbols = (e.combined_label || e.symbol || '').split(',');
    rawSymbols.forEach((rawSym) => {
      const sym = rawSym.trim();
      if (delta[e.source] && delta[e.source][sym] !== undefined) {
        if (automatonType === 'NFA') {
          if (!delta[e.source][sym].includes(e.target)) {
            delta[e.source][sym].push(e.target);
          }
        } else {
          delta[e.source][sym] = e.target;
        }
      }
    });
  });

  const accuracy = modelMetrics?.accuracy != null ? (modelMetrics.accuracy * 100).toFixed(1) : null;
  const precision = modelMetrics?.precision != null ? (modelMetrics.precision * 100).toFixed(1) : null;
  const recall = modelMetrics?.recall != null ? (modelMetrics.recall * 100).toFixed(1) : null;
  const f1 = modelMetrics?.f1_score != null ? (modelMetrics.f1_score * 100).toFixed(1) : null;

  return (
    <aside className="w-80 bg-white/95 border-l border-zinc-200/90 shadow-xl backdrop-blur-md flex flex-col h-full overflow-hidden text-zinc-900 animate-slide-right shrink-0 z-20">
      {/* Panel Header */}
      <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-mono font-bold text-xs">
            δ
          </div>
          <div>
            <span className="font-heading font-bold text-xs uppercase tracking-wider text-zinc-900">
              Inspector &amp; Table
            </span>
            <div className="text-[10px] text-zinc-400 font-mono">Transition Function &amp; Metrics</div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* METRICS SECTION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-500 font-mono">
            <span className="uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-brand-600" />
              Machine Metrics
            </span>
            {inferenceEngine && (
              <span className="text-[10px] font-mono text-brand-700 bg-brand-50 border border-brand-200 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                <Zap className="w-2.5 h-2.5 text-brand-600" />
                {inferenceEngine}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-2.5">
              <span className="text-[10px] text-zinc-400 font-mono uppercase font-semibold block">States |Q|</span>
              <span className="text-base font-mono font-bold text-zinc-900">{nodes.length}</span>
            </div>
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-2.5">
              <span className="text-[10px] text-zinc-400 font-mono uppercase font-semibold block">Transitions |δ|</span>
              <span className="text-base font-mono font-bold text-zinc-900">{edges.length}</span>
            </div>
          </div>

          {/* Model Accuracy & Scores */}
          {accuracy !== null && (
            <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-600 font-semibold">Model Accuracy</span>
                <span className="text-sm font-mono font-extrabold text-teal-700">{accuracy}%</span>
              </div>
              <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-teal-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${accuracy}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-1 pt-1 text-center font-mono">
                <div className="p-1 rounded bg-white border border-zinc-200/60">
                  <div className="text-[9px] text-zinc-400 font-semibold">PREC</div>
                  <div className="text-[11px] font-bold text-zinc-800">{precision ? `${precision}%` : '—'}</div>
                </div>
                <div className="p-1 rounded bg-white border border-zinc-200/60">
                  <div className="text-[9px] text-zinc-400 font-semibold">REC</div>
                  <div className="text-[11px] font-bold text-zinc-800">{recall ? `${recall}%` : '—'}</div>
                </div>
                <div className="p-1 rounded bg-white border border-zinc-200/60">
                  <div className="text-[9px] text-zinc-400 font-semibold">F1</div>
                  <div className="text-[11px] font-bold text-indigo-700">{f1 ? `${f1}%` : '—'}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TRANSITION TABLE SECTION */}
        <div className="space-y-3 pt-2 border-t border-zinc-100">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-500 font-mono">
            <span className="uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Table className="w-3.5 h-3.5 text-indigo-600" />
              Transition Function δ(q, σ)
            </span>
          </div>

          {nodes.length > 0 ? (
            <div className="bg-white border border-zinc-200/90 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead className="sticky top-0 bg-zinc-50 border-b border-zinc-200/80 z-10">
                    <tr className="text-zinc-500 text-[10px]">
                      <th className="py-2 px-2.5 font-semibold">State q</th>
                      <th className="py-2 px-1 text-center font-semibold">Type</th>
                      {alphabet.map((sym) => (
                        <th key={sym} className="py-2 px-2 font-bold text-indigo-600 text-center">
                          '{sym}'
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {nodes.map((node) => {
                      const isStart = node.id === startId;
                      const isAccept = acceptSet.has(node.id);
                      const isRowActive = node.id === activeState;

                      return (
                        <tr
                          key={node.id}
                          className={`border-b border-zinc-100 transition-colors ${isRowActive
                            ? 'bg-brand-50 font-bold text-brand-900'
                            : 'hover:bg-zinc-50 text-zinc-700'
                            }`}
                        >
                          <td className="py-2 px-2.5 flex items-center gap-1.5 whitespace-nowrap">
                            {isStart && <span className="text-amber-500 font-extrabold text-xs">→</span>}
                            {isAccept && <span className="text-pink-600 font-extrabold text-xs">*</span>}
                            <span className={isRowActive ? 'text-brand-700 font-bold' : ''}>{node.id}</span>
                          </td>

                          <td className="py-2 px-1 text-center whitespace-nowrap">
                            {isAccept ? (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-pink-50 text-pink-700 border border-pink-200">
                                Acc
                              </span>
                            ) : isStart ? (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                Start
                              </span>
                            ) : (
                              <span className="text-[9px] text-zinc-400">—</span>
                            )}
                          </td>

                          {alphabet.map((sym) => {
                            const target = delta[node.id]?.[sym];
                            const isCellActive = isRowActive && consumedSymbol === sym;
                            let display = '—';
                            if (automatonType === 'NFA') {
                              display = Array.isArray(target) && target.length > 0 ? `{${target.join(',')}}` : '∅';
                            } else {
                              display = target || '—';
                            }

                            return (
                              <td
                                key={sym}
                                className={`py-2 px-2 text-center transition-all ${isCellActive
                                  ? 'bg-brand-100 text-brand-900 font-extrabold'
                                  : 'text-zinc-600'
                                  }`}
                              >
                                {display}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Legend footer */}
              <div className="p-2 border-t border-zinc-100 bg-zinc-50/70 text-[10px] font-mono text-zinc-500 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span className="text-amber-500 font-bold">→</span> Start
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-pink-600 font-bold">*</span> Accepting
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-600"></span> Active
                </span>
              </div>
            </div>
          ) : (
            <div className="p-5 text-center text-zinc-400 font-mono text-xs border border-dashed border-zinc-200 rounded-xl">
              No machine loaded.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

