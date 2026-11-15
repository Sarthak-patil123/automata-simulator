import React from 'react';
import { X, BookOpen, Sparkles, CheckCircle2, Cpu, HelpCircle, Play } from 'lucide-react';

export default function QuickHelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Automata Learning Studio — Workflow Guide</h2>
              <p className="text-xs text-slate-400">How the active learning pipeline and simulation engine work</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <h3 className="font-bold text-blue-400 text-sm flex items-center gap-2 mb-1.5">
              <Cpu className="w-4 h-4 text-blue-400" />
              1. Dataset Ingestion & Validation
            </h3>
            <p className="text-slate-300">
              Upload any CSV with columns <code className="text-blue-300">string, label</code> (using 1/0 or true/false). The backend preprocessor cleans the dataset, parses the alphabet $\Sigma$, and checks sample density. You can also pick from the <strong>20 benchmark regular languages</strong>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <h3 className="font-bold text-purple-400 text-sm flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              2. Warm-Start Inference (Exact SAT & RPNI)
            </h3>
            <p className="text-slate-300">
              When you click <strong>Generate DFA</strong>, an exact synthesis (Biermann-Feldman SAT) or state-merging (RPNI) algorithm immediately builds a first-pass DFA. You see the graph instantly with its baseline accuracy metrics.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <h3 className="font-bold text-amber-400 text-sm flex items-center gap-2 mb-1.5">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              3. Active Learning (Angluin's L* + Human-in-the-Loop)
            </h3>
            <p className="text-slate-300">
              If the dataset is sparse and has boundary ambiguities, the AI active learner asks you targeted <strong>Yes/No membership queries</strong> (e.g., <em>"Is '101' accepted?"</em>). Each answer refines the observation table until the exact minimal DFA is proven (hard-capped at 4 questions).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <h3 className="font-bold text-emerald-400 text-sm flex items-center gap-2 mb-1.5">
              <Play className="w-4 h-4 text-emerald-400" />
              4. Interactive String Testing & Animated Tape
            </h3>
            <p className="text-slate-300">
              Type any test string and click <strong>Load & Run</strong>. Use <strong>Play</strong>, <strong>Next</strong>, or <strong>Back</strong> to watch the tape advance symbol by symbol, highlighting active states, traversed transitions, and emitting a final <strong>Accepted / Rejected</strong> verdict.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-800/40 text-[11px] text-blue-300">
            💡 <strong>Canvas Tip:</strong> Drag any state circle to customize the layout. Use mouse wheel to zoom in/out, and click-and-drag empty canvas space to pan.
          </div>
        </div>
      </div>
    </div>
  );
}
