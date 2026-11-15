import React from 'react';
import { Table, Sparkles, Check } from 'lucide-react';

export default function TransitionTable({
  graphData,
  activeState,
  consumedSymbol,
  automatonType = 'DFA',
}) {
  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return null;
  }

  const alphabet = graphData.alphabet || ['0', '1'];
  const nodes = graphData.nodes || [];
  const edges = graphData.edges || [];
  const startId = graphData.initial_state;
  const acceptSet = new Set(graphData.accepting_states || []);

  // Build transition map: delta[state][symbol] = target state or set of states
  const delta = {};
  nodes.forEach((n) => {
    delta[n.id] = {};
    alphabet.forEach((sym) => {
      delta[n.id][sym] = automatonType === 'NFA' ? [] : '—';
    });
  });

  edges.forEach((e) => {
    const symbols = (e.combined_label || e.symbol || '').split(',');
    symbols.forEach((rawSym) => {
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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-200 mt-5">
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
          <Table className="w-4 h-4 text-blue-400" />
          Formal Transition Function Table δ(q, σ)
        </h3>
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span>
            Start: <strong className="text-amber-400">→ {startId}</strong>
          </span>
          <span>
            Accepting: <strong className="text-emerald-400">* [{[...acceptSet].join(', ')}]</strong>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
              <th className="py-2.5 px-4 font-semibold">State q</th>
              <th className="py-2.5 px-4 font-semibold text-center">Type</th>
              {alphabet.map((sym) => (
                <th key={sym} className="py-2.5 px-4 font-bold text-blue-300 text-center">
                  on '{sym}'
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
                  className={`border-b border-slate-800/60 transition-colors ${
                    isRowActive
                      ? 'bg-blue-950/40 font-bold text-white'
                      : 'hover:bg-slate-800/30 text-slate-300'
                  }`}
                >
                  {/* State Name with Marker */}
                  <td className="py-2 px-4 flex items-center gap-2">
                    {isStart && <span className="text-amber-400 font-extrabold text-sm">→</span>}
                    {isAccept && <span className="text-emerald-400 font-extrabold text-sm">*</span>}
                    <span className={isRowActive ? 'text-blue-300' : ''}>{node.id}</span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-2 px-4 text-center">
                    {isAccept ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Accepting
                      </span>
                    ) : isStart ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                        Start
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Non-accept</span>
                    )}
                  </td>

                  {/* Transitions */}
                  {alphabet.map((sym) => {
                    const target = delta[node.id]?.[sym];
                    const isCellActive = isRowActive && consumedSymbol === sym;
                    let displayTarget = '—';

                    if (automatonType === 'NFA') {
                      displayTarget = Array.isArray(target) && target.length > 0 ? `{${target.join(', ')}}` : '∅';
                    } else {
                      displayTarget = target || '—';
                    }

                    return (
                      <td
                        key={sym}
                        className={`py-2 px-4 text-center transition-all ${
                          isCellActive
                            ? 'bg-blue-600 text-white font-extrabold rounded-md shadow-md scale-105'
                            : ''
                        }`}
                      >
                        {displayTarget}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
