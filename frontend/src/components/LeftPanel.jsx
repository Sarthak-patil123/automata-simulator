import React, { useState } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp,
  Layers,
  HelpCircle,
  Check,
  X,
  FastForward,
  CheckCircle2,
  AlertCircle,
  CornerDownLeft,
  XCircle,
} from 'lucide-react';
import { QUICK_SAMPLES } from '../data/benchmarkQuestions';
import { generateDynamicTestcases } from '../utils/testcaseGenerator';

/* ─────────────────────────────────────────────────────────────────────────────
   LEFT PANEL — Sliding Drawer: Dataset Ingestion + Active Learning (L*)
───────────────────────────────────────────────────────────────────────────── */
export default function LeftPanel({
  csvContent,
  setCsvContent,
  preprocessed,
  isPreprocessing,
  onPreprocess,
  onGenerateModel,
  onSelectPreset,
  onRunSimulation,
  setTestString,
  activeKey: propActiveKey,
  activeBenchmarkTitle = 'Even number of 0s and even number of 1s',
  isGenerating,
  activeModelType,
  onOpenBenchmarks,
  onOpenGenerator,
  hitlMode,
  hitlQuery,
  hitlQueryCount,
  onAnswerQuery,
  onSkipHitl,
  onConfirmConjecture,
  hitlFeedback,
  modelMetrics,
  inferenceEngine,
  alphabet,
  graphData,
  onClose,
}) {
  const [showRaw, setShowRaw] = useState(false);
  const [localActiveKey, setLocalActiveKey] = useState(
    QUICK_SAMPLES.ends_with_01 ? 'ends_with_01' : 'ends_with_0'
  );
  const activeKey = propActiveKey || localActiveKey;
  const [posCount, setPosCount] = useState(14);
  const [negCount, setNegCount] = useState(6);
  const [genSuccessMsg, setGenSuccessMsg] = useState(null);
  const [counterexample, setCe] = useState('');
  const [ceError, setCeErr] = useState(null);

  const handleGenerateStrings = () => {
    const result = generateDynamicTestcases(activeKey || activeBenchmarkTitle, { posCount, negCount }, graphData);
    setCsvContent(result.csv);
    setLocalActiveKey(activeKey);
    onPreprocess(result.csv, true);
    setGenSuccessMsg(`Generated exactly ${result.positiveCount} positive + ${result.negativeCount} negative strings!`);
    setTimeout(() => setGenSuccessMsg(null), 4000);
    if (result.positiveStrings[0] && setTestString) {
      setTestString(result.positiveStrings[0]);
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') {
        setCsvContent(text);
        setLocalActiveKey('custom');
        onPreprocess(text);
      }
    };
    reader.readAsText(file);
  };

  const pickSample = (key) => {
    setLocalActiveKey(key);
    const s = QUICK_SAMPLES[key];
    if (s) {
      setCsvContent(s.csv);
      if (onSelectPreset) {
        onSelectPreset(key, s);
      } else {
        onPreprocess(s.csv);
      }
    }
  };

  const sampleButtons = [
    { key: 'ends_with_01', label: "Ends '01'" },
    { key: 'even_zeros', label: 'Even 0s' },
    { key: 'contains_110', label: "Contains '110'" },
    { key: 'equal_01_len2', label: 'Equal (01)²' },
  ];

  return (
    <aside className="w-80 bg-white/95 border-r border-zinc-200/90 shadow-xl backdrop-blur-md flex flex-col h-full overflow-hidden text-zinc-900 animate-slide-left shrink-0 z-20">
      {/* Drawer Header */}
      <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 font-mono font-bold text-xs">
            1
          </div>
          <div>
            <span className="font-heading font-bold text-xs uppercase tracking-wider text-zinc-900">
              Dataset &amp; L*
            </span>
            <div className="text-[10px] text-zinc-400 font-mono">Ingestion &amp; Active Learner</div>
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
        {/* SECTION 1: DATASET INGESTION */}
        <div className="space-y-3">
          {/* Dynamic Testcase Generator with Dual Sliders & Ratios */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-brand-50/90 via-indigo-50/40 to-purple-50/40 border border-brand-200/90 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-900 font-mono flex items-center gap-1.5">
                    <span>Testcase Generator</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-brand-100 text-brand-700 font-bold border border-brand-200">
                      {posCount + negCount} Total
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono truncate max-w-[170px]" title={activeBenchmarkTitle}>
                    Suite: <strong className="text-brand-700">{activeBenchmarkTitle || 'Current Suite'}</strong>
                  </div>
                </div>
              </div>

              {onOpenGenerator && (
                <button
                  onClick={onOpenGenerator}
                  className="p-1 rounded-lg hover:bg-brand-100 text-brand-600 transition"
                  title="Open full testcase generator modal"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Ratio Pills */}
            <div className="flex items-center gap-1 pt-0.5">
              <button
                type="button"
                onClick={() => { setPosCount(14); setNegCount(6); setGenSuccessMsg(null); }}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-mono border text-center transition ${
                  posCount === 14 && negCount === 6
                    ? 'bg-brand-600 text-white border-brand-600 font-bold shadow-2xs'
                    : 'bg-white hover:bg-zinc-100 text-zinc-600 border-zinc-200'
                }`}
                title="70% Positive / 30% Negative"
              >
                70/30 (20)
              </button>
              <button
                type="button"
                onClick={() => { setPosCount(10); setNegCount(10); setGenSuccessMsg(null); }}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-mono border text-center transition ${
                  posCount === 10 && negCount === 10
                    ? 'bg-brand-600 text-white border-brand-600 font-bold shadow-2xs'
                    : 'bg-white hover:bg-zinc-100 text-zinc-600 border-zinc-200'
                }`}
                title="50% Positive / 50% Negative"
              >
                50/50 (20)
              </button>
              <button
                type="button"
                onClick={() => { setPosCount(6); setNegCount(14); setGenSuccessMsg(null); }}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-mono border text-center transition ${
                  posCount === 6 && negCount === 14
                    ? 'bg-brand-600 text-white border-brand-600 font-bold shadow-2xs'
                    : 'bg-white hover:bg-zinc-100 text-zinc-600 border-zinc-200'
                }`}
                title="30% Positive / 70% Negative"
              >
                30/70 (20)
              </button>
            </div>

            {/* Slider 1: Positives */}
            <div className="space-y-1 bg-white/95 p-2 rounded-xl border border-teal-200/80">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-teal-800 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  Positive ({Math.round((posCount / (posCount + negCount)) * 100)}%):
                </span>
                <span className="font-bold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                  {posCount} strings
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="40"
                step="1"
                value={posCount}
                onChange={(e) => {
                  setPosCount(Number(e.target.value));
                  setGenSuccessMsg(null);
                }}
                className="w-full accent-teal-600 cursor-pointer h-1.5 bg-zinc-200 rounded-lg appearance-none"
              />
            </div>

            {/* Slider 2: Negatives */}
            <div className="space-y-1 bg-white/95 p-2 rounded-xl border border-rose-200/80">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-rose-800 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Negative ({Math.round((negCount / (posCount + negCount)) * 100)}%):
                </span>
                <span className="font-bold text-rose-800 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                  {negCount} strings
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="40"
                step="1"
                value={negCount}
                onChange={(e) => {
                  setNegCount(Number(e.target.value));
                  setGenSuccessMsg(null);
                }}
                className="w-full accent-rose-600 cursor-pointer h-1.5 bg-zinc-200 rounded-lg appearance-none"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateStrings}
              disabled={isGenerating}
              className="w-full py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Exactly {posCount}+ / {negCount}-</span>
            </button>

            {genSuccessMsg && (
              <div className="text-[10px] font-mono text-teal-800 bg-teal-50 border border-teal-200 rounded-lg p-1.5 text-center font-bold animate-fade-in">
                {genSuccessMsg}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-zinc-500 font-mono pt-1">
            <span className="uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-brand-600" />
              Dataset Presets
            </span>
            <button
              onClick={onOpenBenchmarks}
              className="text-brand-600 hover:text-brand-700 flex items-center gap-1 font-semibold text-[11px]"
            >
              <Layers className="w-3 h-3" />
              <span>20 Suites</span>
            </button>
          </div>

          {/* Quick preset buttons */}
          <div className="grid grid-cols-2 gap-1.5">
            {sampleButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => pickSample(btn.key)}
                className={`py-1.5 px-2 rounded-xl text-xs font-mono font-medium border text-left transition ${
                  activeKey === btn.key
                    ? 'bg-brand-50 text-brand-700 border-brand-300 font-bold shadow-xs'
                    : 'bg-zinc-50 text-zinc-600 border-zinc-200/80 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Upload & Raw View Toggle */}
          <div className="flex gap-2">
            <label className="flex-1 py-2 px-3 rounded-xl border border-dashed border-zinc-300 hover:border-brand-500 bg-zinc-50/50 hover:bg-brand-50/30 text-zinc-600 hover:text-brand-700 font-mono text-xs flex items-center justify-center gap-2 cursor-pointer transition">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV</span>
              <input type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
            </label>

            <button
              onClick={() => setShowRaw(!showRaw)}
              className="px-2.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 font-mono text-xs transition"
              title="Toggle CSV editor"
            >
              {showRaw ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Raw CSV textarea */}
          {showRaw && (
            <div className="space-y-1.5">
              <textarea
                value={csvContent}
                onChange={(e) => {
                  setCsvContent(e.target.value);
                  setActiveKey('custom');
                }}
                rows={5}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 font-mono text-xs text-zinc-900 focus:outline-none focus:border-brand-500 transition resize-none leading-relaxed"
                placeholder="string,label&#10;01,1&#10;00,0"
              />
              <button
                onClick={() => onPreprocess(csvContent)}
                className="w-full py-1.5 rounded-lg bg-zinc-900 hover:bg-black text-white font-mono font-bold text-xs transition"
              >
                Re-validate Dataset
              </button>
            </div>
          )}

          {/* Validation Status Card */}
          {preprocessed && (
            <div
              className={`p-3 rounded-xl border text-xs font-mono space-y-1.5 ${
                preprocessed.is_valid
                  ? 'bg-teal-50/70 border-teal-200 text-teal-900'
                  : 'bg-rose-50/70 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  {preprocessed.is_valid ? (
                    <CheckCircle className="w-4 h-4 text-teal-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                  {preprocessed.is_valid ? 'Dataset Validated' : 'Validation Failed'}
                </span>
                <span className="text-[10px] text-zinc-500 font-semibold">
                  Σ = {'{'}{preprocessed.alphabet?.join(', ')}{'}'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-600 pt-1 border-t border-zinc-200/60">
                <span>
                  Positives: <strong className="text-teal-700">{preprocessed.positive_count}</strong>
                </span>
                <span>
                  Negatives: <strong className="text-rose-700">{preprocessed.negative_count}</strong>
                </span>
              </div>

              {onRunSimulation && (preprocessed.positive_strings?.length > 0 || preprocessed.negative_strings?.length > 0) && (
                <div className="pt-2 border-t border-zinc-200/60 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase text-zinc-500 flex items-center justify-between">
                    <span>Testcases (Click to trace)</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(preprocessed.positive_strings || []).slice(0, 4).map((str, idx) => (
                      <button
                        key={`pos-${idx}`}
                        onClick={() => {
                          if (setTestString) setTestString(str);
                          onRunSimulation(str);
                        }}
                        className="px-2 py-0.5 rounded-md bg-teal-100/80 hover:bg-teal-200 text-teal-800 font-mono text-[10px] font-bold border border-teal-300/80 transition"
                        title={`Positive testcase: trace '${str || 'ε'}'`}
                      >
                        ✓ {str === '' ? 'ε' : str}
                      </button>
                    ))}
                    {(preprocessed.negative_strings || []).slice(0, 4).map((str, idx) => (
                      <button
                        key={`neg-${idx}`}
                        onClick={() => {
                          if (setTestString) setTestString(str);
                          onRunSimulation(str);
                        }}
                        className="px-2 py-0.5 rounded-md bg-rose-100/80 hover:bg-rose-200 text-rose-800 font-mono text-[10px] font-bold border border-rose-300/80 transition"
                        title={`Negative testcase: trace '${str || 'ε'}'`}
                      >
                        ✗ {str === '' ? 'ε' : str}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 2: ACTIVE LEARNING & L* CONSOLE */}
        <div className="pt-2 border-t border-zinc-100 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-500 font-mono">
            <span className="uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              L* Active Learning
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              {hitlQueryCount > 0 ? `${hitlQueryCount}/4 queries` : 'Angluin L*'}
            </span>
          </div>

          {/* Query Question (When algorithm needs disambiguation) */}
          {hitlMode === 'querying' && hitlQuery && (
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2.5 animate-fade-in text-zinc-900">
              <div className="text-[11px] font-mono font-bold text-amber-900 flex items-center justify-between">
                <span>MEMBERSHIP QUERY</span>
                <span className="text-amber-700">Q#{hitlQuery.query_index + 1}</span>
              </div>

              <p className="text-xs text-zinc-600 leading-snug">
                Is string <code className="bg-white border border-amber-200 px-1.5 py-0.5 rounded font-mono font-bold text-amber-900">"{hitlQuery.query_string}"</code> in the target language?
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => onAnswerQuery(true)}
                  className="py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-mono font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>YES (In L)</span>
                </button>
                <button
                  onClick={() => onAnswerQuery(false)}
                  className="py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-mono font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>NO (Not in L)</span>
                </button>
              </div>

              <button
                onClick={onSkipHitl}
                className="w-full text-center text-[10px] font-mono text-zinc-400 hover:text-zinc-600 pt-1 transition"
              >
                Skip active learning (Use best-effort)
              </button>
            </div>
          )}

          {/* Conjecture Ready */}
          {hitlMode === 'conjecture_ready' && (
            <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 space-y-2.5 animate-fade-in text-zinc-900">
              <div className="text-[11px] font-mono font-bold text-indigo-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <span>CONJECTURE PROPOSED</span>
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed">
                The L* observation table is closed. Do you confirm this candidate DFA is minimal?
              </p>

              <div className="space-y-1.5">
                <input
                  type="text"
                  value={counterexample}
                  onChange={(e) => setCe(e.target.value.trim())}
                  placeholder="Optional counterexample..."
                  className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => onConfirmConjecture(true, '')}
                    className="flex-1 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-mono font-bold text-xs transition"
                  >
                    Confirm &amp; Finalize
                  </button>
                  {counterexample && (
                    <button
                      onClick={() => onConfirmConjecture(false, counterexample)}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-mono font-bold text-xs transition"
                    >
                      Refine
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Converged Badge */}
          {hitlMode === 'converged' && (
            <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-center animate-fade-in">
              <div className="text-xl mb-1">🎉</div>
              <div className="text-teal-900 font-bold text-xs mb-0.5">Automaton Converged!</div>
              <div className="text-[11px] text-teal-700 font-mono">100% Minimal in {hitlQueryCount} queries</div>
            </div>
          )}

          {/* Idle status */}
          {hitlMode === 'idle' && (
            <div className="text-center py-4 text-zinc-400 font-mono text-xs border border-dashed border-zinc-200 rounded-xl p-3">
              Generate a model or load a benchmark to trigger active learning.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
