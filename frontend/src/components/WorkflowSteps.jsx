import React from 'react';
import { Database, Cpu, HelpCircle, PlayCircle, CheckCircle2 } from 'lucide-react';

export default function WorkflowSteps({ currentStep = 1, isConverged = false }) {
  const steps = [
    { id: 1, label: 'Dataset',       icon: Database,    desc: 'Upload CSV or preset' },
    { id: 2, label: 'Generate',      icon: Cpu,         desc: 'Synthesize DFA / NFA' },
    { id: 3, label: 'AI Refinement', icon: HelpCircle,  desc: 'Active Learning (L*)' },
    { id: 4, label: 'Simulation',    icon: PlayCircle,  desc: 'Tape execution trace' },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 mb-5 shadow-sm">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.id;
          const isDone   = currentStep > s.id || (s.id === 3 && isConverged);

          return (
            <div
              key={s.id}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                isActive
                  ? 'bg-violet-50 border border-violet-200 text-violet-700 shadow-sm'
                  : isDone
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-gray-50 border border-gray-200 text-gray-400'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-sm shadow-violet-300'
                    : isDone
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate leading-tight">{s.label}</div>
                <div className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-violet-500' : isDone ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {s.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
