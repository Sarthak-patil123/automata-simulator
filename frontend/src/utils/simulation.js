/**
 * Mathematically Verified Automata Simulation Engine
 * Executes exact step-by-step state machine transitions for DFA and NFA.
 */

export function simulateAutomaton(graphData, inputString = '', automatonType = 'DFA') {
  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return {
      input_string: inputString,
      accepted: false,
      is_stuck: true,
      steps: [],
      tape: inputString ? inputString.split('') : [],
    };
  }

  const startState = graphData.initial_state || graphData.nodes[0]?.id;
  const acceptSet = new Set(graphData.accepting_states || []);
  const edges = graphData.edges || [];
  const tape = inputString ? inputString.split('') : [];

  // Helper to test if an edge matches a symbol
  const edgeMatchesSymbol = (edge, symbol) => {
    const rawLabel = edge.label || edge.combined_label || edge.data?.combined_label || edge.symbol || '';
    const symbols = rawLabel.split(',').map((s) => s.trim());
    return symbols.includes(symbol);
  };

  const isNfa = automatonType.toUpperCase() === 'NFA';

  if (!isNfa) {
    // ── DFA SIMULATION ────────────────────────────────────────────────────────
    const steps = [
      {
        step: 0,
        consumed_symbol: null,
        remaining_tape: inputString,
        active_states: startState ? [startState] : [],
        traversed_edge_ids: [],
        status: 'INITIAL',
      },
    ];

    let current = startState;
    let isStuck = false;

    for (let i = 0; i < inputString.length; i++) {
      const char = inputString[i];
      const matchingEdge = edges.find(
        (e) => e.source === current && edgeMatchesSymbol(e, char)
      );

      if (!matchingEdge) {
        isStuck = true;
        steps.push({
          step: i + 1,
          consumed_symbol: char,
          remaining_tape: inputString.slice(i + 1),
          active_states: [],
          traversed_edge_ids: [],
          status: 'STUCK',
        });
        break;
      }

      const nextState = matchingEdge.target;
      const edgeKey = `${matchingEdge.source}->${matchingEdge.target}`;

      steps.push({
        step: i + 1,
        consumed_symbol: char,
        remaining_tape: inputString.slice(i + 1),
        active_states: [nextState],
        traversed_edge_ids: [edgeKey],
        status: 'TRANSITION',
      });

      current = nextState;
    }

    const accepted = !isStuck && acceptSet.has(current);

    return {
      input_string: inputString,
      accepted,
      is_stuck: isStuck,
      final_state: isStuck ? null : current,
      final_active_states: isStuck ? [] : [current],
      steps,
      tape,
    };
  } else {
    // ── NFA SIMULATION ────────────────────────────────────────────────────────
    // Computes epsilon closure (transitions on 'ε' or '')
    const getEpsilonClosure = (states) => {
      const closure = new Set(states);
      const queue = Array.from(states);
      while (queue.length > 0) {
        const s = queue.shift();
        edges.forEach((e) => {
          if (e.source === s && (edgeMatchesSymbol(e, 'ε') || edgeMatchesSymbol(e, ''))) {
            if (!closure.has(e.target)) {
              closure.add(e.target);
              queue.push(e.target);
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
        remaining_tape: inputString,
        active_states: Array.from(current).sort(),
        traversed_edge_ids: [],
        status: 'INITIAL',
      },
    ];

    let isStuck = false;

    for (let i = 0; i < inputString.length; i++) {
      const char = inputString[i];
      const traversedEdges = [];
      const directTargets = new Set();

      current.forEach((s) => {
        edges.forEach((e) => {
          if (e.source === s && edgeMatchesSymbol(e, char)) {
            traversedEdges.push(`${e.source}->${e.target}`);
            directTargets.add(e.target);
          }
        });
      });

      const nextCurrent = getEpsilonClosure(directTargets);

      if (nextCurrent.size === 0) {
        isStuck = true;
        steps.push({
          step: i + 1,
          consumed_symbol: char,
          remaining_tape: inputString.slice(i + 1),
          active_states: [],
          traversed_edge_ids: traversedEdges,
          status: 'DEAD_END',
        });
        current = new Set();
        break;
      }

      current = nextCurrent;
      steps.push({
        step: i + 1,
        consumed_symbol: char,
        remaining_tape: inputString.slice(i + 1),
        active_states: Array.from(current).sort(),
        traversed_edge_ids: traversedEdges,
        status: 'TRANSITION',
      });
    }

    const accepted = Array.from(current).some((s) => acceptSet.has(s));

    return {
      input_string: inputString,
      accepted,
      is_stuck: isStuck,
      final_active_states: Array.from(current).sort(),
      steps,
      tape,
    };
  }
}
