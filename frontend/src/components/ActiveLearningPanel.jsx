import React, { useState } from 'react';
import { HelpCircle, Check, X, FastForward, CheckCircle2, AlertCircle, ArrowRight, CornerDownLeft } from 'lucide-react';

export default function ActiveLearningPanel({
  hitlMode,
  hitlQuery,
  hitlQueryCount,
  onAnswerQuery,
  onSkipHitl,
  onConfirmConjecture,
  hitlFeedback,
  modelMetrics,
  modelType,
  inferenceEngine,
  alphabet = ['0', '1'],
}) {
  const [counterexample, setCounterexample] = useState('');
  const [ceError, setCeError] = useState(null);

  // Validate counterexample characters
  const handleCounterexampleChange = (val) => {
    setCounterexample(val);
    setCeError(null);
    if (!val) return;
    for (const ch of val) {
      if (!alphabet.includes(ch)) {
        setCeError(`Symbol '${ch}' is not in alphabet {${alphabet.join(', ')}}`);
        return;
      }
    }
  };

  const handleConfirm = (expectedLabel = null) => {
    if (ceError) return;
    onConfirmConjecture(counterexample.trim(), expectedLabel);
    setCounterexample('');
  };

  return (
    <div className="bg-slate-900/90 border-2 border-blue-500/30 rounded-2xl p-5 shadow-xl text-slate-200">
      {/* Step Header */}
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-800">
        <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-[11px] font-mono font-bold">3</span>
          Active Learning & Disambiguation (L*)
        </h2>
        {inferenceEngine && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-700/50">
            {inferenceEngine}
          </span>
        )}
      </div>

      {/* Querying Mode */}
      {hitlMode === 'querying' && hitlQuery && (
        <div className="animate-fadeIn">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-950/40 text-amber-300 border border-amber-800/60 font-mono">
              🔍 Question {hitlQuery.query_index || (hitlQueryCount + 1)} of {hitlQuery.total_queries || 4}
            </span>
            <button
              onClick={onSkipHitl}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold transition"
              title="Skip remaining questions and finalize immediately"
            >
              <span>Skip & Finalize</span>
              <FastForward className="w-3.5 h-3.5 text-blue-400" />
            </button>
          </div>

          {/* Target Query String Display */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center mb-3 shadow-inner">
            <div className="text-slate-400 text-xs mb-1">
              Does your target language <strong className="text-slate-200">ACCEPT</strong> this string?
            </div>
            <div className="text-amber-300 font-mono font-extrabold text-2xl tracking-widest my-1 drop-shadow-md">
              {hitlQuery.query_string === '' ? (
                <span className="text-amber-400 italic font-sans font-normal text-lg">ε (empty string)</span>
              ) : (
                `"${hitlQuery.query_string}"`
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {hitlQuery.query_string === ''
                ? 'Length 0'
                : `Length ${hitlQuery.query_string.length} • Symbols: ${[...new Set(hitlQuery.query_string)].join(', ')}`}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-2">
            <button
              onClick={() => onAnswerQuery(true)}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>YES — Accepted</span>
            </button>

            <button
              onClick={() => onAnswerQuery(false)}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 transition active:scale-95"
            >
              <X className="w-4 h-4" />
              <span>NO — Rejected</span>
            </button>
          </div>

          <div className="text-[10px] text-slate-500 text-center font-mono">
            {hitlQueryCount} queries answered so far • Hard-capped at 4 maximum
          </div>
        </div>
      )}

      {/* Conjecture Ready Mode */}
      {hitlMode === 'conjecture_ready' && (
        <div className="animate-fadeIn">
          <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-xl mb-3 text-emerald-300 text-xs">
            <div className="font-bold flex items-center gap-1.5 text-sm mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Conjecture Hypothesized</span>
            </div>
            <span>
              The AI synthesized a minimal conjecture after {hitlQueryCount} query answers. Inspect the graph on the right.
            </span>
          </div>

          <button
            onClick={() => onConfirmConjecture(null)}
            className="w-full py-2.5 px-4 mb-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition"
          >
            <Check className="w-4 h-4" />
            <span>Yes, This DFA is Correct!</span>
          </button>

          {/* Counterexample Section */}
          <div className="pt-3 border-t border-slate-800">
            <div className="text-xs font-semibold text-slate-300 mb-1">
              Found a mistake? Provide a Counterexample:
            </div>
            <div className="text-[11px] text-slate-400 mb-2">
              Enter any string that this conjecture classifies incorrectly:
            </div>

            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={counterexample}
                onChange={(e) => handleCounterexampleChange(e.target.value)}
                placeholder="e.g. 0101 (or empty for ε)"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => handleConfirm(null)}
                disabled={counterexample === '' || !!ceError}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg disabled:opacity-40 transition flex items-center gap-1"
                title="Auto-flip current conjecture's prediction"
              >
                <span>Submit</span>
                <CornerDownLeft className="w-3 h-3" />
              </button>
            </div>

            {ceError && (
              <div className="text-[11px] text-rose-400 mb-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{ceError}</span>
              </div>
            )}

            {counterexample !== '' && !ceError && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => handleConfirm(true)}
                  className="py-1.5 px-2 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                >
                  <span>➕ Should be ACCEPTED</span>
                </button>
                <button
                  onClick={() => handleConfirm(false)}
                  className="py-1.5 px-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                >
                  <span>➖ Should be REJECTED</span>
                </button>
              </div>
            )}
          </div>

          {hitlFeedback && (
            <div className="mt-3 p-2 rounded-lg bg-blue-950/40 border border-blue-800/40 text-[11px] text-blue-300">
              ℹ️ {hitlFeedback}
            </div>
          )}
        </div>
      )}

      {/* Converged Celebration Mode */}
      {hitlMode === 'converged' && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/60 to-teal-950/60 border border-emerald-700/60 text-center animate-fadeIn">
          <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="text-base font-extrabold text-emerald-300">
            🎉 100% Minimal DFA Converged!
          </div>
          <p className="text-xs text-emerald-200/80 mt-1">
            Exact minimal representation reached after {hitlQueryCount} queries. Ready for simulation testing below.
          </p>
        </div>
      )}

      {/* Idle Mode */}
      {hitlMode === 'idle' && (
        <div className="text-center py-4 text-slate-400 text-xs">
          <p className="mb-2">Initial model generated from dataset.</p>
          <p className="text-[11px] text-slate-500">
            Model is confident and verified with 0 active boundary queries needed.
          </p>
        </div>
      )}
    </div>
  );
}
