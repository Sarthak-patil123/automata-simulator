import React from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

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
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <h2 className="text-xs font-bold uppercase tracking-wider text-violet-600 flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-violet-100 text-violet-600 flex items-center justify-center text-[11px] font-mono font-bold">4</span>
          String Testing &amp; Tape Execution
        </h2>
        <span className="text-[10px] font-mono text-gray-400">
          Σ: <strong className="text-violet-600">{`{${alphabet.join(', ')}}`}</strong>
        </span>
      </div>

      {/* Test String Input */}
      <div className="flex gap-2 mb-2">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-300 font-mono select-none">TRY</span>
          <input
            type="text"
            value={testString}
            onChange={(e) => setTestString(e.target.value.trim())}
            placeholder="Enter string…"
            onKeyDown={(e) => e.key === 'Enter' && onRunSimulation(testString)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-gray-800 placeholder-gray-300 focus:outline-none focus:border-violet-400 transition"
          />
        </div>
        <button
          onClick={() => onRunSimulation(testString)}
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl shadow-sm transition shrink-0 active:scale-95 flex items-center gap-1.5"
        >
          <Play className="w-3 h-3 text-violet-400 fill-violet-400" />
          Load &amp; Run
        </button>
      </div>

      {/* Quick Test Chips */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        <span className="text-[10px] text-gray-400 font-mono">Quick test:</span>
        {quickPresets.map((str, idx) => (
          <button
            key={idx}
            onClick={() => { setTestString(str); onRunSimulation(str); }}
            className="px-2 py-0.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 text-[10px] font-mono transition shadow-sm"
          >
            {str === '' ? 'ε' : str}
          </button>
        ))}
      </div>

      {/* Tape & Controls */}
      {simulationTrace && (
        <div className="mt-2 pt-3 border-t border-gray-100 animate-fadeIn">
          {/* Controls */}
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={onPlayPause}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-violet-600 hover:bg-violet-700 text-white'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                onClick={onStepPrev}
                disabled={currentStepIndex <= 0}
                className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold disabled:opacity-40 transition flex items-center gap-1 border border-gray-200"
              >
                <SkipBack className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back</span>
              </button>

              <button
                onClick={onStepNext}
                disabled={currentStepIndex >= steps.length - 1}
                className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold disabled:opacity-40 transition flex items-center gap-1 border border-gray-200"
              >
                <span className="hidden sm:inline">Next</span>
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onReset}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 rounded-lg transition border border-gray-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200 text-[10px] font-mono">
                {[0.5, 1, 2].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2 py-0.5 rounded transition ${
                      playbackSpeed === spd
                        ? 'bg-violet-600 text-white font-bold'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
              <span className="text-xs font-mono text-gray-400 font-semibold">
                Step <strong className="text-violet-600">{currentStepIndex}</strong> / {steps.length - 1}
              </span>
            </div>
          </div>

          {/* Tape */}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 mb-3 overflow-x-auto">
            <div className="flex items-center justify-center gap-1.5 min-w-max">
              {(simulationTrace.input_string || testString).split('').map((char, idx) => {
                const isConsumed = idx < currentStepIndex - 1;
                const isCurrent = idx === currentStepIndex - 1;

                return (
                  <div key={idx} className="flex flex-col items-center">
                    <span
                      className={`w-8 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-sm transition-all duration-200 ${
                        isCurrent
                          ? 'bg-violet-600 text-white scale-110 shadow-lg shadow-violet-200 ring-2 ring-violet-300 font-extrabold'
                          : isConsumed
                          ? 'bg-gray-200 text-gray-400 border border-gray-200'
                          : 'bg-white text-gray-700 border border-gray-200 shadow-sm'
                      }`}
                    >
                      {char}
                    </span>
                    <span className="text-[9px] text-gray-400 font-mono mt-1">
                      {isCurrent ? '▲ head' : idx}
                    </span>
                  </div>
                );
              })}

              {(simulationTrace.input_string || testString) === '' && (
                <div className="text-center py-1">
                  <span className="px-3 py-1 rounded-lg bg-violet-50 text-violet-600 border border-violet-200 font-mono text-xs font-bold">
                    ε (empty string tape)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* State Log */}
          <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs font-mono text-gray-600 mb-3">
            {currentStepIndex === 0 ? (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping"></span>
                <span>
                  ► Start: state <strong className="text-amber-600 font-bold">{initialState || 'q0'}</strong>
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span>
                  Read <strong className="text-amber-600 font-bold">'{currentStep?.consumed_symbol}'</strong>
                  {' ──► '}
                  Active: <strong className="text-violet-600 font-bold">{activeState || 'Dead'}</strong>
                </span>
                <span className="text-gray-400 text-[11px]">
                  Rem: "{currentStep?.remaining_tape ?? ''}"
                </span>
              </div>
            )}
          </div>

          {/* Verdict */}
          {isFinished && (
            <div
              className={`p-3.5 rounded-xl border text-center animate-fadeIn ${
                simulationTrace.accepted
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2 text-sm font-extrabold uppercase tracking-wide">
                {simulationTrace.accepted ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span>STRING ACCEPTED ✅</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span>STRING REJECTED ❌</span>
                  </>
                )}
              </div>
              <p className="text-[11px] mt-1 font-medium text-gray-500">
                {simulationTrace.accepted
                  ? `Terminated in accepting state '${activeState}'. String ∈ L(M).`
                  : `Terminated in non-accepting state '${activeState || 'Dead'}'. String ∉ L(M).`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
