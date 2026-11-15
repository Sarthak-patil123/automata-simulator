import React from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

export default function SimulationPanel({
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
  playbackSpeed,
  setPlaybackSpeed,
  activeState,
  initialState,
  alphabet = ['0', '1'],
}) {
  const steps = simulationTrace?.steps || [];
  const currentStep = steps[currentStepIndex];
  const isFinished = simulationTrace && currentStepIndex === steps.length - 1;

  const quickPresets = ['01', '101', '00', '11', '010', '1010', '111', ''];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-800">
        <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-[11px] font-mono font-bold">4</span>
          Interactive String Testing & Tape Execution
        </h2>
        <span className="text-[10px] font-mono text-slate-400">
          Alphabet: <strong className="text-blue-300">{`{${alphabet.join(', ')}}`}</strong>
        </span>
      </div>

      {/* Test String Input */}
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={testString}
          onChange={(e) => setTestString(e.target.value.trim())}
          placeholder="Enter test string (or leave empty for ε)..."
          onKeyDown={(e) => e.key === 'Enter' && onRunSimulation(testString)}
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition shadow-inner"
        />
        <button
          onClick={() => onRunSimulation(testString)}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition shrink-0 active:scale-95"
        >
          Load & Run
        </button>
      </div>

      {/* Quick Test String Chips */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        <span className="text-[10px] text-slate-500 font-mono">Quick test:</span>
        {quickPresets.map((str, idx) => (
          <button
            key={idx}
            onClick={() => {
              setTestString(str);
              onRunSimulation(str);
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-[10px] font-mono transition"
          >
            {str === '' ? 'ε' : str}
          </button>
        ))}
      </div>

      {/* Execution Controls & Tape */}
      {simulationTrace && (
        <div className="mt-3.5 pt-3 border-t border-slate-800 animate-fadeIn">
          {/* Controls Bar */}
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={onPlayPause}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 ${
                  isPlaying
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play Trace'}</span>
              </button>

              <button
                onClick={onStepPrev}
                disabled={currentStepIndex <= 0}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold disabled:opacity-40 transition flex items-center gap-1"
                title="Previous step"
              >
                <SkipBack className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back</span>
              </button>

              <button
                onClick={onStepNext}
                disabled={currentStepIndex >= steps.length - 1}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold disabled:opacity-40 transition flex items-center gap-1"
                title="Next step"
              >
                <span className="hidden sm:inline">Next</span>
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onReset}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition"
                title="Reset simulation to initial state"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Speed & Step Counter */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[10px] font-mono">
                {[0.5, 1, 2].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-1.5 py-0.5 rounded transition ${
                      playbackSpeed === spd
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
              <span className="text-xs font-mono text-slate-400 font-semibold">
                Step <strong className="text-blue-300">{currentStepIndex}</strong> / {steps.length - 1}
              </span>
            </div>
          </div>

          {/* Animated Horizontal Tape */}
          <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 mb-3 shadow-inner overflow-x-auto">
            <div className="flex items-center justify-center gap-1.5 min-w-max">
              {(simulationTrace.input_string || testString).split('').map((char, idx) => {
                const isConsumed = idx < currentStepIndex - 1;
                const isCurrent = idx === currentStepIndex - 1;

                return (
                  <div key={idx} className="flex flex-col items-center">
                    <span
                      className={`w-8 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-sm transition-all duration-200 ${
                        isCurrent
                          ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/50 ring-2 ring-blue-300 font-extrabold'
                          : isConsumed
                          ? 'bg-slate-800/60 text-slate-500 border border-slate-800'
                          : 'bg-slate-900 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {char}
                    </span>
                    <span className="text-[9px] text-slate-600 font-mono mt-1">
                      {isCurrent ? '▲ head' : idx}
                    </span>
                  </div>
                );
              })}

              {(simulationTrace.input_string || testString) === '' && (
                <div className="text-center py-1">
                  <span className="px-3 py-1 rounded-lg bg-blue-900/30 text-blue-300 border border-blue-700/40 font-mono text-xs font-bold">
                    ε (empty string tape)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Current State & Transition Log */}
          <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 mb-3">
            {currentStepIndex === 0 ? (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                <span>
                  ► Initial Configuration: At start state <strong className="text-yellow-400 font-bold">{initialState || 'q0'}</strong>
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span>
                  Read <strong className="text-amber-400 font-bold">'{currentStep?.consumed_symbol}'</strong>
                  {' ──► '}
                  Active: <strong className="text-blue-400 font-bold">{activeState || 'Dead'}</strong>
                </span>
                <span className="text-slate-500 text-[11px]">
                  Remaining tape: "{currentStep?.remaining_tape ?? ''}"
                </span>
              </div>
            )}
          </div>

          {/* Verdict Banner on Finish */}
          {isFinished && (
            <div
              className={`p-3.5 rounded-xl border text-center transition-all animate-fadeIn ${
                simulationTrace.accepted
                  ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 shadow-lg shadow-emerald-500/10'
                  : 'bg-rose-950/40 border-rose-500/60 text-rose-300 shadow-lg shadow-rose-500/10'
              }`}
            >
              <div className="flex items-center justify-center gap-2 text-sm font-extrabold uppercase tracking-wide">
                {simulationTrace.accepted ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>STRING ACCEPTED ✅</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-400" />
                    <span>STRING REJECTED ❌</span>
                  </>
                )}
              </div>
              <p className="text-[11px] mt-1 font-medium text-slate-300">
                {simulationTrace.accepted
                  ? `Execution terminated in accepting state '${activeState}'. String is in language L(M).`
                  : `Execution terminated in non-accepting state '${activeState || 'Dead'}'. String is NOT in language L(M).`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
