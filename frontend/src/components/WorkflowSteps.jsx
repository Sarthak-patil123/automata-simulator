import React from 'react';
import { Database, Cpu, HelpCircle, PlayCircle, CheckCircle2 } from 'lucide-react';

export default function WorkflowSteps({ currentStep = 1, isConverged = false }) {
  const steps = [
    { id: 1, label: '1. Dataset', icon: Database, desc: 'Upload CSV or Preset' },
    { id: 2, label: '2. Generate', icon: Cpu, desc: 'Synthesize DFA / NFA' },
    { id: 3, label: '3. AI Refinement', icon: HelpCircle, desc: 'Active Learning (HITL)' },
    { id: 4, label: '4. Simulation', icon: PlayCircle, desc: 'Tape Execution Trace' },
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 mb-6 shadow-sm">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.id;
          const isDone = currentStep > s.id || (s.id === 3 && isConverged);

          return (
            <div
              key={s.id}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-600/20 border border-blue-500/40 text-blue-300 shadow-sm'
                  : isDone
                  ? 'bg-emerald-950/20 border border-emerald-800/30 text-emerald-300'
                  : 'bg-slate-800/40 border border-slate-800/60 text-slate-400'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-700/80 text-slate-300'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate leading-tight">{s.label}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{s.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
