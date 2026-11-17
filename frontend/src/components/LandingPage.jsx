import React, { useState, useEffect } from 'react';
import {
  Play,
  ArrowRight,
  Sparkles,
  Layers,
  BookOpen,
  Cpu,
  Download,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Code2,
  Zap,
} from 'lucide-react';
import { BENCHMARK_QUESTIONS } from '../data/benchmarkQuestions';

export default function LandingPage({
  onOpenSimulator,
  onLoadExample,
  onOpenHelp,
  onOpenBenchmarks,
}) {
  // Demo tape simulation for the hero diagram
  const heroTape = ['1', '1', '0', '0', '1', '0', '1', '0'];
  const [tapeIndex, setTapeIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // States: q0 -> (1) -> q1 -> (1) -> q0 -> (0) -> q2
  // Sequence of states for the hero tape:
  // tape: 1, 1, 0, 0, 1, 0, 1, 0
  const stateSequence = ['q0', 'q1', 'q0', 'q2', 'q2', 'q0', 'q2', 'q0', 'q2'];
  const activeHeroState = stateSequence[tapeIndex] || 'q0';

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTapeIndex((prev) => (prev + 1) % heroTape.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [isPlaying, heroTape.length]);

  // Select top 8 worked examples for the landing page grid
  const featuredExamples = BENCHMARK_QUESTIONS.slice(0, 8);

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. NAVIGATION
      ───────────────────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center font-mono font-bold text-base shadow-sm group-hover:scale-105 transition">
              δ
            </div>
            <span className="font-heading font-extrabold text-lg tracking-tight text-zinc-900">
              automata<span className="text-brand-600">verse</span>
            </span>
          </div>

          {/* Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
            <button
              onClick={onOpenSimulator}
              className="hover:text-zinc-900 transition hover:scale-105"
            >
              Simulator
            </button>
            <button
              onClick={onOpenHelp}
              className="hover:text-zinc-900 transition hover:scale-105"
            >
              Learn
            </button>
            <button
              onClick={onOpenBenchmarks}
              className="hover:text-zinc-900 transition hover:scale-105"
            >
              Classrooms
            </button>
            <a
              href="#examples"
              className="hover:text-zinc-900 transition hover:scale-105"
            >
              Examples
            </a>
            <span className="text-zinc-300">|</span>
            <button
              onClick={() => alert('Pricing: 100% Free & Open Source for Education!')}
              className="hover:text-zinc-900 transition"
            >
              Pricing
            </button>
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSimulator}
              className="hidden sm:inline-flex text-xs font-semibold text-zinc-600 hover:text-zinc-900 px-3 py-2 transition"
            >
              Sign in
            </button>
            <button
              onClick={onOpenSimulator}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md transition active:scale-95"
            >
              <span>Open simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. HERO SECTION (Two-column layout matching Automataverse)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-zinc-100 bg-gradient-to-b from-white via-zinc-50/40 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Heading + Pitch */}
            <div className="lg:col-span-6 space-y-6 animate-fade-in-up">
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-[11px] font-mono font-semibold text-zinc-600 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span>
                • 7 MACHINE TYPES • FREE &amp; OPEN •
              </div>

              {/* Main Headline */}
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-950 tracking-tight leading-[1.1]">
                Build the machine. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-600">
                  Watch it read.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-zinc-600 leading-relaxed max-w-xl">
                A visual simulator for automata theory. Synthesize and draw states and transitions,
                feed in a string, and step through the computation one symbol at a time —
                DFA, NFA, active learning with Angluin's L*, and instant validation.
              </p>

              {/* CTA Buttons */}
              <div className="flex items-center gap-3 pt-2 flex-wrap">
                <button
                  onClick={onOpenSimulator}
                  className="px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition active:scale-95 flex items-center gap-2"
                >
                  <span>Start building</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href="#examples"
                  className="px-6 py-3.5 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-semibold text-sm shadow-sm hover:shadow transition active:scale-95"
                >
                  Browse examples
                </a>
              </div>


            </div>

            {/* Right Column: Hero Automata Canvas Diagram */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-2xl border border-zinc-200/80 shadow-2xl bg-white overflow-hidden canvas-grid aspect-[4/3] flex flex-col justify-between p-6">
                {/* Canvas Status Watermark */}
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400 select-none">
                  <span className="font-bold text-zinc-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                    Interactive Preview
                  </span>
                  <span>DFA · Σ = {'{0, 1}'}</span>
                </div>

                {/* SVG Visual Automaton Diagram */}
                <div className="relative flex-1 flex items-center justify-center">
                  <svg viewBox="0 0 440 260" className="w-full h-full max-w-[440px] overflow-visible">
                    <defs>
                      <marker
                        id="hero-arrow"
                        viewBox="0 0 10 10"
                        refX="10"
                        refY="5"
                        markerWidth="8"
                        markerHeight="8"
                        orient="auto"
                        markerUnits="userSpaceOnUse"
                      >
                        <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#64748b" />
                      </marker>

                      <marker
                        id="hero-arrow-pink"
                        viewBox="0 0 10 10"
                        refX="10"
                        refY="5"
                        markerWidth="9"
                        markerHeight="9"
                        orient="auto"
                        markerUnits="userSpaceOnUse"
                      >
                        <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#ec4899" />
                      </marker>

                      <marker
                        id="hero-arrow-cyan"
                        viewBox="0 0 10 10"
                        refX="10"
                        refY="5"
                        markerWidth="9"
                        markerHeight="9"
                        orient="auto"
                        markerUnits="userSpaceOnUse"
                      >
                        <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#06b6d4" />
                      </marker>
                    </defs>

                    {/* Transition from q0 to q1 (curved top, symbol '1') */}
                    <path
                      d="M 121 99 Q 205 55 285 97"
                      fill="none"
                      stroke={activeHeroState === 'q1' ? '#ec4899' : '#94a3b8'}
                      strokeWidth={activeHeroState === 'q1' ? '2.5' : '1.75'}
                      markerEnd={activeHeroState === 'q1' ? 'url(#hero-arrow-pink)' : 'url(#hero-arrow)'}
                      className="transition-all duration-300"
                    />
                    <g transform="translate(204, 73)">
                      <rect x="-11" y="-10" width="22" height="20" rx="5" fill="#ffffff" stroke={activeHeroState === 'q1' ? '#ec4899' : '#cbd5e1'} strokeWidth="1.2" className="shadow-xs" />
                      <text x="0" y="4" fill={activeHeroState === 'q1' ? '#db2777' : '#64748b'} fontSize="11" fontFamily="JetBrains Mono" fontWeight="bold" textAnchor="middle">1</text>
                    </g>

                    {/* Transition from q1 to q0 (curved bottom, symbol '1') */}
                    <path
                      d="M 285 123 Q 205 165 121 121"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="1.75"
                      markerEnd="url(#hero-arrow)"
                    />
                    <g transform="translate(204, 147)">
                      <rect x="-11" y="-10" width="22" height="20" rx="5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" className="shadow-xs" />
                      <text x="0" y="4" fill="#64748b" fontSize="11" fontFamily="JetBrains Mono" fontWeight="bold" textAnchor="middle">1</text>
                    </g>

                    {/* Transition from q0 to q2 (downward, symbol '0') */}
                    <path
                      d="M 118 126 L 202 199"
                      fill="none"
                      stroke={activeHeroState === 'q2' ? '#06b6d4' : '#94a3b8'}
                      strokeWidth={activeHeroState === 'q2' ? '2.5' : '1.75'}
                      markerEnd={activeHeroState === 'q2' ? 'url(#hero-arrow-cyan)' : 'url(#hero-arrow)'}
                      className="transition-all duration-300"
                    />
                    <g transform="translate(156, 160)">
                      <rect x="-11" y="-10" width="22" height="20" rx="5" fill="#ffffff" stroke={activeHeroState === 'q2' ? '#06b6d4' : '#cbd5e1'} strokeWidth="1.2" className="shadow-xs" />
                      <text x="0" y="4" fill={activeHeroState === 'q2' ? '#0891b2' : '#64748b'} fontSize="11" fontFamily="JetBrains Mono" fontWeight="bold" textAnchor="middle">0</text>
                    </g>

                    {/* State q0 (Start State) */}
                    <g transform="translate(100, 110)">
                      {/* Start Arrow */}
                      <g transform="translate(-36, 0)">
                        <line x1="-12" y1="0" x2="10" y2="0" stroke="#64748b" strokeWidth="2.5" />
                        <polygon points="8,-4 14,0 8,4" fill="#64748b" />
                      </g>

                      {activeHeroState === 'q0' && (
                        <circle r="30" fill="none" stroke="#6366f1" strokeWidth="2" className="animate-ping opacity-40" />
                      )}
                      <circle
                        r="22"
                        fill={activeHeroState === 'q0' ? '#eef2ff' : '#ffffff'}
                        stroke={activeHeroState === 'q0' ? '#6366f1' : '#334155'}
                        strokeWidth="2"
                        className="transition-colors duration-300"
                      />
                      <text x="0" y="4" fill="#0f172a" fontFamily="JetBrains Mono" fontSize="12" fontWeight="bold" textAnchor="middle">
                        q0
                      </text>
                    </g>

                    {/* State q1 (Accepting State with Double Ring) */}
                    <g transform="translate(310, 110)">
                      {activeHeroState === 'q1' && (
                        <circle r="34" fill="none" stroke="#ec4899" strokeWidth="2" className="animate-ping opacity-40" />
                      )}
                      {/* Double ring */}
                      <circle
                        r="27"
                        fill="none"
                        stroke={activeHeroState === 'q1' ? '#ec4899' : '#f472b6'}
                        strokeWidth="1.75"
                        strokeDasharray={activeHeroState === 'q1' ? 'none' : '4 2'}
                        className="transition-colors duration-300"
                      />
                      <circle
                        r="22"
                        fill={activeHeroState === 'q1' ? '#fdf2f8' : '#ffffff'}
                        stroke={activeHeroState === 'q1' ? '#db2777' : '#ec4899'}
                        strokeWidth="2"
                        className="transition-colors duration-300"
                      />
                      <text x="0" y="4" fill="#0f172a" fontFamily="JetBrains Mono" fontSize="12" fontWeight="bold" textAnchor="middle">
                        q1
                      </text>
                    </g>

                    {/* State q2 (Normal State) */}
                    <g transform="translate(220, 210)">
                      {activeHeroState === 'q2' && (
                        <circle r="30" fill="none" stroke="#06b6d4" strokeWidth="2" className="animate-ping opacity-40" />
                      )}
                      <circle
                        r="22"
                        fill={activeHeroState === 'q2' ? '#ecfeff' : '#ffffff'}
                        stroke={activeHeroState === 'q2' ? '#0891b2' : '#334155'}
                        strokeWidth="2"
                        className="transition-colors duration-300"
                      />
                      <text x="0" y="4" fill="#0f172a" fontFamily="JetBrains Mono" fontSize="12" fontWeight="bold" textAnchor="middle">
                        q2
                      </text>
                    </g>
                  </svg>
                </div>

                {/* Floating Tape Bar (matching reference bottom right bar) */}
                <div className="bg-zinc-950 text-white rounded-xl p-2.5 shadow-2xl flex items-center justify-between gap-3 border border-zinc-800">
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-7 h-7 rounded-lg bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center transition shrink-0"
                    >
                      <Play className={`w-3.5 h-3.5 fill-current ${isPlaying ? 'opacity-80' : ''}`} />
                    </button>

                    {heroTape.map((symbol, idx) => {
                      const isCurrent = idx === tapeIndex;
                      const isPast = idx < tapeIndex;
                      return (
                        <div
                          key={idx}
                          className={`w-6 h-6 rounded font-mono text-xs font-bold flex items-center justify-center transition-all ${
                            isCurrent
                              ? 'bg-pink-600 text-white scale-110 shadow-md ring-2 ring-pink-400'
                              : isPast
                              ? 'bg-zinc-900 text-zinc-500'
                              : 'bg-zinc-900 text-zinc-300'
                          }`}
                        >
                          {symbol}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={onOpenSimulator}
                    className="text-xs font-semibold text-zinc-300 hover:text-white transition shrink-0 flex items-center gap-1 pl-2 border-l border-zinc-800"
                  >
                    <span>Open it</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. THREE-COLUMN FEATURES SECTION
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 border-b border-zinc-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-zinc-100">
            {/* Feature 1: STEP */}
            <div className="pt-6 md:pt-0 md:px-6 first:pl-0 space-y-2">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-brand-600">
                STEP
              </div>
              <h3 className="font-heading font-bold text-lg text-zinc-900">
                One symbol at a time
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Step through a run or let it play to the end. The active state and the symbol under
                the tape head move together with animated visual feedback.
              </p>
            </div>

            {/* Feature 2: TEACH */}
            <div className="pt-6 md:pt-0 md:px-6 space-y-2">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-teal-600">
                TEACH
              </div>
              <h3 className="font-heading font-bold text-lg text-zinc-900">
                Active Learning &amp; L*
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Synthesize minimal DFAs directly from sparse datasets using Angluin's L* active
                learner, oracle membership queries, and Biermann SAT exact solvers.
              </p>
            </div>

            {/* Feature 3: KEEP */}
            <div className="pt-6 md:pt-0 md:px-6 last:pr-0 space-y-2">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-pink-600">
                KEEP
              </div>
              <h3 className="font-heading font-bold text-lg text-zinc-900">
                Yours to export
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Machines stay in your browser by default. Export crisp vector SVGs for papers,
                slides, homework assignments, or classroom tests with one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. WORKED EXAMPLES SECTION (Matching Screenshot 3)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section id="examples" className="py-20 bg-zinc-50/60 border-b border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                Eight worked examples, one click away
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                Load a machine, run a string, then edit or extend it into your own.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onOpenBenchmarks}
                className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition shadow-sm"
              >
                View all 20 benchmarks
              </button>
              <button
                onClick={onOpenSimulator}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-xs font-semibold text-white transition shadow-sm"
              >
                Open Simulator
              </button>
            </div>
          </div>

          {/* Cards Grid — strictly inspired by screenshot 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredExamples.map((item) => {
              const isNfa = item.title?.toLowerCase().includes('nfa') || item.slug?.includes('nfa');
              const machineLabel = isNfa ? 'NFA' : 'DFA';
              const machineBadge = isNfa
                ? 'bg-sky-50 text-sky-700 border-sky-200'
                : 'bg-brand-50 text-brand-700 border-brand-200';

              const posStrings = item.csv
                ? item.csv
                    .split('\n')
                    .slice(1)
                    .filter((r) => r.endsWith(',1'))
                    .map((r) => r.split(',')[0])
                    .filter(Boolean)
                : [];
              const tryString = posStrings[0] || '11001010';

              return (
                <div
                  key={item.id}
                  className="bg-white border border-zinc-200/90 rounded-2xl p-5 hover:border-brand-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Machine Badge + Level Badge */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono border ${machineBadge}`}>
                        {machineLabel}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                        {item.level.split('–')[0]?.trim() || 'BEGINNER'}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-heading font-bold text-sm text-zinc-900 group-hover:text-brand-600 transition leading-snug">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-zinc-500 line-clamp-3 leading-relaxed">
                      {item.description}
                    </p>

                    {/* TRY Row */}
                    <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200/80 rounded-xl px-3 py-2 font-mono text-xs text-zinc-800">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">TRY</span>
                      <span className="font-bold tracking-wider text-zinc-900">{tryString}</span>
                    </div>
                  </div>

                  {/* Dark "Load into canvas" Button */}
                  <button
                    onClick={() => onLoadExample(item)}
                    className="mt-5 w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm active:scale-95 group-hover:bg-brand-600"
                  >
                    <Play className="w-3.5 h-3.5 fill-current text-brand-400 group-hover:text-white transition" />
                    <span>Load into canvas</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          5. FOOTER (Matching Screenshot 2)
      ───────────────────────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-zinc-100 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center font-mono font-bold text-xs">
              δ
            </div>
            <span className="font-heading font-bold text-sm text-zinc-900">
              automata<span className="text-brand-600">verse</span>
            </span>
            <span className="text-xs text-zinc-400 ml-2">© 2026 Academic Simulator</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-zinc-500 font-medium flex-wrap justify-center">
            <button onClick={onOpenSimulator} className="hover:text-zinc-900 transition">Simulator</button>
            <button onClick={onOpenHelp} className="hover:text-zinc-900 transition">Learn</button>
            <button onClick={onOpenBenchmarks} className="hover:text-zinc-900 transition">Classrooms</button>
            <a href="#examples" className="hover:text-zinc-900 transition">Examples</a>
            <span className="hover:text-zinc-900 transition cursor-pointer">Pricing</span>
            <span className="hover:text-zinc-900 transition cursor-pointer">Changelog</span>
            <span className="hover:text-zinc-900 transition cursor-pointer">Privacy</span>
            <span className="hover:text-zinc-900 transition cursor-pointer">Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
