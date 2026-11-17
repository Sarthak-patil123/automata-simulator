import React, { useRef, useState, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  Plus,
  Trash2,
  CheckCircle,
  Flag,
  X,
} from 'lucide-react';
import { calculateEdgePath } from '../utils/graphLayout';
import { edgeMatchesSymbol, getStateId } from '../utils/simulation';

export default function GraphCanvas({
  graphData,
  setGraphData,
  nodePositions,
  setNodePositions,
  activeState,
  activeStates = [],
  activeEdgeId,
  activeEdgeIds = [],
  currentStep,
  inferenceEngine,
  isConverged = false,
  automatonType = 'DFA',
  onSelectNode,
  selectedNodeId,
  setSelectedNodeId,
}) {
  const svgRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState(null);

  // Machine switching smooth transition animation state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevTypeRef = useRef(automatonType);

  // Floating Contextual Properties Panel for selected state
  const [editingLabel, setEditingLabel] = useState('');

  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];
  const startStateId = getStateId(
    graphData?.initial_state ??
    graphData?.start_state ??
    nodes.find((n) => n.is_initial || n.data?.is_initial)?.id ??
    nodes[0]?.id
  );

  const acceptStateIds = new Set();
  const rawAccepting = graphData?.accepting_states || graphData?.accept_states || [];
  if (Array.isArray(rawAccepting)) {
    rawAccepting.forEach((s) => {
      const id = getStateId(s);
      if (id) acceptStateIds.add(id);
    });
  } else if (rawAccepting instanceof Set) {
    rawAccepting.forEach((s) => {
      const id = getStateId(s);
      if (id) acceptStateIds.add(id);
    });
  }
  nodes.forEach((n) => {
    if (n && (n.is_accepting || n.data?.is_accepting)) {
      const id = getStateId(n.id || n.label);
      if (id) acceptStateIds.add(id);
    }
  });

  // Compute active state set (supports single state or multiple for NFA)
  const currentActiveSet = new Set();
  const rawActive =
    activeStates.length > 0
      ? activeStates
      : activeState
      ? [activeState]
      : [];
  rawActive.forEach((s) => {
    const id = getStateId(s);
    if (id) {
      currentActiveSet.add(id);
      currentActiveSet.add(String(id));
    }
  });

  // Compute active edges set
  const currentActiveEdgeSet = new Set(
    activeEdgeIds.length > 0
      ? activeEdgeIds
      : activeEdgeId
      ? [activeEdgeId]
      : []
  );

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  useEffect(() => {
    if (selectedNode) {
      setEditingLabel(selectedNode.label || selectedNode.id);
    }
  }, [selectedNodeId, selectedNode]);

  // Smooth machine type switching transition
  useEffect(() => {
    if (prevTypeRef.current !== automatonType) {
      prevTypeRef.current = automatonType;
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 220);
      return () => clearTimeout(timer);
    }
  }, [automatonType]);

  // Dynamic Bounding-Box Fitting & Auto-Centering
  const fitAndCenterGraph = (positions, graph) => {
    if (!svgRef.current) return;
    const pos = positions || nodePositions;
    const g = graph || graphData;
    if (!pos || !g || !g.nodes || g.nodes.length === 0) return;

    const nodeIds = Object.keys(pos);
    if (nodeIds.length === 0) return;

    const rect = svgRef.current.getBoundingClientRect();
    const canvasW = rect.width > 0 ? rect.width : window.innerWidth;
    const canvasH = rect.height > 0 ? rect.height : window.innerHeight;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    nodeIds.forEach((id) => {
      const p = pos[id];
      if (!p) return;
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    if (!isFinite(minX) || !isFinite(maxX)) return;

    // Account for arrows, self-loops, start indicator, and node radius in bounding box
    const hasInitial = Boolean(g.initial_state);
    const hasSelfLoops = (g.edges || []).some((e) => e.source === e.target);
    const hasReverse = (g.edges || []).some((e1) =>
      (g.edges || []).some((e2) => e2.source === e1.target && e2.target === e1.source)
    );

    const padLeft = hasInitial ? 100 : 70;
    const padRight = 70;
    const padTop = hasSelfLoops ? 95 : 70;
    const padBottom = hasReverse ? 85 : 70;

    const bMinX = minX - padLeft;
    const bMaxX = maxX + padRight;
    const bMinY = minY - padTop;
    const bMaxY = maxY + padBottom;

    const graphW = Math.max(bMaxX - bMinX, 120);
    const graphH = Math.max(bMaxY - bMinY, 120);

    // Available canvas space leaving generous margin away from top tape bar and bottom dock
    const availW = Math.max(canvasW - 140, 220);
    const availH = Math.max(canvasH - 170, 220);

    // Dynamic scale: larger default size for readability, clamped between 0.75 and 1.25
    const fitScale = Math.min(1.25, Math.max(0.75, Math.min(availW / graphW, availH / graphH)));

    // Center coordinates
    const graphCenterX = (bMinX + bMaxX) / 2;
    const graphCenterY = (bMinY + bMaxY) / 2;

    const targetPanX = Math.round(canvasW / 2 - graphCenterX * fitScale);
    const targetPanY = Math.round(canvasH / 2 - graphCenterY * fitScale);

    setScale(fitScale);
    setPan({ x: targetPanX, y: targetPanY });
  };

  // Auto-fit and center graph on initial load, machine type change, or graph update
  const lastLayoutKeyRef = useRef('');
  useEffect(() => {
    if (!graphData?.nodes || graphData.nodes.length === 0) return;
    const nodePosKeys = Object.keys(nodePositions || {});
    if (nodePosKeys.length === 0) return;

    const layoutKey = `${automatonType}-${graphData.nodes.map((n) => n.id).join('_')}-${(graphData.edges || []).length}`;
    if (lastLayoutKeyRef.current !== layoutKey) {
      lastLayoutKeyRef.current = layoutKey;
      const timer = setTimeout(() => {
        fitAndCenterGraph(nodePositions, graphData);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [graphData, nodePositions, automatonType]);

  // Export SVG Listener
  useEffect(() => {
    const handleExport = () => {
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

    document.addEventListener('export-svg', handleExport);
    return () => document.removeEventListener('export-svg', handleExport);
  }, [automatonType]);

  // Wheel Zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setScale((prev) => Math.min(Math.max(prev * zoomFactor, 0.4), 2.5));
  };

  // Synchronous Refs for dragging to eliminate React render lag and teardown
  const panRef = useRef(pan);
  panRef.current = pan;
  const scaleRef = useRef(scale);
  scaleRef.current = scale;
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Canvas Pan Handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('.node-element') || e.target.closest('.properties-card') || e.target.closest('button')) return;
    e.preventDefault();
    isPanningRef.current = true;
    panStartRef.current = { x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y };
    setIsPanning(true);
    if (setSelectedNodeId) setSelectedNodeId(null);
  };

  const handleNodeMouseDown = (e, nodeId) => {
    e.preventDefault();
    e.stopPropagation();
    draggedNodeRef.current = nodeId;
    setDraggedNode(nodeId);
    if (setSelectedNodeId) setSelectedNodeId(nodeId);

    // Calculate click offset relative to the node's current center
    if (svgRef.current && nodePositions[nodeId]) {
      const rect = svgRef.current.getBoundingClientRect();
      const clickGraphX = (e.clientX - rect.left - panRef.current.x) / scaleRef.current;
      const clickGraphY = (e.clientY - rect.top - panRef.current.y) / scaleRef.current;
      dragOffsetRef.current = {
        x: clickGraphX - nodePositions[nodeId].x,
        y: clickGraphY - nodePositions[nodeId].y,
      };
    }
  };

  // Persistent window drag listeners that never detach during active drag
  useEffect(() => {
    const onWindowMouseMove = (e) => {
      if (isPanningRef.current) {
        const newX = e.clientX - panStartRef.current.x;
        const newY = e.clientY - panStartRef.current.y;
        setPan({ x: newX, y: newY });
      } else if (draggedNodeRef.current && svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const rawX = (e.clientX - rect.left - panRef.current.x) / scaleRef.current;
        const rawY = (e.clientY - rect.top - panRef.current.y) / scaleRef.current;
        const targetX = Math.round(rawX - dragOffsetRef.current.x);
        const targetY = Math.round(rawY - dragOffsetRef.current.y);

        if (setNodePositions) {
          setNodePositions((prev) => ({
            ...prev,
            [draggedNodeRef.current]: { x: targetX, y: targetY },
          }));
        }
      }
    };

    const onWindowMouseUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        setIsPanning(false);
      }
      if (draggedNodeRef.current) {
        draggedNodeRef.current = null;
        setDraggedNode(null);
      }
    };

    window.addEventListener('mousemove', onWindowMouseMove, { passive: true });
    window.addEventListener('mouseup', onWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
    };
  }, [setNodePositions]);

  const resetView = () => {
    fitAndCenterGraph(nodePositions, graphData);
  };

  // State Editing Handlers
  const toggleInitial = (nodeId) => {
    if (!setGraphData || !graphData) return;
    setGraphData((prev) => ({
      ...prev,
      initial_state: prev.initial_state === nodeId ? null : nodeId,
    }));
  };

  const toggleAccepting = (nodeId) => {
    if (!setGraphData || !graphData) return;
    const currentAccept = new Set(graphData.accepting_states || []);
    if (currentAccept.has(nodeId)) {
      currentAccept.delete(nodeId);
    } else {
      currentAccept.add(nodeId);
    }
    setGraphData((prev) => ({
      ...prev,
      accepting_states: Array.from(currentAccept),
    }));
  };

  const saveNodeLabel = (nodeId) => {
    if (!setGraphData || !graphData || !editingLabel.trim()) return;
    setGraphData((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === nodeId ? { ...n, label: editingLabel.trim() } : n
      ),
    }));
  };

  const deleteNode = (nodeId) => {
    if (!setGraphData || !graphData) return;
    setGraphData((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => n.id !== nodeId),
      edges: prev.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      accepting_states: (prev.accepting_states || []).filter((id) => id !== nodeId),
      initial_state: prev.initial_state === nodeId ? null : prev.initial_state,
    }));
    if (setSelectedNodeId) setSelectedNodeId(null);
  };

  // Pre-calculate edge paths with accurate boundary connection
  const computedEdges = edges
    .map((edge) => {
      const sourcePos = nodePositions[edge.source];
      const targetPos = nodePositions[edge.target];
      if (!sourcePos || !targetPos) return null;

      const pathData = calculateEdgePath(
        edge,
        sourcePos,
        targetPos,
        edges,
        acceptStateIds,
        26
      );
      if (!pathData || !pathData.d) return null;

      const sId = getStateId(edge.source);
      const tId = getStateId(edge.target);
      const edgeKey = `${sId}->${tId}`;
      const eId = edge.id ? String(edge.id) : '';

      const stepFromStates = currentStep?.from_states?.length
        ? currentStep.from_states
        : currentStep?.from_state != null
        ? [currentStep.from_state]
        : [];
      const stepToStates = currentStep?.to_states?.length
        ? currentStep.to_states
        : currentStep?.to_state != null
        ? [currentStep.to_state]
        : [];

      const isStepMatch = Boolean(
        currentStep &&
        stepFromStates.length > 0 &&
        stepToStates.length > 0 &&
        stepFromStates.some((s) => getStateId(s) === sId) &&
        stepToStates.some((t) => getStateId(t) === tId) &&
        (currentStep.consumed_symbol == null || edgeMatchesSymbol(edge, currentStep.consumed_symbol))
      );

      const isActive =
        isStepMatch ||
        currentActiveEdgeSet.has(edgeKey) ||
        currentActiveEdgeSet.has(eId) ||
        currentActiveEdgeSet.has(`e_${sId}_${tId}`) ||
        (activeEdgeId && (edgeKey === activeEdgeId || eId === activeEdgeId));

      const labelText =
        edge.label ||
        edge.combined_label ||
        edge.data?.combined_label ||
        edge.symbol ||
        '';

      const badgeW = Math.max(28, labelText.length * 8.5 + 16);
      const badgeH = 22;

      return {
        edge,
        edgeKey,
        pathData,
        isActive,
        labelText,
        badgeW,
        badgeH,
      };
    })
    .filter(Boolean);

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-white select-none">
      {/* ── Top-Left: Canvas Tag & State Metrics ──────────────────────── */}
      <div className="absolute top-4 left-6 z-10 flex items-center gap-2.5">
        <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-white/90 text-zinc-800 border border-zinc-200/90 shadow-sm backdrop-blur-md flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse"></span>
          <span>{automatonType} Canvas</span>
        </span>
        {graphData && (
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white/90 text-zinc-500 border border-zinc-200/90 shadow-sm backdrop-blur-md">
            {nodes.length} states · {edges.length} transitions
          </span>
        )}
        {isConverged && (
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 shadow-sm">
            ✓ 100% Minimal L*
          </span>
        )}
      </div>

      {/* ── Top-Left (Sub-bar): Legend Overlay (Positioned to never collide with bottom toolbar) ─ */}
      {graphData && nodes.length > 0 && (
        <div className="absolute top-14 left-6 z-10 bg-white/95 border border-zinc-200/90 rounded-xl px-3 py-1.5 text-[11px] font-mono text-zinc-600 flex items-center gap-3.5 flex-wrap backdrop-blur-md shadow-xs pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border-2 border-zinc-600 bg-white"></span>
            <span>State (Q)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-pink-500 bg-pink-50"></span>
            <span className="text-pink-600 font-semibold">Accepting (F)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border-2 border-brand-600 bg-brand-100"></span>
            <span className="text-brand-600 font-bold">Active Head</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-900 font-bold">→</span>
            <span>q₀ Start</span>
          </div>
          <div className="flex items-center gap-1 text-zinc-400 text-[10px] hidden sm:flex">
            <Move className="w-3 h-3 text-zinc-400" />
            <span>Drag to move</span>
          </div>
        </div>
      )}

      {/* ── Top-Right: Floating Zoom / View Controls ───────────────────── */}
      <div className="absolute top-4 right-6 z-10 flex items-center gap-1.5 bg-white/90 border border-zinc-200/90 rounded-xl p-1 shadow-md backdrop-blur-md">
        <button
          onClick={() => setScale((s) => Math.min(2.5, s + 0.15))}
          className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-600 hover:text-zinc-900 transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setScale((s) => Math.max(0.4, s - 0.15))}
          className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-600 hover:text-zinc-900 transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-600 hover:text-zinc-900 transition"
          title="Reset View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono text-zinc-500 px-1.5 font-bold">
          {Math.round(scale * 100)}%
        </span>
      </div>

      {/* ── Contextual Properties Panel (Floating when a state is selected) ─ */}
      {selectedNode && (
        <div className="properties-card absolute top-16 right-6 z-20 w-64 bg-white/95 border border-zinc-200 rounded-2xl p-4 shadow-xl backdrop-blur-md animate-fade-in text-zinc-900">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-100">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">
              State Properties
            </span>
            <button
              onClick={() => setSelectedNodeId && setSelectedNodeId(null)}
              className="text-zinc-400 hover:text-zinc-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Label input */}
            <div>
              <label className="text-[11px] text-zinc-400 font-mono block mb-1">State Label</label>
              <input
                type="text"
                value={editingLabel}
                onChange={(e) => setEditingLabel(e.target.value)}
                onBlur={() => saveNodeLabel(selectedNode.id)}
                onKeyDown={(e) => e.key === 'Enter' && saveNodeLabel(selectedNode.id)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 font-mono text-xs text-zinc-900 focus:outline-none focus:border-brand-500 transition"
              />
            </div>

            {/* Toggle Start State */}
            <button
              onClick={() => toggleInitial(selectedNode.id)}
              className={`w-full py-2 px-3 rounded-xl border flex items-center justify-between transition font-mono ${
                selectedNode.id === startStateId
                  ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <Flag className="w-3.5 h-3.5" />
                Initial (Start) State
              </span>
              <span>{selectedNode.id === startStateId ? 'YES' : 'NO'}</span>
            </button>

            {/* Toggle Accepting State */}
            <button
              onClick={() => toggleAccepting(selectedNode.id)}
              className={`w-full py-2 px-3 rounded-xl border flex items-center justify-between transition font-mono ${
                acceptStateIds.has(selectedNode.id)
                  ? 'bg-teal-50 border-teal-300 text-teal-800 font-bold'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5" />
                Accepting (Final)
              </span>
              <span>{acceptStateIds.has(selectedNode.id) ? 'YES' : 'NO'}</span>
            </button>

            {/* Delete State */}
            <button
              onClick={() => deleteNode(selectedNode.id)}
              className="w-full py-2 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium flex items-center justify-center gap-2 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete State</span>
            </button>
          </div>
        </div>
      )}

      {/* ── SVG Canvas Area ─────────────────────────────────────── */}
      <div
        className="flex-1 w-full h-full canvas-grid cursor-grab active:cursor-grabbing relative overflow-hidden"
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      >
        {graphData && nodes.length > 0 ? (
          <svg ref={svgRef} className="w-full h-full block">
            <defs>
              {/* Default directional arrow marker */}
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="10"
                refY="5"
                markerWidth="8.5"
                markerHeight="8.5"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#64748b" />
              </marker>

              {/* Active directional arrow marker during simulation */}
              <marker
                id="arrow-active"
                viewBox="0 0 10 10"
                refX="10"
                refY="5"
                markerWidth="9.5"
                markerHeight="9.5"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#4f46e5" />
              </marker>

              {/* Glow Filter for active execution state */}
              <filter id="glow-active" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#6366f1" floodOpacity="0.75" />
              </filter>
            </defs>

            <g
              transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}
              className={`transition-opacity duration-200 ease-out origin-center ${
                isTransitioning ? 'opacity-20' : 'opacity-100'
              }`}
            >
              {/* LAYER 1: TRANSITION PATHS (Drawn first so lines are behind all labels & nodes) */}
              <g className="edges-paths-layer">
                {computedEdges.map(({ edgeKey, pathData, isActive }) => {
                  const strokeColor = isActive ? '#4f46e5' : '#64748b';
                  const strokeWidth = isActive ? 3 : 1.75;
                  const markerUrl = isActive ? 'url(#arrow-active)' : 'url(#arrow)';

                  return (
                    <path
                      key={`path-${edgeKey}`}
                      d={pathData.d}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      markerEnd={markerUrl}
                      className="transition-colors duration-200"
                    />
                  );
                })}
              </g>

              {/* LAYER 2: TRANSITION LABELS (Drawn above paths with solid white badge so lines NEVER cut through text) */}
              <g className="edges-labels-layer">
                {computedEdges.map(({ edgeKey, pathData, isActive, labelText, badgeW, badgeH }) => (
                  <g
                    key={`label-${edgeKey}`}
                    transform={`translate(${pathData.lx || 0}, ${pathData.ly || 0})`}
                    className="select-none pointer-events-none"
                  >
                    {/* Solid opaque badge background */}
                    <rect
                      x={-badgeW / 2}
                      y={-badgeH / 2}
                      width={badgeW}
                      height={badgeH}
                      rx="6"
                      fill="#ffffff"
                      stroke={isActive ? '#4f46e5' : '#cbd5e1'}
                      strokeWidth={isActive ? 1.5 : 1.2}
                      className="shadow-sm"
                    />
                    <text
                      x="0"
                      y="4"
                      fill={isActive ? '#4f46e5' : '#1e293b'}
                      fontFamily="JetBrains Mono, monospace"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {labelText}
                    </text>
                  </g>
                ))}
              </g>

              {/* LAYER 3: STATE NODES (Drawn on top) */}
              <g className="nodes-layer">
                {nodes.map((node) => {
                  const pos = nodePositions[node.id];
                  if (!pos) return null;

                  const nId = getStateId(node.id);
                  const nLabel = getStateId(node.label);

                  const isInitial =
                    nId === startStateId ||
                    nLabel === startStateId ||
                    Boolean(node.is_initial || node.data?.is_initial);

                  const isAccept =
                    acceptStateIds.has(nId) ||
                    (nLabel && acceptStateIds.has(nLabel)) ||
                    Boolean(node.is_accepting || node.data?.is_accepting);

                  const isActive =
                    currentActiveSet.has(nId) ||
                    (nLabel && currentActiveSet.has(nLabel)) ||
                    currentActiveSet.has(node.id);

                  const isSelected = node.id === selectedNodeId || nId === selectedNodeId;

                  const nodeFill = isActive
                    ? '#eef2ff'
                    : isAccept
                    ? '#fdf2f8'
                    : '#ffffff';
                  const nodeStroke = isActive
                    ? '#4f46e5'
                    : isSelected
                    ? '#0284c7'
                    : isAccept
                    ? '#db2777'
                    : '#334155';
                  const textFill = isActive ? '#4338ca' : '#0f172a';

                  return (
                    <g
                      key={node.id}
                      className="node-element cursor-grab active:cursor-grabbing select-none"
                      transform={`translate(${pos.x}, ${pos.y})`}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                    >
                      {/* Active Pulsing Ring */}
                      {isActive && (
                        <circle
                          r="38"
                          fill="none"
                          stroke="#818cf8"
                          strokeWidth="2.5"
                          className="animate-ping opacity-60"
                        />
                      )}

                      {/* Selected state highlight ring */}
                      {isSelected && (
                        <circle
                          r="35"
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2"
                          strokeDasharray="4 2"
                        />
                      )}

                      {/* Accepting Double Ring (Outer circle at r=32) */}
                      {isAccept && (
                        <circle
                          r="32"
                          fill="none"
                          stroke={isActive ? '#818cf8' : '#ec4899'}
                          strokeWidth="2"
                        />
                      )}

                      {/* Base Node Circle (r=26) */}
                      <circle
                        r="26"
                        fill={nodeFill}
                        stroke={nodeStroke}
                        strokeWidth={isActive || isSelected ? 2.5 : 2}
                        filter={isActive ? 'url(#glow-active)' : undefined}
                        className="transition-colors duration-150"
                      />

                      {/* Initial / Start State Arrow (left pointing arrow with START label) */}
                      {isInitial && (
                        <g transform="translate(-54, 0)">
                          <line x1="-16" y1="0" x2="16" y2="0" stroke="#0f172a" strokeWidth="2.5" />
                          <polygon points="14,-5 22,0 14,5" fill="#0f172a" />
                          <text
                            x="-6"
                            y="-8"
                            fill="#0f172a"
                            fontSize="9"
                            fontFamily="JetBrains Mono, monospace"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            START
                          </text>
                        </g>
                      )}

                      {/* State Label */}
                      <text
                        x="0"
                        y="4.5"
                        fill={textFill}
                        fontFamily="JetBrains Mono, monospace"
                        fontSize="13"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {node.label || node.id}
                      </text>
                    </g>
                  );
                })}
              </g>
            </g>
          </svg>
        ) : (
          /* Empty Canvas Prompt */
          <div className="h-full flex flex-col items-center justify-center text-zinc-400 select-none">
            <div className="w-16 h-16 rounded-2xl bg-zinc-50 border-2 border-dashed border-zinc-200 flex items-center justify-center text-2xl font-mono text-zinc-400 mb-3">
              ◎
            </div>
            <p className="text-sm font-semibold text-zinc-700">Canvas Ready</p>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm text-center">
              Load an example from the benchmark suite or click <strong>Dataset &amp; L*</strong> to synthesize a DFA.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
