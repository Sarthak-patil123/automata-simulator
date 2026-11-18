import React, { useState } from 'react';
import { Sparkles, Sliders, X, Check, Database, RefreshCw, BarChart2 } from 'lucide-react';
import { generateDynamicTestcases } from '../utils/testcaseGenerator';
import { BENCHMARK_QUESTIONS } from '../data/benchmarkQuestions';

export default function TestcaseGeneratorModal({
  isOpen,
  onClose,
  activeLanguageTitle = 'Even number of 0s and even number of 1s',
  activePresetKey = '11_even_0s_and_even_1s',
  onApplyDataset,
  graphData = null,
}) {
  const [posCount, setPosCount] = useState(14);
  const [negCount, setNegCount] = useState(6);
  const [selectedSuite, setSelectedSuite] = useState(activePresetKey || '11_even_0s_and_even_1s');
  const [generatedPreview, setGeneratedPreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync selected suite with active key when modal opens
  React.useEffect(() => {
    if (activePresetKey) {
      setSelectedSuite(activePresetKey);
    }
  }, [activePresetKey, isOpen]);

  if (!isOpen) return null;

  const currentQuestion = BENCHMARK_QUESTIONS.find(
    (q) =>
      q.slug === selectedSuite ||
      q.title.toLowerCase() === activeLanguageTitle.toLowerCase() ||
      q.slug === activePresetKey
  );

  const displayTitle = currentQuestion ? currentQuestion.title : activeLanguageTitle || 'Current Problem Suite';

  const totalCount = posCount + negCount;
  const posRatio = Math.round((posCount / totalCount) * 100);
  const negRatio = 100 - posRatio;

  const handleApplyPresetRatio = (p, n) => {
    setPosCount(p);
    setNegCount(n);
    setGeneratedPreview(null);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    try {
      const suiteId = currentQuestion ? currentQuestion.slug : selectedSuite || activePresetKey || activeLanguageTitle;
      const result = generateDynamicTestcases(suiteId, { posCount, negCount }, graphData);
      setGeneratedPreview(result);

      if (onApplyDataset) {
        onApplyDataset(result.csv, {
          title: displayTitle,
          slug: suiteId,
          sampleCount: result.totalSamples,
          sampleString: result.positiveStrings[0] || '01',
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-zinc-900 flex items-center gap-2">
                Dynamic Testcase Generator
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 font-bold border border-brand-200">
                  Custom Ratios
                </span>
              </h2>
              <p className="text-xs text-zinc-500 font-mono">
                Control exact positive &amp; negative string counts and distribution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 border border-zinc-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Active Suite Card */}
          <div className="p-4 rounded-2xl bg-brand-50/70 border border-brand-200/90 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                Target Problem Suite
              </span>
              <span className="text-[11px] font-bold text-brand-700 bg-white px-2 py-0.5 rounded-lg border border-brand-200 shadow-2xs">
                Active
              </span>
            </div>
            <div className="text-sm font-bold text-zinc-900 font-heading">
              {displayTitle}
            </div>
            {currentQuestion?.description && (
              <p className="text-xs text-zinc-600 leading-relaxed">
                {currentQuestion.description}
              </p>
            )}

            {/* Quick dropdown to change suite */}
            <div className="pt-2 flex items-center gap-2">
              <span className="text-[11px] font-mono text-zinc-500">Suite:</span>
              <select
                value={selectedSuite}
                onChange={(e) => {
                  setSelectedSuite(e.target.value);
                  setGeneratedPreview(null);
                }}
                className="text-xs font-mono bg-white border border-brand-200 rounded-lg px-2.5 py-1 text-zinc-800 focus:outline-none focus:border-brand-500 max-w-[320px] truncate"
              >
                {BENCHMARK_QUESTIONS.map((q) => (
                  <option key={q.slug} value={q.slug}>
                    {q.id}. {q.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Ratio Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold flex items-center gap-1">
              <BarChart2 className="w-3 h-3 text-brand-600" />
              Quick Ratio Presets:
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 font-mono text-xs">
              <button
                type="button"
                onClick={() => handleApplyPresetRatio(14, 6)}
                className={`py-1.5 px-2 rounded-xl border text-center transition ${
                  posCount === 14 && negCount === 6
                    ? 'bg-brand-600 text-white border-brand-600 font-bold'
                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}
              >
                70/30 (20)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetRatio(10, 10)}
                className={`py-1.5 px-2 rounded-xl border text-center transition ${
                  posCount === 10 && negCount === 10
                    ? 'bg-brand-600 text-white border-brand-600 font-bold'
                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}
              >
                50/50 (20)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetRatio(6, 14)}
                className={`py-1.5 px-2 rounded-xl border text-center transition ${
                  posCount === 6 && negCount === 14
                    ? 'bg-brand-600 text-white border-brand-600 font-bold'
                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}
              >
                30/70 (20)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetRatio(5, 5)}
                className={`py-1.5 px-2 rounded-xl border text-center transition ${
                  posCount === 5 && negCount === 5
                    ? 'bg-brand-600 text-white border-brand-600 font-bold'
                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}
              >
                Compact (10)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPresetRatio(28, 12)}
                className={`py-1.5 px-2 rounded-xl border text-center transition ${
                  posCount === 28 && negCount === 12
                    ? 'bg-brand-600 text-white border-brand-600 font-bold'
                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}
              >
                Dense (40)
              </button>
            </div>
          </div>

          {/* Dual Sliders Card */}
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-4">
            {/* Summary Tag */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 font-mono text-xs">
              <span className="font-bold text-zinc-700">Total Dataset:</span>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-lg border border-brand-200">
                  {totalCount} Strings
                </span>
                <span className="text-[10px] text-zinc-500 font-semibold">
                  ({posRatio}% Pos / {negRatio}% Neg)
                </span>
              </div>
            </div>

            {/* Slider 1: Positive Samples */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-teal-800 font-semibold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                  Positive Samples (Accepted, 1):
                </span>
                <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
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
                  setGeneratedPreview(null);
                }}
                className="w-full accent-teal-600 cursor-pointer h-2 bg-zinc-200 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                <span>2 (Sparse)</span>
                <span>20</span>
                <span>40 (Extensive)</span>
              </div>
            </div>

            {/* Slider 2: Negative Samples */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-rose-800 font-semibold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Negative Samples (Rejected, 0):
                </span>
                <span className="font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
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
                  setGeneratedPreview(null);
                }}
                className="w-full accent-rose-600 cursor-pointer h-2 bg-zinc-200 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                <span>2 (Sparse)</span>
                <span>20</span>
                <span>40 (Extensive)</span>
              </div>
            </div>
          </div>

          {/* Generated Preview */}
          {generatedPreview && (
            <div className="p-3.5 rounded-2xl bg-teal-50/80 border border-teal-200 text-xs font-mono space-y-2 animate-fade-in">
              <div className="flex items-center justify-between font-bold text-teal-900">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-teal-600" />
                  Generated Exactly {generatedPreview.positiveCount} Positive + {generatedPreview.negativeCount} Negative!
                </span>
                <span className="text-[10px] text-teal-700 font-semibold">Loaded to Canvas</span>
              </div>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pt-1">
                {generatedPreview.positiveStrings.map((s, idx) => (
                  <span
                    key={`pos-${idx}`}
                    className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-300 font-bold text-[10px]"
                  >
                    +{s || 'ε'}
                  </span>
                ))}
                {generatedPreview.negativeStrings.map((s, idx) => (
                  <span
                    key={`neg-${idx}`}
                    className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 font-bold text-[10px]"
                  >
                    -{s || 'ε'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-zinc-100 flex items-center justify-end gap-3 bg-zinc-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-100 text-zinc-600 font-mono text-xs font-semibold transition"
          >
            {generatedPreview ? 'Done' : 'Cancel'}
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="py-2.5 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-md transition disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Exactly {posCount} Pos + {negCount} Neg</span>
          </button>
        </div>
      </div>
    </div>
  );
}
