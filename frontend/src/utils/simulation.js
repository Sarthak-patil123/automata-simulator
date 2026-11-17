/**
 * Mathematically Verified Automata Simulation Engine
 * Executes exact step-by-step state machine transitions for DFA and NFA.
 * Supports individual symbol edges, multi-symbol edge labels, canonical state aliases,
 * formal transition maps, and epsilon closures.
 */

/**
 * Extracts a normalized string ID from a node or state representation
 */
export function getStateId(val) {
  if (val == null) return '';
  if (typeof val === 'object') {
    return String(val.id ?? val.name ?? val.label ?? '').trim();
  }
  return String(val).trim();
}

/**
 * Extracts all specific symbols that an edge transitions on.
 * Priority order:
 * 1. edge.symbol (authoritative for single-symbol transitions)
 * 2. edge.symbols / edge.data.symbols (authoritative array)
 * 3. edge.label (parsed by delimiters)
 * 4. edge.combined_label / edge.data.combined_label (fallback ONLY when no specific symbol/label is present)
 */
export function getEdgeSymbols(edge) {
  if (!edge) return [];

  // 1. Explicit specific symbol property is authoritative for this edge!
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

  // Epsilon check
  const isEpsSymbol =
    symStr === 'ε' ||
    symStr === 'eps' ||
    symStr === 'epsilon' ||
    symStr === '' ||
    symStr === 'λ';

  if (isEpsSymbol && (edge.is_epsilon || edge.epsilon)) {
    return true;
  }

  const syms = getEdgeSymbols(edge);

  if (syms.includes(symStr)) {
    return true;
  }

  if (
    isEpsSymbol &&
    syms.some((s) => s === 'ε' || s === 'eps' || s === 'epsilon' || s === 'λ' || s === '')
  ) {
    return true;
  }

  return false;
}

/**
 * Simulates automaton execution on an input string.
 * Traces states and transitions purely in the frontend.
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

  // 1. Build Canonical State Mapping (maps both node.id and node.label to canonical state ID)
  const canonicalStateMap = new Map();
  (graphData.nodes || []).forEach((n, idx) => {
    if (!n) return;
    const nId = getStateId(n.id ?? n);
    const nLabel = getStateId(n.label ?? n.data?.label);
    const canon = nId || nLabel || `q${idx}`;
    if (nId) canonicalStateMap.set(nId, canon);
    if (nLabel) canonicalStateMap.set(nLabel, canon);
    if (n.data?.id) canonicalStateMap.set(getStateId(n.data.id), canon);
  });
  const toCanon = (s) => {
    const str = getStateId(s);
    return canonicalStateMap.get(str) || str;
  };

  // 2. Resolve Canonical Start State
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
    if (initialNode) return toCanon(initialNode.id || initialNode.label);
    return toCanon(graphData.nodes?.[0]?.id || graphData.nodes?.[0]);
  };

  const startState = resolveStartState();

  // 3. Resolve Canonical Accepting States
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
      const id = toCanon(n.id || n.label);
      if (id) acceptSet.add(id);
    }
  });

  const edges = graphData.edges || [];
  const alphabet = graphData.alphabet || ['0', '1'];
  const hasSpaceInAlphabet = alphabet.includes(' ');
  const cleanInput = inputString != null
    ? (hasSpaceInAlphabet ? String(inputString) : String(inputString).trim())
    : '';
  const tape = cleanInput ? cleanInput.split('') : [];
  const isNfa = String(automatonType).toUpperCase() === 'NFA';

  if (!isNfa) {
    // ── DFA SIMULATION ────────────────────────────────────────────────────────
    const steps = [
      {
        step: 0,
        consumed_symbol: null,
        remaining_tape: cleanInput,
        from_state: null,
        to_state: startState,
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

      // Find matching edge from current canonical state
      let matchingEdge = edges.find((e) => {
        const sId = toCanon(e.source);
        return sId === current && edgeMatchesSymbol(e, char);
      });

      // Secondary lookup: check graphData.transitions dictionary if available
      let nextState = null;
      if (matchingEdge) {
        nextState = toCanon(matchingEdge.target);
      } else if (graphData.transitions) {
        const key1 = `${current},${char}`;
        const key2 = `${current}, ${char}`;
        const tgt =
          graphData.transitions[key1] ||
          graphData.transitions[key2] ||
          graphData.transitions[current]?.[char];
        if (tgt != null) nextState = toCanon(tgt);
      } else if (graphData.formal_definition?.transitions) {
        const key1 = `${current},${char}`;
        const key2 = `${current}, ${char}`;
        const tgt =
          graphData.formal_definition.transitions[key1] ||
          graphData.formal_definition.transitions[key2];
        if (tgt != null) nextState = toCanon(tgt);
      }

      if (!nextState) {
        isStuck = true;
        steps.push({
          step: i + 1,
          consumed_symbol: char,
          remaining_tape: cleanInput.slice(i + 1),
          from_state: current,
          to_state: null,
          active_states: [],
          traversed_edge_ids: [],
          traversed_edge: null,
          status: 'STUCK',
        });
        break;
      }

      const edgeKey = `${current}->${nextState}`;
      const edgeId = matchingEdge?.id || `e_${current}_${nextState}`;

      const traversedEdgeIds = [
        edgeKey,
        edgeId,
        `e_${current}_${nextState}`,
        `e_${current}_${nextState}_${char}`,
        `${current}->${nextState}`,
      ];

      steps.push({
        step: i + 1,
        consumed_symbol: char,
        remaining_tape: cleanInput.slice(i + 1),
        from_state: current,
        to_state: nextState,
        active_states: [nextState],
        traversed_edge_ids: traversedEdgeIds,
        traversed_edge: matchingEdge || { source: current, target: nextState, symbol: char },
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
    // ── NFA SIMULATION ────────────────────────────────────────────────────────
    const getEpsilonClosure = (states) => {
      const closure = new Set(states);
      const queue = Array.from(states);
      while (queue.length > 0) {
        const s = queue.shift();
        edges.forEach((e) => {
          const sId = toCanon(e.source);
          if (sId === s && (edgeMatchesSymbol(e, 'ε') || edgeMatchesSymbol(e, ''))) {
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

    let current = getEpsilonClosure(new Set(startState ? [startState] : []));

    const steps = [
      {
        step: 0,
        consumed_symbol: null,
        remaining_tape: cleanInput,
        from_state: null,
        to_state: null,
        active_states: Array.from(current).sort(),
        traversed_edge_ids: [],
        traversed_edge: null,
        status: 'INITIAL',
      },
    ];

    let isStuck = false;

    for (let i = 0; i < cleanInput.length; i++) {
      const char = cleanInput[i];
      const traversedEdges = [];
      const directTargets = new Set();

      current.forEach((s) => {
        edges.forEach((e) => {
          const sId = toCanon(e.source);
          if (sId === s && edgeMatchesSymbol(e, char)) {
            const tId = toCanon(e.target);
            const edgeKey = `${sId}->${tId}`;
            traversedEdges.push(edgeKey);
            if (e.id) traversedEdges.push(e.id);
            traversedEdges.push(`e_${sId}_${tId}`);
            traversedEdges.push(`e_${sId}_${tId}_${char}`);
            if (tId) directTargets.add(tId);
          }
        });
      });

      const nextCurrent = getEpsilonClosure(directTargets);

      if (nextCurrent.size === 0) {
        isStuck = true;
        steps.push({
          step: i + 1,
          consumed_symbol: char,
          remaining_tape: cleanInput.slice(i + 1),
          from_state: Array.from(current),
          to_state: [],
          active_states: [],
          traversed_edge_ids: traversedEdges,
          traversed_edge: null,
          status: 'DEAD_END',
        });
        current = new Set();
        break;
      }

      current = nextCurrent;
      steps.push({
        step: i + 1,
        consumed_symbol: char,
        remaining_tape: cleanInput.slice(i + 1),
        from_state: Array.from(current),
        to_state: Array.from(nextCurrent).sort(),
        active_states: Array.from(current).sort(),
        traversed_edge_ids: traversedEdges,
        traversed_edge: null,
        status: 'TRANSITION',
      });
    }

    const accepted = Array.from(current).some((s) => acceptSet.has(s));

    return {
      input_string: cleanInput,
      accepted,
      is_stuck: isStuck,
      final_active_states: Array.from(current).sort(),
      steps,
      tape,
    };
  }
}
