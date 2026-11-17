import React from 'react';
import { Table } from 'lucide-react';

export default function TransitionTable({
  graphData,
  activeState,
  consumedSymbol,
  automatonType = 'DFA',
}) {
  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) return null;

  const alphabet  = graphData.alphabet || ['0', '1'];
  const nodes     = graphData.nodes || [];
  const edges     = graphData.edges || [];
  const startId   = graphData.initial_state;
  const acceptSet = new Set(graphData.accepting_states || []);

  // Build transition map
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
          if (!delta[e.source][sym].includes(e.target)) delta[e.source][sym].push(e.target);
        } else {
          delta[e.source][sym] = e.target;
        }
      }
    });
  });

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm mt-3">
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-gray-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-violet-600 flex items-center gap-2">
          <Table className="w-4 h-4 text-violet-500" />
          Transition Function δ(q, σ)
        </h3>
        <div className="flex items-center gap-3 text-[11px] font-mono text-gray-400">
          <span>Start: <strong className="text-amber-600">→ {startId}</strong></span>
          <span>Accepting: <strong className="text-emerald-600">* [{[...acceptSet].join(', ')}]</strong></span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-gray-400">
              <th className="py-2.5 px-4 font-semibold rounded-tl-lg">State q</th>
              <th className="py-2.5 px-4 font-semibold text-center">Type</th>
              {alphabet.map((sym) => (
                <th key={sym} className="py-2.5 px-4 font-bold text-violet-500 text-center">
                  on '{sym}'
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nodes.map((node) => {
              const isStart    = node.id === startId;
              const isAccept   = acceptSet.has(node.id);
              const isRowActive = node.id === activeState;

              return (
                <tr
                  key={node.id}
                  className={`border-b border-gray-100 transition-colors ${
                    isRowActive
                      ? 'bg-violet-50 font-bold text-gray-900'
                      : 'hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <td className="py-2 px-4 flex items-center gap-2">
                    {isStart  && <span className="text-amber-500 font-extrabold text-sm">→</span>}
                    {isAccept && <span className="text-emerald-500 font-extrabold text-sm">*</span>}
                    <span className={isRowActive ? 'text-violet-700' : ''}>{node.id}</span>
                  </td>

                  <td className="py-2 px-4 text-center">
                    {isAccept ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                        Accepting
                      </span>
                    ) : isStart ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        Start
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-300">Non-accept</span>
                    )}
                  </td>

                  {alphabet.map((sym) => {
                    const target = delta[node.id]?.[sym];
                    const isCellActive = isRowActive && consumedSymbol === sym;
                    let display = '—';
                    if (automatonType === 'NFA') {
                      display = Array.isArray(target) && target.length > 0 ? `{${target.join(', ')}}` : '∅';
                    } else {
                      display = target || '—';
                    }

                    return (
                      <td
                        key={sym}
                        className={`py-2 px-4 text-center transition-all ${
                          isCellActive
                            ? 'bg-violet-600 text-white font-extrabold rounded-md shadow-sm'
                            : ''
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
    </div>
  );
}
