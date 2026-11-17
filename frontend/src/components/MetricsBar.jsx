import React from 'react';
import { Activity, Target, ShieldCheck, Zap } from 'lucide-react';

export default function MetricsBar({ modelMetrics, graphData, inferenceEngine }) {
  if (!modelMetrics && !graphData) return null;

  const accuracy   = modelMetrics?.accuracy  != null ? (modelMetrics.accuracy * 100).toFixed(1) : null;
  const precision  = modelMetrics?.precision != null ? modelMetrics.precision.toFixed(3) : null;
  const recall     = modelMetrics?.recall    != null ? modelMetrics.recall.toFixed(3) : null;
  const f1 = (modelMetrics?.f1_score ?? modelMetrics?.f1) != null
    ? (modelMetrics.f1_score ?? modelMetrics.f1).toFixed(3)
    : null;

  const statesCount      = graphData?.nodes?.length ?? '—';
  const transitionsCount = graphData?.edges?.length ?? '—';

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm flex items-center justify-between text-xs font-mono flex-wrap gap-3 mt-3">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-gray-600">
          <Activity className="w-3.5 h-3.5 text-violet-500" />
          <span className="text-gray-400">States:</span>
          <strong className="text-gray-800 text-sm">{statesCount}</strong>
        </div>

        <div className="flex items-center gap-1.5 text-gray-600">
          <span className="text-gray-400">Transitions:</span>
          <strong className="text-gray-700">{transitionsCount}</strong>
        </div>

        {accuracy !== null && (
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-gray-400">Accuracy:</span>
            <strong className="text-emerald-600 text-sm font-bold">{accuracy}%</strong>
          </div>
        )}

        {precision !== null && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Precision:</span>
            <strong className="text-gray-700">{precision}</strong>
          </div>
        )}

        {recall !== null && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Recall:</span>
            <strong className="text-gray-700">{recall}</strong>
          </div>
        )}

        {f1 !== null && (
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-gray-400">F1:</span>
            <strong className="text-violet-600 font-bold">{f1}</strong>
          </div>
        )}
      </div>

      {inferenceEngine && (
        <div className="flex items-center gap-1 text-[11px] text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-lg">
          <Zap className="w-3 h-3 text-violet-500" />
          <span>{inferenceEngine}</span>
        </div>
      )}
    </div>
  );
}
