import React from 'react';
import {
  Plus,
  BookOpen,
  PlayCircle,
  FileText,
  Table,
  Download,
  Share2,
  Trash2,
  Sparkles,
  Cpu,
  Layers,
  FolderOpen,
  Save,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   BOTTOM FLOATING TOOLBAR
   Inspired directly by Automataverse floating action bar:
   [+ State] [Examples] [Tests] [Dataset & L*] [Table & Stats] [Export] [Save] [Clear]
───────────────────────────────────────────────────────────────────────────── */
export default function BottomDock({
  onAddState,
  onOpenBenchmarks,
  leftOpen,
  onToggleLeft,
  rightOpen,
  onToggleRight,
  onExportSvg,
  onSaveJson,
  onClearCanvas,
  onGenerateDfa,
  onGenerateNfa,
  canGenerate,
  isGenerating,
  activeModelType,
  graphData,
}) {
  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 select-none animate-slide-up max-w-[95vw] overflow-x-auto">
      <div className="bg-white/95 border border-zinc-200/90 rounded-2xl px-2 py-1.5 shadow-xl backdrop-blur-md flex items-center gap-1 sm:gap-1.5">
        {/* + State */}
        <button
          onClick={onAddState}
          className="flex flex-col sm:flex-row items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 transition text-xs font-medium"
          title="Add a new state to the canvas"
        >
          <Plus className="w-3.5 h-3.5 text-brand-600" />
          <span className="text-[11px] font-mono font-semibold">State</span>
        </button>

        <div className="w-px h-5 bg-zinc-200 mx-0.5"></div>

        {/* Machine Type Selectors: DFA & NFA */}
        <button
          onClick={onGenerateDfa}
          disabled={!canGenerate && !graphData}
          className={`flex flex-col sm:flex-row items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-150 text-xs font-mono focus:outline-none select-none ${
            activeModelType?.toLowerCase() === 'dfa'
              ? 'bg-zinc-950 text-white shadow-sm font-bold ring-1 ring-zinc-800'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950 font-medium'
          }`}
          title="Select and simulate Deterministic Finite Automaton (DFA)"
        >
          <Cpu className={`w-3.5 h-3.5 ${activeModelType?.toLowerCase() === 'dfa' ? 'text-white' : 'text-zinc-500'}`} />
          <span className="text-[11px] font-bold">
            {isGenerating && activeModelType?.toLowerCase() === 'dfa' ? 'Building...' : 'DFA'}
          </span>
        </button>

        <button
          onClick={onGenerateNfa}
          disabled={!canGenerate && !graphData}
          className={`flex flex-col sm:flex-row items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-150 text-xs font-mono focus:outline-none select-none ${
            activeModelType?.toLowerCase() === 'nfa'
              ? 'bg-zinc-950 text-white shadow-sm font-bold ring-1 ring-zinc-800'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950 font-medium'
          }`}
          title="Select and simulate Non-Deterministic Finite Automaton (NFA)"
        >
          <Sparkles className={`w-3.5 h-3.5 ${activeModelType?.toLowerCase() === 'nfa' ? 'text-indigo-400' : 'text-indigo-600'}`} />
          <span className="text-[11px] font-bold">
            {isGenerating && activeModelType?.toLowerCase() === 'nfa' ? 'Building...' : 'NFA'}
          </span>
        </button>

        <div className="w-px h-5 bg-zinc-200 mx-0.5"></div>

        {/* Examples */}
        <button
          onClick={onOpenBenchmarks}
          className="flex flex-col sm:flex-row items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 transition text-xs font-medium"
          title="Open worked benchmark examples"
        >
          <Layers className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[11px] font-mono">Examples</span>
        </button>

        {/* Dataset & L* (Left Drawer toggle) */}
        <button
          onClick={onToggleLeft}
          className={`flex flex-col sm:flex-row items-center gap-1 px-3 py-1.5 rounded-xl transition text-xs font-medium font-mono ${leftOpen
            ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200'
            : 'hover:bg-zinc-100 text-zinc-700'
            }`}
          title="Toggle Dataset Ingestion and L* Active Learning console"
        >
          <FileText className="w-3.5 h-3.5 text-brand-600" />
          <span className="text-[11px]">Dataset &amp; L*</span>
        </button>

        {/* Table & Stats (Right Drawer toggle) */}
        <button
          onClick={onToggleRight}
          className={`flex flex-col sm:flex-row items-center gap-1 px-3 py-1.5 rounded-xl transition text-xs font-medium font-mono ${rightOpen
            ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200'
            : 'hover:bg-zinc-100 text-zinc-700'
            }`}
          title="Toggle Transition Table & Metrics Inspector"
        >
          <Table className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-[11px]">Table &amp; Stats</span>
        </button>

        <div className="w-px h-5 bg-zinc-200 mx-0.5"></div>

        {/* Export SVG */}
        {graphData && (
          <button
            onClick={onExportSvg}
            className="flex flex-col sm:flex-row items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 transition text-xs font-medium"
            title="Download canvas as vector SVG"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[11px] font-mono">Export</span>
          </button>
        )}

        {/* Save JSON */}
        {graphData && (
          <button
            onClick={onSaveJson}
            className="flex flex-col sm:flex-row items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 transition text-xs font-medium"
            title="Save automaton JSON file"
          >
            <Save className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[11px] font-mono">Save</span>
          </button>
        )}

        {/* Clear */}
        <button
          onClick={onClearCanvas}
          className="flex flex-col sm:flex-row items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition text-xs font-medium"
          title="Clear canvas"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="text-[11px] font-mono hidden sm:inline">Clear</span>
        </button>
      </div>
    </div>
  );
}

