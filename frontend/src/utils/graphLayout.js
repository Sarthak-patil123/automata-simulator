/**
 * BFS Hierarchical Layout & Edge Routing Algorithms for Finite Automata
 */

/**
 * Computes layered BFS positions for automaton states.
 * Layer 0 = start state (left), Layer 1 = states 1 step away, etc.
 * States within the same layer are centered vertically.
 * Spacing dynamically adapts to node count for spacious, readable layouts.
 */
export function computeGraphLayout(graph, options = {}) {
  if (!graph || !graph.nodes || graph.nodes.length === 0) {
    return {};
  }

  const nodeCount = graph.nodes.length;
  // Dynamic spacious layer width and node height based on node count
  const defaultLayerWidth = nodeCount <= 3 ? 270 : nodeCount <= 6 ? 240 : 210;
  const defaultNodeHeight = nodeCount <= 4 ? 180 : 160;

  const {
    layerWidth = defaultLayerWidth,
    nodeHeight = defaultNodeHeight,
    paddingX = 100,
    paddingY = 80,
  } = options;

  const startId = graph.initial_state || graph.nodes[0]?.id;
  const adj = {};
  graph.nodes.forEach((n) => {
    adj[n.id] = new Set();
  });
  (graph.edges || []).forEach((e) => {
    if (adj[e.source]) adj[e.source].add(e.target);
  });

  const layers = {};
  const queue = [startId];
  layers[startId] = 0;
  const visited = new Set([startId]);

  while (queue.length > 0) {
    const curr = queue.shift();
    const currLayer = layers[curr];
    for (const next of adj[curr] || []) {
      if (!visited.has(next)) {
        visited.add(next);
        layers[next] = currLayer + 1;
        queue.push(next);
      }
    }
  }

  // Assign any disconnected states to the last layer or layer 1
  let maxAssignedLayer = Math.max(...Object.values(layers), 0);
  graph.nodes.forEach((n) => {
    if (layers[n.id] === undefined) {
      maxAssignedLayer++;
      layers[n.id] = maxAssignedLayer;
    }
  });

  // Group nodes by layer
  const byLayer = {};
  graph.nodes.forEach((n) => {
    const l = layers[n.id];
    if (!byLayer[l]) byLayer[l] = [];
    byLayer[l].push(n.id);
  });

  const maxInLayer = Math.max(...Object.values(byLayer).map((arr) => arr.length), 1);
  const totalH = Math.max(maxInLayer * nodeHeight + paddingY * 2, 440);
  const numLayers = Math.max(maxAssignedLayer, 1);
  const totalW = numLayers * layerWidth;
  // Center horizontal layout within a standard 1000px canvas area
  const baseStartX = Math.max(120, Math.round((1000 - totalW) / 2));

  const positions = {};
  Object.entries(byLayer).forEach(([layerStr, ids]) => {
    const layer = parseInt(layerStr, 10);
    const x = baseStartX + layer * layerWidth;
    const blockH = ids.length * nodeHeight;
    const startY = (totalH - blockH) / 2 + nodeHeight / 2;

    ids.forEach((id, idx) => {
      positions[id] = {
        x,
        y: startY + idx * nodeHeight,
      };
    });
  });

  return positions;
}

/**
 * Calculates mathematically accurate curved path and label coordinate for an edge.
 * Endpoints land precisely at circle boundaries so arrowheads connect cleanly.
 */
export function calculateEdgePath(
  edge,
  srcPos,
  tgtPos,
  allEdges = [],
  acceptStateIds = new Set(),
  baseRadius = 26
) {
  if (!srcPos || !tgtPos) return null;

  const isTgtAccept = acceptStateIds.has(edge.target);
  const isSrcAccept = acceptStateIds.has(edge.source);
  // Boundary radii where paths terminate
  const tgtRadius = isTgtAccept ? 32 : baseRadius;
  const srcRadius = isSrcAccept ? 32 : baseRadius;

  // 1. Self Loop (edge.source === edge.target)
  if (edge.source === edge.target) {
    const { x, y } = srcPos;
    // Arch above by default (dir = -1), unless close to top boundary
    const dir = y < 110 ? 1 : -1;
    const r = srcRadius;

    // Angles on the circle boundary
    // When dir = -1 (arch above):
    // start at -135deg (top-left of node)
    // end at -45deg (top-right of node)
    const startAngle = dir === -1 ? (-135 * Math.PI) / 180 : (135 * Math.PI) / 180;
    const endAngle = dir === -1 ? (-45 * Math.PI) / 180 : (45 * Math.PI) / 180;

    const startX = x + r * Math.cos(startAngle);
    const startY = y + r * Math.sin(startAngle);
    const ex = x + r * Math.cos(endAngle);
    const ey = y + r * Math.sin(endAngle);

    // Control points radiating outward
    const loopHeight = 52;
    const c1x = startX + loopHeight * Math.cos(startAngle);
    const c1y = startY + loopHeight * Math.sin(startAngle);
    // For c2, position it so incoming tangent into (ex, ey) points towards (x, y)
    const c2x = ex + loopHeight * Math.cos(endAngle);
    const c2y = ey + loopHeight * Math.sin(endAngle);

    const d = `M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${ex.toFixed(1)} ${ey.toFixed(1)}`;

    const lx = x;
    const ly = y + dir * (r + loopHeight * 0.85);

    return { d, lx, ly, isLoop: true, ex, ey };
  }

  // 2. Distinct source & target
  const { x: sx, y: sy } = srcPos;
  const { x: tx, y: ty } = tgtPos;
  const dx = tx - sx;
  const dy = ty - sy;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;

  // Unit vector from source to target
  const ux = dx / dist;
  const uy = dy / dist;

  // Unit normal vector perpendicular to line (points 90 deg clockwise)
  const nx = -uy;
  const ny = ux;

  // Check if opposite edge exists (B -> A)
  const hasReverse = allEdges.some(
    (e) => e.source === edge.target && e.target === edge.source
  );

  // Group all edges between this same ordered pair (A -> B)
  const samePairEdges = allEdges.filter(
    (e) => e.source === edge.source && e.target === edge.target
  );
  const pairIndex = samePairEdges.findIndex(
    (e) => (e.id && e.id === edge.id) || (e.label === edge.label)
  );
  const pairOffset =
    samePairEdges.length > 1 && pairIndex >= 0
      ? (pairIndex - (samePairEdges.length - 1) / 2) * 26
      : 0;

  // Curvature: if reverse edge exists, curve outward by 48px along normal
  // Because (dx, dy) flips for the reverse edge, nx and ny flip sign,
  // meaning opposing edges naturally curve away from each other with ~96px separation!
  let curvature = 0;
  if (hasReverse) {
    curvature = 48 + pairOffset;
  } else if (samePairEdges.length > 1) {
    curvature = pairOffset;
  }

  if (Math.abs(curvature) < 1) {
    // Straight line:
    // Start cleanly at source circumference
    const startX = sx + srcRadius * ux;
    const startY = sy + srcRadius * uy;
    // End cleanly at target circumference
    const ex = tx - tgtRadius * ux;
    const ey = ty - tgtRadius * uy;

    const d = `M ${startX.toFixed(1)} ${startY.toFixed(1)} L ${ex.toFixed(1)} ${ey.toFixed(1)}`;
    const lx = (startX + ex) / 2;
    const ly = (startY + ey) / 2 - 14;

    return { d, lx, ly, isLoop: false, ex, ey };
  }

  // Curved quadratic bezier:
  // Midpoint with normal offset
  const mx = (sx + tx) / 2 + curvature * nx;
  const my = (sy + ty) / 2 + curvature * ny;

  // Tangent at start: direction from (sx, sy) towards (mx, my)
  const startAngle = Math.atan2(my - sy, mx - sx);
  const startX = sx + srcRadius * Math.cos(startAngle);
  const startY = sy + srcRadius * Math.sin(startAngle);

  // Tangent at end: direction from (mx, my) towards (tx, ty)
  const endAngle = Math.atan2(ty - my, tx - mx);
  const ex = tx - tgtRadius * Math.cos(endAngle);
  const ey = ty - tgtRadius * Math.sin(endAngle);

  const d = `M ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;

  // Label coordinate at midpoint of quadratic bezier (t = 0.5):
  // B(0.5) = 0.25*start + 0.5*m + 0.25*end
  const lx = 0.25 * startX + 0.5 * mx + 0.25 * ex;
  const ly = 0.25 * startY + 0.5 * my + 0.25 * ey;

  return { d, lx, ly, isLoop: false, ex, ey, mx, my };
}
