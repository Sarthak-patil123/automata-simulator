/**
 * Non-Linear Layout & Edge Routing Algorithms for Finite Automata
 * Ensures no more than 2 nodes ever lie on the same straight line,
 * completely preventing overlapping edges and collinear arrow conflicts.
 */

/**
 * Computes non-linear positions for automaton states.
 * - N = 1: Single state centered.
 * - N = 2: Two states with comfortable horizontal separation.
 * - N = 3: Clean triangle layout (start at bottom-left, state 1 at top-center, state 2 at bottom-right).
 * - N >= 4: Regular convex polygon on ellipse (strict guarantee: no 3 points on an ellipse are ever collinear).
 */
export function computeGraphLayout(graph, options = {}) {
  if (!graph || !graph.nodes || graph.nodes.length === 0) {
    return {};
  }

  const {
    width = 1000,
    height = 540,
  } = options;

  const nodes = graph.nodes;
  const n = nodes.length;

  const startId =
    graph.initial_state ??
    graph.start_state ??
    nodes.find((nd) => nd.is_initial || nd.data?.is_initial)?.id ??
    nodes[0]?.id;

  // 1. Single State
  if (n === 1) {
    return {
      [nodes[0].id]: { x: Math.round(width / 2), y: Math.round(height / 2) },
    };
  }

  // 2. Two States: Side-by-side with generous separation (only 2 nodes total, so at most 2 in line)
  if (n === 2) {
    const nonStart = nodes.find((nd) => nd.id !== startId) || nodes[1];
    return {
      [startId]: { x: Math.round(width / 2 - 160), y: Math.round(height / 2) },
      [nonStart.id]: { x: Math.round(width / 2 + 160), y: Math.round(height / 2) },
    };
  }

  // Order nodes by BFS starting from initial state for natural visual flow
  const adj = {};
  nodes.forEach((nd) => {
    adj[nd.id] = [];
  });
  (graph.edges || []).forEach((e) => {
    if (adj[e.source] && !adj[e.source].includes(e.target)) {
      adj[e.source].push(e.target);
    }
  });

  const orderedIds = [];
  const visited = new Set();
  if (startId && adj[startId]) {
    orderedIds.push(startId);
    visited.add(startId);
    const queue = [startId];
    while (queue.length > 0) {
      const curr = queue.shift();
      for (const next of adj[curr] || []) {
        if (!visited.has(next) && adj[next] !== undefined) {
          visited.add(next);
          orderedIds.push(next);
          queue.push(next);
        }
      }
    }
  }

  // Append any unreachable states
  nodes.forEach((nd) => {
    if (!visited.has(nd.id)) {
      visited.add(nd.id);
      orderedIds.push(nd.id);
    }
  });

  // 3. Three States: Distinct Triangle Layout
  // Start state at bottom-left (260, 340), State 1 at top-center (500, 150), State 2 at bottom-right (740, 340).
  // Zero collinear 3-tuples: each transition has its own unobstructed corridor.
  if (n === 3) {
    return {
      [orderedIds[0]]: { x: 260, y: 340 },
      [orderedIds[1]]: { x: 500, y: 150 },
      [orderedIds[2]]: { x: 740, y: 340 },
    };
  }

  // 4. Four States: Diamond Layout
  // Start at left (240, 270), State 1 at top (500, 125), State 2 at right (760, 270), State 3 at bottom (500, 415).
  // No 3 nodes are in a line.
  if (n === 4) {
    return {
      [orderedIds[0]]: { x: 240, y: 270 },
      [orderedIds[1]]: { x: 500, y: 125 },
      [orderedIds[2]]: { x: 760, y: 270 },
      [orderedIds[3]]: { x: 500, y: 415 },
    };
  }

  // 5. Five or More States: Regular Convex Polygon on Ellipse
  // By mathematical definition, an ellipse intersects any straight line in at most 2 points.
  // Hence NO 3 nodes are ever collinear.
  const cx = Math.round(width / 2);
  const cy = Math.round(height / 2);

  const rx = Math.min(380, Math.max(250, 180 + n * 20));
  const ry = Math.min(180, Math.max(130, 95 + n * 12));

  const positions = {};
  const step = (2 * Math.PI) / n;

  orderedIds.forEach((id, idx) => {
    // Start node placed at angle pi (180 deg, far left) so START arrow enters cleanly from left
    const angle = Math.PI - idx * step;
    const x = Math.round(cx + rx * Math.cos(angle));
    const y = Math.round(cy - ry * Math.sin(angle));
    positions[id] = { x, y };
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
