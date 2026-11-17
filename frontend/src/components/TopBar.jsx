import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Layers,
  BookOpen,
  ArrowLeft,
  ChevronDown,
  Heart,
  Edit3,
} from 'lucide-react';

export default function TopBar({
  onOpenLanding,
  onOpenBenchmarks,
  onOpenHelp,
  modelType = 'DFA',
  graphData,
  activeBenchmarkTitle = 'Even Parity Checker',
  // Simulation controls
  testString,
  setTestString,
  onRunSimulation,
  simulationTrace,
  currentStepIndex,
  onStepNext,
  onStepPrev,
  onPlayPause,
  onReset,
  isPlaying,
  activeState,
}) {
  const [isEditingInput, setIsEditingInput] = useState(false);
  const steps = simulationTrace?.steps || [];
  const isFinished = simulationTrace && steps.length > 0 && currentStepIndex === steps.length - 1;

  // Derive tape array reliably from trace or test string
  const tape =
    simulationTrace?.tape ||
    (simulationTrace?.input_string != null
      ? simulationTrace.input_string.split('')
      : testString
      ? testString.split('')
      : []);

  const handleRun = () => {
    setIsEditingInput(false);
    onRunSimulation(testString);
  };

  return (
    <header className="h-16 bg-white border-b border-zinc-200/90 px-4 sm:px-6 flex items-center justify-between gap-4 z-40 shrink-0 select-none shadow-sm relative">
      {/* ── LEFT: Logo & Machine Breadcrumb ───────────────────────── */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenLanding}
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 transition text-xs font-semibold pr-2 border-r border-zinc-200"
          title="Return to Landing Page"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Home</span>
        </button>

        {/* Brand Icon */}
        <div
          onClick={onOpenLanding}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-xs group-hover:scale-105 transition">
            δ
          </div>
        </div>

        {/* Machine Indicator & Benchmark Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenBenchmarks}
            className="flex items-center gap-2 text-left hover:bg-zinc-50 px-2 py-1 rounded-xl transition border border-transparent hover:border-zinc-200"
          >
            <div>
              <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <span className="truncate max-w-[130px] sm:max-w-[200px]">
                  {activeBenchmarkTitle || 'Custom Automaton'}
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-brand-50 text-brand-700 border border-brand-200 uppercase">
                  {modelType}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* ── CENTER: Floating Simulation Tape Bar (Matching Screenshot 4) ─── */}
      <div className="flex-1 max-w-2xl flex items-center justify-center">
        {graphData ? (
          <div className="bg-zinc-950 text-white rounded-xl px-3 py-1.5 shadow-md flex items-center gap-2.5 sm:gap-3 border border-zinc-800 animate-fade-in w-auto">
            {/* INPUT Label + Tape / Input */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 tracking-wider">
                INPUT
              </span>

              {/* Show tape cells if simulation loaded and not editing */}
              {simulationTrace && !isEditingInput ? (
                <div className="flex items-center gap-1">
                  {tape.length > 0 ? (
                    tape.map((char, idx) => {
                      const isConsumed = idx < currentStepIndex;
                      const isHead = idx === currentStepIndex;

                      return (
                        <div
                          key={idx}
                          className={`w-6 h-6 rounded-md font-mono text-xs font-bold flex items-center justify-center transition-all ${
                            isHead
                              ? 'bg-pink-600 text-white scale-110 shadow ring-2 ring-pink-400'
                              : isConsumed
                              ? 'bg-zinc-900 text-zinc-600 line-through'
                              : 'bg-zinc-900 text-zinc-300'
                          }`}
                        >
                          {char}
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-xs font-mono text-zinc-400 italic px-1">ε (empty)</span>
                  )}

                  <button
                    onClick={() => setIsEditingInput(true)}
                    className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-md transition ml-1"
                    title="Change input string"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                /* Inline Quick Input */
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={testString}
                    onChange={(e) => setTestString(e.target.value.trim())}
                    onKeyDown={(e) => e.key === 'Enter' && handleRun()}
                    placeholder="Enter string..."
                    className="w-28 sm:w-36 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-0.5 text-xs font-mono font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500"
                  />
                  <button
                    onClick={handleRun}
                    className="p-1 rounded-md bg-brand-600 hover:bg-brand-500 text-white transition text-[11px] font-mono font-bold px-2.5"
                  >
                    Run
                  </button>
                </div>
              )}
            </div>

            {/* Playback Controls & Counter */}
            {simulationTrace && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-800">
                <button
                  onClick={onPlayPause}
                  className={`p-1.5 rounded-lg transition ${
                    isPlaying
                      ? 'bg-amber-500 text-zinc-950 font-bold'
                      : 'bg-brand-600 text-white hover:bg-brand-500'
                  }`}
                  title={isPlaying ? 'Pause' : isFinished ? 'Replay' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                </button>

                <button
                  onClick={onStepPrev}
                  disabled={currentStepIndex <= 0}
                  className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-300 hover:text-white transition disabled:opacity-30"
                  title="Step Backward"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={onStepNext}
                  disabled={isFinished}
                  className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-300 hover:text-white transition disabled:opacity-30"
                  title="Step Forward"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={onReset}
                  className="p-1.5 hover:bg-zinc-900 rounded-lg text-zinc-300 hover:text-white transition"
                  title="Reset Simulation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Step indicator */}
                <span className="text-[11px] font-mono text-zinc-400 px-1 whitespace-nowrap">
                  {currentStepIndex}/{Math.max(0, steps.length - 1)}
                </span>

                {/* Verdict Badge */}
                {isFinished && (
                  <div
                    className={`ml-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                      simulationTrace.accepted
                        ? 'bg-teal-950 text-teal-300 border border-teal-600/70 shadow-xs'
                        : 'bg-rose-950 text-rose-300 border border-rose-600/70 shadow-xs'
                    }`}
                  >
                    {simulationTrace.accepted ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span>Accepted {activeState ? `in ${activeState}` : ''}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>
                          {simulationTrace.is_stuck
                            ? 'Rejected (No path available)'
                            : `Rejected ${activeState ? `in ${activeState}` : ''}`}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
            <span>Ready to build automaton</span>
          </div>
        )}
      </div>

      {/* ── RIGHT: Sponsor & Actions ─────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenBenchmarks}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-700 transition"
        >
          <Layers className="w-3.5 h-3.5 text-brand-600" />
          <span>Examples</span>
        </button>

        <button
          onClick={onOpenHelp}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-700 transition"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
          <span>Guide</span>
        </button>

        <button
          onClick={() => alert('Thanks for using Automata Studio!')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-700 transition"
        >
          <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-50" />
          <span className="hidden md:inline">Sponsor</span>
        </button>
      </div>
    </header>
  );
}
