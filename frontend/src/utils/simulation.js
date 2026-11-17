/**
 * Mathematically Verified Automata Simulation Engine
 * Executes exact step-by-step state machine transitions for DFA and NFA.
 * Strictly follows the edges present in the graph:
 * - DFA: Starts from starting node. Moves strictly according to matching available edge.
 *   If no path is available, the traversal ends immediately and rejects.
 * - NFA: Starts from starting node. For each symbol, moves to all targets reachable
 *   via available matching paths. If no path is available from any active node,
 *   the traversal ends immediately and rejects.
 */

/**
 * Normalizes a state ID to a clean string
 */
export function normalizeStateId(val) {
  if (val == null) return '';
  if (typeof val === 'object') {
    return String(val.id ?? val.label ?? val.name ?? '').trim();
  }
  return String(val).trim();
}

/**
 * Backward compatibility alias for normalizeStateId
 */
export const getStateId = normalizeStateId;

/**
 * Extracts specific symbols belonging to an edge.
 * Priority order:
 * 1. edge.symbol (authoritative for single-symbol transitions)
 * 2. edge.symbols / edge.data.symbols (authoritative array)
 * 3. edge.label (parsed by delimiters)
 * 4. edge.combined_label / edge.data.combined_label (fallback ONLY when no specific symbol/label is present)
 */
export function getEdgeSymbols(edge) {
  if (!edge) return [];

  // 1. Explicit specific symbol property is authoritative for this edge
  if (edge.symbol != null && String(edge.symbol).trim() !== '') {
    return [String(edge.symbol).trim()];
  }

  // 2. Explicit symbols array
  if (Array.isArray(edge.symbols) && edge.symbols.length > 0) {
    return edge.symbols.map((s) => String(s).trim()).filter(Boolean);
  }
  if (Array.isArray(edge.data?.symbols) && edge.data.symbols.length > 0) {
    return edge.data.symbols.map((s) => String(s).trim()).filter(Boolean);
  }

  // 3. Explicit label property
  if (edge.label != null && String(edge.label).trim() !== '') {
    return String(edge.label)
      .split(/[,/|;\s]+/)
      .map((t) => t.replace(/['"{}()]/g, '').trim())
      .filter(Boolean);
  }

  // 4. Combined label fallback ONLY when neither symbol nor label is defined
  if (edge.combined_label != null && String(edge.combined_label).trim() !== '') {
    return String(edge.combined_label)
      .split(/[,/|;\s]+/)
      .map((t) => t.replace(/['"{}()]/g, '').trim())
      .filter(Boolean);
  }
  if (edge.data?.combined_label != null && String(edge.data.combined_label).trim() !== '') {
    return String(edge.data.combined_label)
      .split(/[,/|;\s]+/)
      .map((t) => t.replace(/['"{}()]/g, '').trim())
      .filter(Boolean);
  }

  return [];
}

/**
 * Tests if an edge matches a given input symbol
 */
export function edgeMatchesSymbol(edge, symbol) {
  if (!edge) return false;
  const symStr = symbol == null ? '' : String(symbol).trim();

  const isExplicitEpsilon =
    symStr === 'ε' || symStr === 'eps' || symStr === 'epsilon' || symStr === 'λ';

  if (isExplicitEpsilon && (edge.is_epsilon || edge.epsilon)) {
    return true;
  }

  const syms = getEdgeSymbols(edge);

  if (syms.includes(symStr)) {
    return true;
  }

  if (
    isExplicitEpsilon &&
    syms.some((s) => s === 'ε' || s === 'eps' || s === 'epsilon' || s === 'λ')
  ) {
    return true;
  }

  return false;
}

/**
 * Simulates automaton execution on an input string.
 * Strictly adheres to graph edges:
 * - Moves if path exists.
 * - Ends and rejects if no path exists.
 */
export function simulateAutomaton(graphData, inputString = '', automatonType = 'DFA') {
  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return {
      input_string: inputString,
      accepted: false,
      is_stuck: true,
      steps: [],
      tape: inputString ? String(inputString).split('') : [],
    };
  }

  // 1. Build Canonical State Mapping (maps node.id, node.label, and data attributes to consistent canon ID)
  const canonicalStateMap = new Map();
  (graphData.nodes || []).forEach((n, idx) => {
    if (!n) return;
    const nId = normalizeStateId(n.id ?? n);
    const nLabel = normalizeStateId(n.label ?? n.data?.label);
    const nDataId = normalizeStateId(n.data?.id);
    const canon = nId || nLabel || `q${idx}`;
    if (nId) canonicalStateMap.set(nId, canon);
    if (nLabel) canonicalStateMap.set(nLabel, canon);
    if (nDataId) canonicalStateMap.set(nDataId, canon);
  });
  const toCanon = (s) => {
    const str = normalizeStateId(s);
    return canonicalStateMap.get(str) || str;
  };

  // 2. Resolve Start State
  const resolveStartState = () => {
    if (graphData.initial_state != null && String(graphData.initial_state).trim() !== '') {
      return toCanon(graphData.initial_state);
    }
    if (graphData.start_state != null && String(graphData.start_state).trim() !== '') {
      return toCanon(graphData.start_state);
    }
    const initialNode = (graphData.nodes || []).find(
      (n) => n && (n.is_initial || n.data?.is_initial)
    );
    if (initialNode) return toCanon(initialNode.id ?? initialNode.label);
    return toCanon(graphData.nodes?.[0]?.id ?? graphData.nodes?.[0]);
  };

  const startState = resolveStartState();

  // 3. Resolve Accepting States
  const acceptSet = new Set();
  const rawAccepting =
    graphData.accepting_states ||
    graphData.accept_states ||
    [];

  if (Array.isArray(rawAccepting)) {
    rawAccepting.forEach((s) => {
      const id = toCanon(s);
      if (id) acceptSet.add(id);
    });
  } else if (rawAccepting instanceof Set) {
    rawAccepting.forEach((s) => {
      const id = toCanon(s);
      if (id) acceptSet.add(id);
    });
  }

  (graphData.nodes || []).forEach((n) => {
    if (n && (n.is_accepting || n.data?.is_accepting)) {
      const id = toCanon(n.id ?? n.label);
      if (id) acceptSet.add(id);
    }
  });

  const edges = graphData.edges || [];
  const rawInput = inputString != null ? String(inputString).trim() : '';
  // Treat ε or λ as empty input string
  const cleanInput = (rawInput === 'ε' || rawInput === 'λ' || rawInput === 'eps' || rawInput === 'epsilon') ? '' : rawInput;
  const tape = cleanInput ? cleanInput.split('') : [];
  const isNfa = String(automatonType).toUpperCase() === 'NFA';

  if (!isNfa) {
    // ══════════════════════════════════════════════════════════════════════════
    // DFA SIMULATION: Start at startState, move strictly if an edge exists
    // ══════════════════════════════════════════════════════════════════════════
    const steps = [
      {
        step: 0,
        consumed_symbol: null,
        remaining_tape: cleanInput,
        from_state: null,
        to_state: startState || null,
        from_states: [],
        to_states: startState ? [startState] : [],
        active_states: startState ? [startState] : [],
        traversed_edge_ids: [],
        traversed_edge: null,
        status: 'INITIAL',
      },
    ];

    let current = startState;
    let isStuck = false;

    for (let i = 0; i < cleanInput.length; i++) {
      const char = cleanInput[i];

      // Find an available edge from the current node matching this symbol
      const matchingEdge = edges.find((e) => {
        const sId = toCanon(e.source);
        return sId === current && edgeMatchesSymbol(e, char);
      });

      // IF NO PATH AVAILABLE: END IMMEDIATELY AND REJECT (NEVER JUMP!)
      if (!matchingEdge) {
        isStuck = true;
        steps.push({
          step: i + 1,
          consumed_symbol: char,
          remaining_tape: cleanInput.slice(i + 1),
          from_state: current,
          to_state: null,
          from_states: current ? [current] : [],
          to_states: [],
          active_states: [],
          traversed_edge_ids: [],
          traversed_edge: null,
          status: 'STUCK',
        });
        break;
      }

      // Path is available: move along the edge to target node
      const nextState = toCanon(matchingEdge.target);
      const edgeKey = `${current}->${nextState}`;
      const edgeId = matchingEdge.id || `e_${current}_${nextState}`;

      const traversedEdgeIds = [
        edgeKey,
        edgeId,
        `e_${current}_${nextState}`,
        `e_${current}_${nextState}_${char}`,
      ];

      steps.push({
        step: i + 1,
        consumed_symbol: char,
        remaining_tape: cleanInput.slice(i + 1),
        from_state: current,
        to_state: nextState,
        from_states: current ? [current] : [],
        to_states: nextState ? [nextState] : [],
        active_states: [nextState],
        traversed_edge_ids: traversedEdgeIds,
        traversed_edge: matchingEdge,
        status: 'TRANSITION',
      });

      current = nextState;
    }

    const accepted = !isStuck && acceptSet.has(current);

    return {
      input_string: cleanInput,
      accepted,
      is_stuck: isStuck,
      final_state: isStuck ? null : current,
      final_active_states: isStuck ? [] : [current],
      steps,
      tape,
    };
  } else {
    // ══════════════════════════════════════════════════════════════════════════
    // NFA SIMULATION: Start at startState, move to all reachable targets
    // ══════════════════════════════════════════════════════════════════════════
    const hasEpsilonEdges = edges.some(
      (e) => e.is_epsilon || e.epsilon || getEdgeSymbols(e).some((s) => s === 'ε' || s === 'λ')
    );

    const getEpsilonClosure = (stateSet) => {
      if (!hasEpsilonEdges) return stateSet;
      const closure = new Set(stateSet);
      const queue = Array.from(stateSet);
      while (queue.length > 0) {
        const s = queue.shift();
        edges.forEach((e) => {
          const sId = toCanon(e.source);
          if (sId === s && edgeMatchesSymbol(e, 'ε')) {
            const tId = toCanon(e.target);
            if (tId && !closure.has(tId)) {
              closure.add(tId);
              queue.push(tId);
            }
          }
        });
      }
      return closure;
    };

    let currentStates = getEpsilonClosure(new Set(startState ? [startState] : []));

    const steps = [
      {
        step: 0,
        consumed_symbol: null,
        remaining_tape: cleanInput,
        from_state: null,
        to_state: startState || null,
        from_states: [],
        to_states: Array.from(currentStates).sort(),
        active_states: Array.from(currentStates).sort(),
        traversed_edge_ids: [],
        status: 'INITIAL',
      },
    ];

    let isStuck = false;

    for (let i = 0; i < cleanInput.length; i++) {
      const char = cleanInput[i];
      const traversedEdgeIds = [];
      const nextTargets = new Set();
      const prevActiveList = Array.from(currentStates).sort();

      currentStates.forEach((s) => {
        edges.forEach((e) => {
          const sId = toCanon(e.source);
          if (sId === s && edgeMatchesSymbol(e, char)) {
            const tId = toCanon(e.target);
            if (tId) {
              nextTargets.add(tId);
              traversedEdgeIds.push(`${sId}->${tId}`);
              if (e.id) traversedEdgeIds.push(e.id);
              traversedEdgeIds.push(`e_${sId}_${tId}`);
              traversedEdgeIds.push(`e_${sId}_${tId}_${char}`);
            }
          }
        });
      });

      const nextClosure = getEpsilonClosure(nextTargets);

      // IF NO PATH AVAILABLE: END IMMEDIATELY AND REJECT (NEVER JUMP!)
      if (nextClosure.size === 0) {
        isStuck = true;
        steps.push({
          step: i + 1,
          consumed_symbol: char,
          remaining_tape: cleanInput.slice(i + 1),
          from_state: prevActiveList[0] || null,
          to_state: null,
          from_states: prevActiveList,
          to_states: [],
          active_states: [],
          traversed_edge_ids: [],
          status: 'DEAD_END',
        });
        currentStates = new Set();
        break;
      }

      currentStates = nextClosure;
      const newActiveList = Array.from(currentStates).sort();

      steps.push({
        step: i + 1,
        consumed_symbol: char,
        remaining_tape: cleanInput.slice(i + 1),
        from_state: prevActiveList[0] || null,
        to_state: newActiveList[0] || null,
        from_states: prevActiveList,
        to_states: newActiveList,
        active_states: newActiveList,
        traversed_edge_ids: traversedEdgeIds,
        status: 'TRANSITION',
      });
    }

    const accepted = !isStuck && Array.from(currentStates).some((s) => acceptSet.has(s));

    return {
      input_string: cleanInput,
      accepted,
      is_stuck: isStuck,
      final_active_states: Array.from(currentStates).sort(),
      steps,
      tape,
    };
  }
}
