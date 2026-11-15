/**
 * BFS Hierarchical Layout & Edge Routing Algorithms for Finite Automata
 */

/**
 * Computes layered BFS positions for automaton states.
 * Layer 0 = start state (left), Layer 1 = states 1 step away, etc.
 * States within the same layer are centered vertically.
 */
export function computeGraphLayout(graph, options = {}) {
  if (!graph || !graph.nodes || graph.nodes.length === 0) {
    return {};
  }

  const {
    layerWidth = 160,
    nodeHeight = 110,
    paddingX = 90,
    paddingY = 60,
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
  const totalH = Math.max(maxInLayer * nodeHeight + paddingY * 2, 420);

  const positions = {};
  Object.entries(byLayer).forEach(([layerStr, ids]) => {
    const layer = parseInt(layerStr, 10);
    const x = paddingX + layer * layerWidth;
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
 * Calculates curved path and label coordinate for an edge.
 */
export function calculateEdgePath(edge, srcPos, tgtPos, allEdges = [], canvasHeight = 500, radius = 24) {
  if (!srcPos || !tgtPos) return null;

  // Self-loop
  if (edge.source === edge.target) {
    const { x, y } = srcPos;
    const loopDir = y < canvasHeight / 2 ? -1 : 1;
    const loopOffset = loopDir * radius;
    const loopHeight = loopDir * 42;

    const d = `M ${x - 14} ${y + loopOffset} C ${x - 34} ${y + loopOffset + loopHeight}, ${x + 34} ${y + loopOffset + loopHeight}, ${x + 14} ${y + loopOffset}`;
    const lx = x;
    const ly = y + loopOffset + loopHeight * 1.15;

    return { d, lx, ly, isLoop: true };
  }

  // Distinct source & target
  const { x: sx, y: sy } = srcPos;
  const { x: tx, y: ty } = tgtPos;
  const dx = tx - sx;
  const dy = ty - sy;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;

  // Check if reverse edge exists
  const hasReverse = allEdges.some(
    (e) => e.source === edge.target && e.target === edge.source
  );

  // Invert curvature for opposing pairs
  let curvature = 24;
  if (hasReverse) {
    const flip = edge.source < edge.target ? 1 : -1;
    curvature = 46 * flip;
  }

  // Midpoint with normal offset
  const mx = (sx + tx) / 2 - (dy / dist) * curvature;
  const my = (sy + ty) / 2 + (dx / dist) * curvature;

  // Adjust arrow end to stop at state circle boundary (radius)
  const angle = Math.atan2(ty - my, tx - mx);
  const ex = tx - (radius + 2) * Math.cos(angle);
  const ey = ty - (radius + 2) * Math.sin(angle);

  const d = `M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`;
  const lx = mx;
  const ly = my - (curvature > 0 ? 4 : -4);

  return { d, lx, ly, isLoop: false, mx, my, ex, ey };
}
