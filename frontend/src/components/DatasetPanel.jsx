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
  const [activeQuickKey, setActiveQuickKey] = useState('ends_with_01');

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
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-200">
      {/* Step Header */}
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-800">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-[11px] font-mono font-bold">1</span>
            Dataset Input & Preprocessing
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 border border-blue-700/40">
          CSV Engine Active
        </span>
      </div>

      {/* Upload Dropzone */}
      <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-4 text-center transition bg-slate-950/40 relative group cursor-pointer">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileUpload}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />
        <div className="w-9 h-9 mx-auto mb-2 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition">
          <Upload className="w-5 h-5" />
        </div>
        <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-300 transition">
          Drag & drop your CSV or <span className="text-blue-400 underline">browse files</span>
        </div>
        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
          Columns: <code className="text-slate-400">string, label</code> (1/0, true/false)
        </div>
      </div>

      {/* Quick Sample Presets */}
      <div className="mt-3.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-slate-400">Quick Test Datasets:</span>
          <button
            onClick={onOpenBenchmarks}
            className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
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
                  ? 'bg-blue-600 text-white border-blue-500 font-bold shadow-sm shadow-blue-500/20'
                  : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="truncate">{sample.name}</span>
              <span className="text-[9px] px-1 rounded bg-black/30 font-mono ml-1 opacity-80 shrink-0">
                {sample.level.split('–')[1] || sample.level}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Raw CSV Accordion Toggle */}
      <div className="mt-3">
        <button
          onClick={() => setShowRawEditor(!showRawEditor)}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 text-[11px] font-medium text-slate-400 transition"
        >
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
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
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 resize-y leading-relaxed"
              placeholder="string,label&#10;0,1&#10;1,0..."
            />
          </div>
        )}
      </div>

      {/* Preprocessor Status & Dataset Summary */}
      {isPreprocessing && (
        <div className="mt-3 p-2.5 rounded-lg bg-blue-950/30 border border-blue-800/40 text-xs text-blue-300 flex items-center gap-2 font-mono">
          <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
          <span>Validating CSV strings and extracting alphabet...</span>
        </div>
      )}

      {preprocessed && preprocessed.is_valid && (
        <div className="mt-3.5 p-3 rounded-xl bg-slate-800/50 border border-slate-700/80">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2.5">
            <span className="text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dataset Validated</span>
            </span>
            <span className="font-mono text-slate-400 text-[11px]">{preprocessed.total_samples} samples</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-700/60">
              <div className="text-[10px] text-slate-400 uppercase font-sans">Positives</div>
              <div className="text-emerald-400 font-bold text-base mt-0.5">{preprocessed.positive_count}</div>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-700/60">
              <div className="text-[10px] text-slate-400 uppercase font-sans">Negatives</div>
              <div className="text-rose-400 font-bold text-base mt-0.5">{preprocessed.negative_count}</div>
            </div>
            <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-700/60">
              <div className="text-[10px] text-slate-400 uppercase font-sans">Alphabet (Σ)</div>
              <div className="text-blue-400 font-bold text-base mt-0.5">
                {`{${preprocessed.alphabet?.join(', ') || '0, 1'}}`}
              </div>
            </div>
          </div>

          {/* Sample Chips */}
          <div className="mt-2.5 pt-2 border-t border-slate-700/50">
            <div className="text-[10px] font-semibold text-slate-400 mb-1">Preview of Positive Samples ($S^+$):</div>
            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pr-1">
              {preprocessed.positive_strings?.slice(0, 12).map((s, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 text-[10px] font-mono"
                >
                  {s === '' ? 'ε' : s}
                </span>
              ))}
              {(preprocessed.positive_strings?.length || 0) > 12 && (
                <span className="text-[10px] text-slate-500 self-center">
                  +{preprocessed.positive_strings.length - 12} more
                </span>
              )}
            </div>
          </div>

          {/* Data Quality Warning */}
          {preprocessed.data_quality_warning && (
            <div className="mt-2.5 p-2 rounded-lg bg-amber-950/30 border border-amber-700/50 text-[11px] text-amber-300 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>{preprocessed.data_quality_warning}</span>
            </div>
          )}
        </div>
      )}

      {/* Invalid error */}
      {preprocessed && !preprocessed.is_valid && (
        <div className="mt-3 p-3 rounded-xl bg-rose-950/30 border border-rose-800/60 text-xs text-rose-300">
          <strong>Invalid Dataset:</strong> {preprocessed.error || 'Please provide valid binary strings and labels.'}
        </div>
      )}

      {/* Machine Type Selection & Generate */}
      <div className="mt-4 pt-3.5 border-t border-slate-800">
        <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2 flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-[11px] font-mono font-bold">2</span>
          Choose Machine Type & Synthesize
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => onGenerateModel('dfa')}
            disabled={!preprocessed?.is_valid || isGenerating}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
          >
            {isGenerating && activeModelType === 'dfa' ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Inferring DFA...</span>
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4" />
                <span>Generate DFA</span>
              </>
            )}
          </button>

          <button
            onClick={() => onGenerateModel('nfa')}
            disabled={!preprocessed?.is_valid || isGenerating}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition disabled:opacity-50"
          >
            {isGenerating && activeModelType === 'nfa' ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Inferring NFA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate NFA</span>
              </>
            )}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 font-mono text-center">
          DFA: SAT / RPNI warm-start + L* Active Learning • NFA: State Merging
        </p>
      </div>
    </div>
  );
}
