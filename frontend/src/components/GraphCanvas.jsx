import React, { useRef, useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Download, Move } from 'lucide-react';
import { calculateEdgePath } from '../utils/graphLayout';

export default function GraphCanvas({
  graphData,
  nodePositions,
  setNodePositions,
  activeState,
  activeEdgeId,
  inferenceEngine,
  isConverged = false,
  automatonType = 'DFA',
}) {
  const svgRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 500 });

  useEffect(() => {
    if (!svgRef.current) return;
    const updateSize = () => {
      const rect = svgRef.current.getBoundingClientRect();
      setCanvasDimensions({ width: rect.width || 800, height: rect.height || 500 });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Zoom with mouse wheel
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setScale((prev) => Math.min(Math.max(prev * zoomFactor, 0.4), 2.5));
  };

  // Canvas Pan Handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('.node-element')) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    } else if (draggedNode && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / scale;
      const y = (e.clientY - rect.top - pan.y) / scale;
      setNodePositions((prev) => ({
        ...prev,
        [draggedNode]: { x, y },
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNode(null);
  };

  const resetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Export SVG
  const handleExportSvg = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgRef.current);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `automaton_${automatonType.toLowerCase()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];
  const startStateId = graphData?.initial_state;
  const acceptStateIds = new Set(graphData?.accepting_states || []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex-1 flex flex-col h-full text-slate-200">
      {/* Canvas Header */}
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
            {automatonType} State Transition Graph
          </h2>
          {graphData && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {nodes.length} States • {edges.length} Transitions
            </span>
          )}
          {isConverged && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700">
              ✓ 100% Minimal
            </span>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <button
            onClick={() => setScale((s) => Math.min(2.5, s + 0.15))}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setScale((s) => Math.max(0.4, s - 0.15))}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition"
            title="Reset View"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleExportSvg}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition flex items-center gap-1 text-[11px]"
            title="Export Vector SVG"
          >
            <Download className="w-3 h-3" />
            <span>SVG</span>
          </button>
        </div>
      </div>

      {/* Main SVG Area */}
      <div
        className="flex-1 w-full bg-slate-950 rounded-xl relative overflow-hidden select-none border border-slate-800/80 min-h-[460px] cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {graphData && nodes.length > 0 ? (
          <svg
            ref={svgRef}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          >
            {/* SVG Definitions for Markers & Filters */}
            <defs>
              {/* Normal Arrowhead */}
              <marker
                id="arrow-default"
                markerWidth="8"
                markerHeight="8"
                refX="5"
                refY="4"
                orient="auto"
              >
                <polygon points="0 1, 8 4, 0 7" fill="#64748B" />
              </marker>

              {/* Active Arrowhead */}
              <marker
                id="arrow-active"
                markerWidth="10"
                markerHeight="10"
                refX="6"
                refY="5"
                orient="auto"
              >
                <polygon points="0 1, 10 5, 0 9" fill="#38BDF8" />
              </marker>

              {/* Completed/Direct (Warm) */}
              <marker
                id="arrow-completed"
                markerWidth="8"
                markerHeight="8"
                refX="5"
                refY="4"
                orient="auto"
              >
                <polygon points="0 1, 8 4, 0 7" fill="#F59E0B" />
              </marker>

              {/* Node Glow Filters */}
              <filter id="glow-active" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Transform Group (Pan & Zoom) */}
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
              {/* 1. EDGES RENDERED FIRST (BEHIND NODES) */}
              {edges.map((edge) => {
                const srcPos = nodePositions[edge.source];
                const tgtPos = nodePositions[edge.target];
                if (!srcPos || !tgtPos) return null;

                const edgePathData = calculateEdgePath(
                  edge,
                  srcPos,
                  tgtPos,
                  edges,
                  canvasDimensions.height,
                  24
                );
                if (!edgePathData) return null;

                const isActive = activeEdgeId && (activeEdgeId.startsWith(edge.id) || activeEdgeId.includes(`${edge.source}_${edge.target}`));
                const isCompleted = edge.is_completed || edge.confidence === 'completed';

                const strokeColor = isActive ? '#38BDF8' : isCompleted ? '#F59E0B' : '#475569';
                const strokeWidth = isActive ? 3.5 : isCompleted ? 2.0 : 1.8;
                const markerUrl = isActive
                  ? 'url(#arrow-active)'
                  : isCompleted
                  ? 'url(#arrow-completed)'
                  : 'url(#arrow-default)';
                const textColor = isActive ? '#38BDF8' : isCompleted ? '#FCD34D' : '#94A3B8';
                const strokeDash = isCompleted ? '5 4' : 'none';

                return (
                  <g key={edge.id} className="transition-all duration-300">
                    {/* Shadow / background glow on active edge */}
                    {isActive && (
                      <path
                        d={edgePathData.d}
                        stroke="#0284C7"
                        strokeWidth={7}
                        strokeOpacity={0.4}
                        fill="none"
                      />
                    )}

                    {/* Main Edge Path */}
                    <path
                      d={edgePathData.d}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDash}
                      fill="none"
                      markerEnd={markerUrl}
                    />

                    {/* Edge Label Badge */}
                    <g transform={`translate(${edgePathData.lx}, ${edgePathData.ly})`}>
                      <rect
                        x="-10"
                        y="-8"
                        width="20"
                        height="16"
                        rx="4"
                        fill="#0F172A"
                        fillOpacity="0.9"
                        stroke={strokeColor}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="3"
                        fill={textColor}
                        fontFamily="JetBrains Mono"
                        fontSize="11"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {edge.combined_label || edge.label || edge.symbol}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* 2. NODES RENDERED ON TOP */}
              {nodes.map((node) => {
                const pos = nodePositions[node.id];
                if (!pos) return null;

                const isInitial = node.id === startStateId;
                const isAccept = acceptStateIds.has(node.id);
                const isActive = node.id === activeState;

                return (
                  <g
                    key={node.id}
                    className="node-element cursor-grab active:cursor-grabbing"
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggedNode(node.id);
                    }}
                  >
                    {/* Pulsing ring on active node */}
                    {isActive && (
                      <circle
                        r="32"
                        fill="none"
                        stroke="#38BDF8"
                        strokeWidth="3"
                        className="animate-ping opacity-60"
                      />
                    )}

                    {/* Accepting Double Outer Ring */}
                    {isAccept && (
                      <circle
                        r="29"
                        fill="none"
                        stroke={isActive ? '#38BDF8' : '#10B981'}
                        strokeWidth="2.5"
                        strokeDasharray={isInitial ? 'none' : 'none'}
                      />
                    )}

                    {/* Base Node Circle */}
                    <circle
                      r="23"
                      fill={
                        isActive
                          ? '#0369A1'
                          : isAccept
                          ? '#064E3B'
                          : isInitial
                          ? '#1E293B'
                          : '#0F172A'
                      }
                      stroke={
                        isActive
                          ? '#38BDF8'
                          : isAccept
                          ? '#34D399'
                          : isInitial
                          ? '#F59E0B'
                          : '#64748B'
                      }
                      strokeWidth={isActive ? '3' : '2'}
                      filter={isActive ? 'url(#glow-active)' : undefined}
                    />

                    {/* Start State Arrow Indicator */}
                    {isInitial && (
                      <g transform="translate(-44, 0)">
                        <line x1="-12" y1="0" x2="16" y2="0" stroke="#F59E0B" strokeWidth="2.5" />
                        <polygon points="14,-5 22,0 14,5" fill="#F59E0B" />
                        <text
                          x="-8"
                          y="-8"
                          fill="#F59E0B"
                          fontSize="9"
                          fontFamily="JetBrains Mono"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          START
                        </text>
                      </g>
                    )}

                    {/* State Label Text */}
                    <text
                      x="0"
                      y="4"
                      fill="#FFFFFF"
                      fontFamily="JetBrains Mono"
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {node.label || node.id}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-600">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl font-mono text-slate-500 mb-3">
              ◎
            </div>
            <p className="text-sm font-semibold text-slate-400">Automaton Canvas Empty</p>
            <p className="text-xs text-slate-600 mt-1">
              Select a dataset from the left panel and click <strong>Generate DFA</strong> or <strong>Generate NFA</strong>.
            </p>
          </div>
        )}

        {/* Legend Overlay */}
        {graphData && nodes.length > 0 && (
          <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-[11px] font-mono text-slate-300 flex items-center gap-4 flex-wrap backdrop-blur-md shadow-lg">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-500 bg-slate-800"></span>
              <span>State (Q)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full border-2 border-emerald-400 bg-emerald-950/80"></span>
              <span className="text-emerald-400">Accepting (F)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-blue-400 bg-blue-600"></span>
              <span className="text-blue-300 font-bold">Active Head</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-amber-400 font-bold">▶</span>
              <span className="text-amber-400">q₀ Start</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
              <Move className="w-3 h-3 text-slate-500" />
              <span>Drag states to reposition</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
