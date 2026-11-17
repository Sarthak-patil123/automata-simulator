import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Cpu, Sparkles, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { QUICK_SAMPLES } from '../data/benchmarkQuestions';

export default function DatasetPanel({
  csvContent,
  setCsvContent,
  preprocessed,
  isPreprocessing,
  onPreprocess,
  onGenerateModel,
  isGenerating,
  activeModelType,
  onOpenBenchmarks,
}) {
  const [showRawEditor, setShowRawEditor] = useState(false);
  const [activeQuickKey, setActiveQuickKey] = useState(
    QUICK_SAMPLES.ends_with_01 ? 'ends_with_01' : 'ends_with_0'
  );

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') {
        setCsvContent(text);
        setActiveQuickKey('custom');
        onPreprocess(text);
      }
    };
    reader.readAsText(file);
  };

  const handleSelectQuickSample = (key) => {
    setActiveQuickKey(key);
    const sample = QUICK_SAMPLES[key];
    if (sample) {
      setCsvContent(sample.csv);
      onPreprocess(sample.csv);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      {/* Step Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-violet-600 flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-violet-100 text-violet-600 flex items-center justify-center text-[11px] font-mono font-bold">
              1
            </span>
            Dataset Input &amp; Preprocessing
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-50 text-violet-500 border border-violet-200 font-semibold">
          CSV Engine
        </span>
      </div>

      {/* Upload Dropzone */}
      <div className="border-2 border-dashed border-gray-200 hover:border-violet-400 rounded-xl p-4 text-center transition bg-gray-50/60 relative group cursor-pointer">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileUpload}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />
        <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-violet-100 text-violet-500 flex items-center justify-center group-hover:scale-110 transition">
          <Upload className="w-5 h-5" />
        </div>
        <div className="text-xs font-semibold text-gray-700 group-hover:text-violet-700 transition">
          Drag &amp; drop your CSV or <span className="text-violet-600 underline">browse</span>
        </div>
        <div className="text-[11px] text-gray-400 font-mono mt-0.5">
          Columns: <code className="text-gray-600">string, label</code> (1/0, true/false)
        </div>
      </div>

      {/* Quick Sample Presets */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-gray-500">Quick Test Datasets:</span>
          <button
            onClick={onOpenBenchmarks}
            className="text-[11px] font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 transition"
          >
            <Layers className="w-3 h-3" />
            <span>All 20 Benchmarks</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(QUICK_SAMPLES).map(([key, sample]) => (
            <button
              key={key}
              onClick={() => handleSelectQuickSample(key)}
              className={`px-2.5 py-1.5 rounded-lg border text-left text-xs font-medium transition flex items-center justify-between ${
                activeQuickKey === key
                  ? 'bg-violet-600 text-white border-violet-600 font-bold shadow-sm shadow-violet-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <span className="truncate">{sample.name}</span>
              <span className={`text-[9px] px-1.5 rounded font-mono ml-1 shrink-0 ${activeQuickKey === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {sample.level.split('–')[1]?.trim() || sample.level}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Raw CSV Accordion */}
      <div className="mt-3">
        <button
          onClick={() => setShowRawEditor(!showRawEditor)}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[11px] font-medium text-gray-500 transition"
        >
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-gray-400" />
            <span>{showRawEditor ? 'Hide Raw CSV Editor' : 'Edit Raw CSV Content'}</span>
          </span>
          {showRawEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showRawEditor && (
          <div className="mt-2 animate-fadeIn">
            <textarea
              value={csvContent}
              onChange={(e) => {
                setCsvContent(e.target.value);
                setActiveQuickKey('custom');
                onPreprocess(e.target.value);
              }}
              rows={6}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[11px] font-mono text-gray-700 focus:outline-none focus:border-violet-400 resize-none transition"
              placeholder="string,label&#10;01,1&#10;001,1&#10;0,0&#10;..."
            />
          </div>
        )}
      </div>

      {/* Preprocessing Loading */}
      {isPreprocessing && (
        <div className="mt-4 flex items-center gap-2 text-xs text-violet-600 font-semibold">
          <span className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></span>
          Parsing &amp; validating dataset…
        </div>
      )}

      {/* Dataset Validated Summary */}
      {preprocessed && preprocessed.is_valid && !isPreprocessing && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2.5">
            <span className="text-emerald-600 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              Dataset Validated
            </span>
            <span className="font-mono text-gray-500 text-[11px]">{preprocessed.total_samples} samples</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="bg-white p-2 rounded-lg border border-emerald-100">
              <div className="text-[10px] text-gray-400 uppercase font-sans">Positives</div>
              <div className="text-emerald-600 font-bold text-base mt-0.5">{preprocessed.positive_count}</div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-red-100">
              <div className="text-[10px] text-gray-400 uppercase font-sans">Negatives</div>
              <div className="text-red-500 font-bold text-base mt-0.5">{preprocessed.negative_count}</div>
            </div>
            <div className="bg-white p-2 rounded-lg border border-violet-100">
              <div className="text-[10px] text-gray-400 uppercase font-sans">Alphabet (Σ)</div>
              <div className="text-violet-600 font-bold text-base mt-0.5">
                {`{${preprocessed.alphabet?.join(', ') || '0, 1'}}`}
              </div>
            </div>
          </div>

          {/* Positive Sample Preview */}
          <div className="mt-2.5 pt-2 border-t border-emerald-100">
            <div className="text-[10px] font-semibold text-gray-400 mb-1">Preview S⁺:</div>
            <div className="flex flex-wrap gap-1 max-h-14 overflow-y-auto">
              {preprocessed.positive_strings?.slice(0, 12).map((s, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-mono"
                >
                  {s === '' ? 'ε' : s}
                </span>
              ))}
              {(preprocessed.positive_strings?.length || 0) > 12 && (
                <span className="text-[10px] text-gray-400 self-center">
                  +{preprocessed.positive_strings.length - 12} more
                </span>
              )}
            </div>
          </div>

          {/* Quality Warning */}
          {preprocessed.data_quality_warning && (
            <div className="mt-2.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-700 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span>{preprocessed.data_quality_warning}</span>
            </div>
          )}
        </div>
      )}

      {/* Invalid Dataset */}
      {preprocessed && !preprocessed.is_valid && (
        <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
          <strong>Invalid Dataset:</strong> {preprocessed.error || 'Provide valid binary strings and labels.'}
        </div>
      )}

      {/* Machine Type & Generate */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="text-xs font-bold uppercase tracking-wider text-violet-600 mb-2.5 flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-violet-100 text-violet-600 flex items-center justify-center text-[11px] font-mono font-bold">2</span>
          Choose Machine Type &amp; Synthesize
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Generate DFA */}
          <button
            onClick={() => onGenerateModel('dfa')}
            disabled={!preprocessed?.is_valid || isGenerating}
            className="py-2.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-violet-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isGenerating && activeModelType === 'dfa' ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Inferring DFA…</span>
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5" />
                <span>Generate DFA</span>
              </>
            )}
          </button>

          {/* Generate NFA */}
          <button
            onClick={() => onGenerateModel('nfa')}
            disabled={!preprocessed?.is_valid || isGenerating}
            className="py-2.5 px-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 hover:border-violet-300 text-gray-700 hover:text-violet-700 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isGenerating && activeModelType === 'nfa' ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></span>
                <span>Inferring NFA…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate NFA</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
