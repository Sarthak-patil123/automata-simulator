from __future__ import annotations
from typing import Dict, Set, Tuple, List, Optional, Any
from collections import deque
from .dfa import DFA

EPSILON_SYMBOLS = {"", "ε", "eps", "epsilon"}


class NFA:
    """
    Nondeterministic Finite Automaton (NFA) model with epsilon transitions.
    M = (Q, Sigma, delta, q0, F)
    """

    def __init__(
        self,
        states: Optional[Set[str]] = None,
        alphabet: Optional[Set[str]] = None,
        transitions: Optional[Dict[Tuple[str, str], Set[str]]] = None,
        start_state: Optional[str] = None,
        accept_states: Optional[Set[str]] = None,
        transition_confidence: Optional[Dict[Tuple[str, str], str]] = None,
    ):
        self.states: Set[str] = set(states) if states is not None else set()
        self.alphabet: Set[str] = {
            s for s in (alphabet or set()) if s not in EPSILON_SYMBOLS
        }
        self.transitions: Dict[Tuple[str, str], Set[str]] = {}
        if transitions:
            for (u, sym), targets in transitions.items():
                norm_sym = "ε" if sym in EPSILON_SYMBOLS else sym
                if norm_sym != "ε":
                    self.alphabet.add(norm_sym)
                self.transitions.setdefault((u, norm_sym), set()).update(targets)
                self.states.add(u)
                self.states.update(targets)

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
        norm_sym = "ε" if symbol in EPSILON_SYMBOLS else symbol
        if norm_sym != "ε":
            self.alphabet.add(norm_sym)
        self.transitions.setdefault((from_state, norm_sym), set()).add(to_state)

    def epsilon_closure(self, states: Set[str]) -> Set[str]:
        """
        Computes the epsilon closure of a set of states using BFS.
        """
        closure = set(states)
        queue = deque(states)

        while queue:
            curr = queue.popleft()
            targets = self.transitions.get((curr, "ε"), set())
            for target in targets:
                if target not in closure:
                    closure.add(target)
                    queue.append(target)
        return closure

    def step(self, current_states: Set[str], symbol: str) -> Set[str]:
        """
        Moves from current_states on symbol and returns the epsilon-closure of the resulting states.
        """
        next_states: Set[str] = set()
        for s in current_states:
            targets = self.transitions.get((s, symbol), set())
            next_states.update(targets)
        return self.epsilon_closure(next_states)

    def accepts(self, input_string: str) -> bool:
        if self.start_state is None:
            return False
        current = self.epsilon_closure({self.start_state})
        for char in input_string:
            if char not in self.alphabet:
                return False
            current = self.step(current, char)
            if not current:
                return False
        return bool(current & self.accept_states)

    def simulate(self, input_string: str) -> Dict[str, Any]:
        """
        Step-by-step NFA simulation capturing all active branches and traversed edges.
        """
        if self.start_state is None:
            return {
                "input_string": input_string,
                "accepted": False,
                "execution_steps": [],
            }

        steps: List[Dict[str, Any]] = []
        current = self.epsilon_closure({self.start_state})

        # Step 0: Initial states after epsilon closure
        steps.append({
            "step": 0,
            "consumed_symbol": None,
            "remaining_tape": input_string,
            "active_states": sorted(list(current)),
            "traversed_edge_ids": [],
            "status": "INITIAL",
        })

        for i, char in enumerate(input_string):
            edge_ids: List[str] = []
            direct_targets: Set[str] = set()

            for s in current:
                targets = self.transitions.get((s, char), set())
                for t in targets:
                    edge_ids.append(f"e_{s}_{t}_{char}")
                    direct_targets.add(t)

            next_current = self.epsilon_closure(direct_targets)
            remaining = input_string[i + 1:]

            if not next_current:
                steps.append({
                    "step": i + 1,
                    "consumed_symbol": char,
                    "remaining_tape": remaining,
                    "active_states": [],
                    "traversed_edge_ids": edge_ids,
                    "status": "DEAD_END",
                })
                current = set()
                break

            current = next_current
            steps.append({
                "step": i + 1,
                "consumed_symbol": char,
                "remaining_tape": remaining,
                "active_states": sorted(list(current)),
                "traversed_edge_ids": edge_ids,
                "status": "TRANSITION",
            })

        is_accepted = bool(current & self.accept_states)

        return {
            "input_string": input_string,
            "accepted": is_accepted,
            "final_active_states": sorted(list(current)),
            "execution_steps": steps,
        }

    def to_dfa(self) -> DFA:
        """
        Converts this NFA to an equivalent DFA using the Subset (Powerset) Construction algorithm.
        """
        if self.start_state is None:
            return DFA(alphabet=set(self.alphabet))

        initial_subset = frozenset(self.epsilon_closure({self.start_state}))
        subset_to_name: Dict[frozenset, str] = {initial_subset: "q0"}
        queue: deque[frozenset] = deque([initial_subset])
        state_counter = 1

        dfa_states: Set[str] = {"q0"}
        dfa_transitions: Dict[Tuple[str, str], str] = {}
        dfa_accept_states: Set[str] = set()

        if bool(initial_subset & self.accept_states):
            dfa_accept_states.add("q0")

        while queue:
            curr_subset = queue.popleft()
            curr_name = subset_to_name[curr_subset]

            for symbol in sorted(self.alphabet):
                direct_targets: Set[str] = set()
                for state in curr_subset:
                    direct_targets.update(self.transitions.get((state, symbol), set()))
                target_subset = frozenset(self.epsilon_closure(direct_targets))

                if not target_subset:
                    # Empty state (dead branch)
                    continue

                if target_subset not in subset_to_name:
                    new_name = f"q{state_counter}"
                    state_counter += 1
                    subset_to_name[target_subset] = new_name
                    dfa_states.add(new_name)
                    queue.append(target_subset)

                    if bool(target_subset & self.accept_states):
                        dfa_accept_states.add(new_name)

                dfa_transitions[(curr_name, symbol)] = subset_to_name[target_subset]

        result_dfa = DFA(
            states=dfa_states,
            alphabet=set(self.alphabet),
            transitions=dfa_transitions,
            start_state="q0",
            accept_states=dfa_accept_states,
        )
        return result_dfa.canonicalize()

    def to_graph_dict(self) -> Dict[str, Any]:
        """
        Serializes NFA to UI graph payload.
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
        for (u, sym), targets in sorted(self.transitions.items()):
            for v in sorted(targets):
                conf = self.transition_confidence.get((u, sym), "direct")
                edges.append({
                    "id": f"e_{u}_{v}_{sym}",
                    "source": u,
                    "target": v,
                    "symbol": sym,
                    "combined_label": sym,
                    "confidence": conf,
                    "is_completed": (conf == "completed"),
                })

        return {
            "automaton_type": "NFA",
            "alphabet": sorted_alphabet,
            "initial_state": self.start_state,
            "accepting_states": sorted(list(self.accept_states)),
            "nodes": nodes,
            "edges": edges,
            "metrics": {
                "num_states": len(self.states),
                "num_transitions": sum(len(ts) for ts in self.transitions.values()),
                "is_deterministic": False,
            },
        }

    def __repr__(self) -> str:
        return f"NFA(states={len(self.states)}, alphabet={self.alphabet}, start={self.start_state}, accept={self.accept_states})"

