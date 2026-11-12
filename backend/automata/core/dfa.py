from __future__ import annotations
from typing import Dict, Set, Tuple, List, Optional, Any
from collections import deque


class DFA:
    """
    Deterministic Finite Automaton (DFA) model.
    M = (Q, Sigma, delta, q0, F)
    """

    def __init__(
        self,
        states: Optional[Set[str]] = None,
        alphabet: Optional[Set[str]] = None,
        transitions: Optional[Dict[Tuple[str, str], str]] = None,
        start_state: Optional[str] = None,
        accept_states: Optional[Set[str]] = None,
        transition_confidence: Optional[Dict[Tuple[str, str], str]] = None,
    ):
        self.states: Set[str] = set(states) if states is not None else set()
        self.alphabet: Set[str] = set(alphabet) if alphabet is not None else set()
        self.transitions: Dict[Tuple[str, str], str] = dict(transitions) if transitions is not None else {}
        self.start_state: Optional[str] = start_state
        self.accept_states: Set[str] = set(accept_states) if accept_states is not None else set()
        self.transition_confidence: Dict[Tuple[str, str], str] = (
            dict(transition_confidence) if transition_confidence is not None else {}
        )

        if self.start_state is not None:
            self.states.add(self.start_state)
        self.states.update(self.accept_states)

    def add_state(self, state: str, is_start: bool = False, is_accept: bool = False) -> None:
        self.states.add(state)
        if is_start:
            self.start_state = state
        if is_accept:
            self.accept_states.add(state)

    def add_transition(self, from_state: str, symbol: str, to_state: str) -> None:
        self.states.add(from_state)
        self.states.add(to_state)
        self.alphabet.add(symbol)
        self.transitions[(from_state, symbol)] = to_state

    def step(self, state: str, symbol: str) -> Optional[str]:
        return self.transitions.get((state, symbol))

    def accepts(self, input_string: str) -> bool:
        if self.start_state is None:
            return False
        current = self.start_state
        for char in input_string:
            if char not in self.alphabet:
                return False
            next_state = self.step(current, char)
            if next_state is None:
                return False
            current = next_state
        return current in self.accept_states

    def simulate(self, input_string: str) -> Dict[str, Any]:
        """
        Executes a step-by-step trace of string evaluation.
        Produces a rich UI-ready execution sequence.
        """
        if self.start_state is None:
            return {
                "input_string": input_string,
                "accepted": False,
                "is_stuck": True,
                "execution_steps": [],
            }

        steps: List[Dict[str, Any]] = []
        current = self.start_state
        stuck = False

        # Step 0: Initial configuration
        steps.append({
            "step": 0,
            "consumed_symbol": None,
            "remaining_tape": input_string,
            "active_states": [current],
            "traversed_edge_ids": [],
            "status": "INITIAL",
        })

        for i, char in enumerate(input_string):
            next_state = self.step(current, char)
            if next_state is None:
                # Automaton has no transition defined; enters stuck/rejected state
                stuck = True
                edge_id = None
                remaining = input_string[i + 1:]
                steps.append({
                    "step": i + 1,
                    "consumed_symbol": char,
                    "remaining_tape": remaining,
                    "active_states": [],
                    "traversed_edge_ids": [],
                    "status": "STUCK",
                })
                break

            edge_id = f"e_{current}_{next_state}_{char}"
            remaining = input_string[i + 1:]
            current = next_state

            steps.append({
                "step": i + 1,
                "consumed_symbol": char,
                "remaining_tape": remaining,
                "active_states": [current],
                "traversed_edge_ids": [edge_id],
                "status": "TRANSITION",
            })

        is_accepted = (not stuck) and (current in self.accept_states)

        return {
            "input_string": input_string,
            "accepted": is_accepted,
            "is_stuck": stuck,
            "final_state": current if not stuck else None,
            "execution_steps": steps,
        }

    def clone(self) -> DFA:
        return DFA(
            states=set(self.states),
            alphabet=set(self.alphabet),
            transitions=dict(self.transitions),
            start_state=self.start_state,
            accept_states=set(self.accept_states),
            transition_confidence=dict(self.transition_confidence),
        )

    def get_reachable_states(self) -> Set[str]:
        if self.start_state is None:
            return set()
        reachable = set()
        queue = deque([self.start_state])
        while queue:
            curr = queue.popleft()
            if curr in reachable:
                continue
            reachable.add(curr)
            for a in self.alphabet:
                nxt = self.step(curr, a)
                if nxt is not None and nxt not in reachable:
                    queue.append(nxt)
        return reachable

    def make_complete(self, sink_state: str = "_dead_") -> DFA:
        """
        Returns a complete DFA where every state has a transition for every alphabet symbol.
        Adds a non-accepting sink state if any transitions are missing.
        """
        cloned = self.clone()
        needed_sink = False
        all_states = set(cloned.states)

        for s in all_states:
            for a in cloned.alphabet:
                if (s, a) not in cloned.transitions:
                    cloned.transitions[(s, a)] = sink_state
                    needed_sink = True

        if needed_sink:
            cloned.states.add(sink_state)
            for a in cloned.alphabet:
                cloned.transitions[(sink_state, a)] = sink_state

        return cloned

    def canonicalize(self, prefix: str = "q") -> DFA:
        """
        Renames reachable states in canonical BFS order (q0, q1, ...)
        ensuring isomorphic DFAs have identical representations.
        """
        if self.start_state is None:
            return self.clone()

        reachable = self.get_reachable_states()
        mapping: Dict[str, str] = {}
        queue = deque([self.start_state])
        visited = set()
        counter = 0

        while queue:
            curr = queue.popleft()
            if curr in visited:
                continue
            visited.add(curr)
            new_name = f"{prefix}{counter}"
            mapping[curr] = new_name
            counter += 1

            for sym in sorted(self.alphabet):
                nxt = self.step(curr, sym)
                if nxt is not None and nxt in reachable and nxt not in visited:
                    queue.append(nxt)

        new_states = {mapping[s] for s in reachable}
        new_start = mapping[self.start_state]
        new_accept = {mapping[s] for s in self.accept_states if s in reachable}
        new_transitions = {}
        new_confidence = {}

        for (u, sym), v in self.transitions.items():
            if u in mapping and v in mapping:
                mu, mv = mapping[u], mapping[v]
                new_transitions[(mu, sym)] = mv
                new_confidence[(mu, sym)] = self.transition_confidence.get((u, sym), "direct")

        return DFA(
            states=new_states,
            alphabet=set(self.alphabet),
            transitions=new_transitions,
            start_state=new_start,
            accept_states=new_accept,
            transition_confidence=new_confidence,
        )

    def to_graph_dict(self) -> Dict[str, Any]:
        """
        Serializes the DFA into an interactive node-link graph payload
        directly consumable by UI visualization libraries (React Flow / Cytoscape).
        """
        sorted_states = sorted(list(self.states))
        sorted_alphabet = sorted(list(self.alphabet))

        nodes = [
            {
                "id": s,
                "label": s,
                "is_initial": (s == self.start_state),
                "is_accepting": (s in self.accept_states),
            }
            for s in sorted_states
        ]

        edges = []
        # Group multiple symbols on the same (source, target) edge for cleaner UI display
        edge_groups: Dict[Tuple[str, str], List[str]] = {}
        for (u, sym), v in self.transitions.items():
            edge_groups.setdefault((u, v), []).append(sym)

        for (u, v), syms in sorted(edge_groups.items()):
            label = ",".join(sorted(syms))
            for sym in syms:
                conf = self.transition_confidence.get((u, sym), "direct")
                edges.append({
                    "id": f"e_{u}_{v}_{sym}",
                    "source": u,
                    "target": v,
                    "symbol": sym,
                    "combined_label": label,
                    "confidence": conf,
                    "is_completed": (conf == "completed"),
                })

        return {
            "automaton_type": "DFA",
            "alphabet": sorted_alphabet,
            "initial_state": self.start_state,
            "accepting_states": sorted(list(self.accept_states)),
            "nodes": nodes,
            "edges": edges,
            "metrics": {
                "num_states": len(self.states),
                "num_transitions": len(self.transitions),
                "is_deterministic": True,
            },
        }

    def __repr__(self) -> str:
        return f"DFA(states={len(self.states)}, alphabet={self.alphabet}, start={self.start_state}, accept={self.accept_states})"

