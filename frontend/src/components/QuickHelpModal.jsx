import React from 'react';
import { X, BookOpen, Sparkles, CheckCircle2, Cpu, HelpCircle, Play } from 'lucide-react';

export default function QuickHelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-zinc-900">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-zinc-900">Workflow &amp; Active Learning Guide</h2>
              <p className="text-xs text-zinc-500">How the synthesis pipeline, Angluin L*, and simulation tape work</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-3.5 text-xs leading-relaxed">
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80">
            <h3 className="font-heading font-bold text-brand-600 text-sm flex items-center gap-2 mb-1.5">
              <Cpu className="w-4 h-4" />
              1. Dataset Ingestion &amp; Validation
            </h3>
            <p className="text-zinc-600">
              Upload any CSV with columns <code className="bg-white border border-zinc-200 px-1 py-0.5 rounded font-mono font-bold text-zinc-800">string, label</code> (using 1/0 or true/false).
              The preprocessor validates alphabet Σ, eliminates contradictions, and prepares positive and negative sample sets.
              You can also pick from the <strong className="text-zinc-900">20 regular language benchmarks</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80">
            <h3 className="font-heading font-bold text-indigo-600 text-sm flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4" />
              2. Warm-Start Inference (SAT &amp; RPNI)
            </h3>
            <p className="text-zinc-600">
              When you click <strong className="text-zinc-900">Generate DFA</strong>, an exact synthesis (Biermann-Feldman SAT) or state-merging (RPNI) algorithm immediately builds a first-pass DFA.
              You see the interactive canvas immediately with full graph layout.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80">
            <h3 className="font-heading font-bold text-amber-600 text-sm flex items-center gap-2 mb-1.5">
              <HelpCircle className="w-4 h-4" />
              3. Human-In-The-Loop Active Learning (Angluin's L*)
            </h3>
            <p className="text-zinc-600">
              If the initial dataset is sparse, the system triggers active disambiguation questions.
              Answer <strong className="text-teal-700">Yes</strong> or <strong className="text-rose-700">No</strong> to provide oracle feedback.
              Once conjectures are verified, the machine converges to the 100% minimal canonical automaton!
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80">
            <h3 className="font-heading font-bold text-teal-600 text-sm flex items-center gap-2 mb-1.5">
              <Play className="w-4 h-4" />
              4. Interactive String Testing &amp; Tape Simulation
            </h3>
            <p className="text-zinc-600">
              Input any test string into the top tape bar and hit <strong className="text-zinc-900">Run</strong>.
              Step through the tape symbol by symbol, observe active states highlighted with pink/purple rings, and inspect the final <strong className="text-zinc-900">Accepted / Rejected</strong> verdict banner.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200 text-xs text-brand-900">
            💡 <strong>Canvas Tip:</strong> Drag any state circle to rearrange the diagram. Click a state to edit its label, or toggle start and accepting flags. Use the mouse wheel to zoom in/out, and click-and-drag empty grid space to pan.
          </div>
        </div>
      </div>
    </div>
  );
}
