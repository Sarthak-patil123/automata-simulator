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

  const handleCounterexampleChange = (val) => {
    setCounterexample(val);
    setCeError(null);
    if (!val) return;
    for (const ch of val) {
      if (!alphabet.includes(ch)) {
        setCeError(`Symbol '${ch}' not in alphabet {${alphabet.join(', ')}}`);
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
    <div className="bg-white border-2 border-violet-200 rounded-2xl p-5 shadow-sm">
      {/* Step Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <h2 className="text-xs font-bold uppercase tracking-wider text-violet-600 flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-violet-100 text-violet-600 flex items-center justify-center text-[11px] font-mono font-bold">3</span>
          Active Learning &amp; Disambiguation (L*)
        </h2>
        {inferenceEngine && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200 font-semibold">
            {inferenceEngine}
          </span>
        )}
      </div>

      {/* Querying Mode */}
      {hitlMode === 'querying' && hitlQuery && (
        <div className="animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-mono">
              🔍 Question {hitlQuery.query_index || (hitlQueryCount + 1)} of {hitlQuery.total_queries || 4}
            </span>
            <button
              onClick={onSkipHitl}
              className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 font-semibold transition"
              title="Skip remaining questions and finalize"
            >
              <span>Skip &amp; Finalize</span>
              <FastForward className="w-3.5 h-3.5 text-violet-500" />
            </button>
          </div>

          {/* Query String Display */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center mb-3">
            <div className="text-gray-500 text-xs mb-1">
              Does your target language <strong className="text-gray-800">ACCEPT</strong> this string?
            </div>
            <div className="text-amber-600 font-mono font-extrabold text-2xl tracking-widest my-1">
              {hitlQuery.query_string === '' ? (
                <span className="text-amber-500 italic font-sans font-normal text-lg">ε (empty string)</span>
              ) : (
                `"${hitlQuery.query_string}"`
              )}
            </div>
            <div className="text-[10px] text-gray-400 font-mono">
              {hitlQuery.query_string === ''
                ? 'Length 0'
                : `Length ${hitlQuery.query_string.length} · Symbols: ${[...new Set(hitlQuery.query_string)].join(', ')}`}
            </div>
          </div>

          {/* YES / NO Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-2">
            <button
              onClick={() => onAnswerQuery(true)}
              className="py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-emerald-200 transition active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>YES — Accepted</span>
            </button>
            <button
              onClick={() => onAnswerQuery(false)}
              className="py-3 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-red-200 transition active:scale-95"
            >
              <X className="w-4 h-4" />
              <span>NO — Rejected</span>
            </button>
          </div>

          <div className="text-[10px] text-gray-400 text-center font-mono">
            {hitlQueryCount} queries answered · Hard-capped at 4 max
          </div>
        </div>
      )}

      {/* Conjecture Ready */}
      {hitlMode === 'conjecture_ready' && (
        <div className="animate-fadeIn">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-3 text-emerald-700 text-xs">
            <div className="font-bold flex items-center gap-1.5 text-sm mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Conjecture Hypothesized</span>
            </div>
            <span>
              AI synthesized a minimal conjecture after {hitlQueryCount} query answers. Inspect the graph →
            </span>
          </div>

          <button
            onClick={() => onConfirmConjecture(null)}
            className="w-full py-2.5 px-4 mb-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-emerald-200 transition"
          >
            <Check className="w-4 h-4" />
            <span>Yes, This DFA is Correct!</span>
          </button>

          {/* Counterexample Section */}
          <div className="pt-3 border-t border-gray-100">
            <div className="text-xs font-semibold text-gray-700 mb-1">Found a mistake? Provide a Counterexample:</div>
            <div className="text-[11px] text-gray-400 mb-2">Enter any string this conjecture classifies incorrectly:</div>

            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={counterexample}
                onChange={(e) => handleCounterexampleChange(e.target.value)}
                placeholder="e.g. 0101 (or empty for ε)"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-mono text-gray-700 focus:outline-none focus:border-violet-400 transition"
              />
              <button
                onClick={() => handleConfirm(null)}
                disabled={counterexample === '' || !!ceError}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg disabled:opacity-40 transition flex items-center gap-1 border border-gray-200"
                title="Auto-flip conjecture's prediction"
              >
                <span>Submit</span>
                <CornerDownLeft className="w-3 h-3" />
              </button>
            </div>

            {ceError && (
              <div className="text-[11px] text-red-500 mb-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{ceError}</span>
              </div>
            )}

            {counterexample !== '' && !ceError && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => handleConfirm(true)}
                  className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                >
                  <span>➕ Should be ACCEPTED</span>
                </button>
                <button
                  onClick={() => handleConfirm(false)}
                  className="py-1.5 px-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
                >
                  <span>➖ Should be REJECTED</span>
                </button>
              </div>
            )}
          </div>

          {hitlFeedback && (
            <div className="mt-3 p-2 rounded-lg bg-violet-50 border border-violet-200 text-[11px] text-violet-700">
              ℹ️ {hitlFeedback}
            </div>
          )}
        </div>
      )}

      {/* Converged */}
      {hitlMode === 'converged' && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 text-center animate-fadeIn">
          <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center mb-2 text-xl">
            🎉
          </div>
          <div className="font-bold text-emerald-700 text-sm mb-1">Automaton Converged!</div>
          <div className="text-xs text-emerald-600">
            Minimal {modelType.toUpperCase()} learned in {hitlQueryCount} membership queries.
          </div>
          {modelMetrics?.accuracy != null && (
            <div className="mt-2 text-xs font-mono text-emerald-700 font-bold">
              Accuracy: {(modelMetrics.accuracy * 100).toFixed(1)}%
            </div>
          )}
        </div>
      )}

      {/* Idle (waiting for model) */}
      {hitlMode === 'idle' && (
        <div className="text-center py-6 text-gray-400">
          <HelpCircle className="w-8 h-8 mx-auto mb-2 text-gray-200" />
          <p className="text-xs text-gray-400">Generate a model first to start active learning.</p>
        </div>
      )}
    </div>
  );
}
