from __future__ import annotations
from typing import Dict, List, Set, Tuple, Optional, Any
from collections import deque
from ..core.dfa import DFA
from ..core.operations import minimize_dfa
from .pta import build_prefix_tree_acceptor


class UnionFind:
    def __init__(self, elements):
        self.parent = {x: x for x in elements}

    def find(self, x: str) -> str:
        if x not in self.parent:
            return x
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, target: str, source: str) -> str:
        """
        Always merges source into target (target becomes the root).
        """
        root_target = self.find(target)
        root_source = self.find(source)
        if root_target == root_source:
            return root_target

        self.parent[root_source] = root_target
        return root_target


def merge_and_fold(
    dfa: DFA,
    target_state: str,
    source_state: str,
    negative_strings: List[str],
) -> Tuple[Optional[DFA], Optional[str]]:
    """
    Attempts to merge source_state into target_state in dfa and recursively
    folds non-deterministic branches (determinization).
    Checks consistency against negative_strings.
    Returns:
      (merged_dfa, None) if valid and consistent with S-.
      (None, conflict_reason) if a negative sample is accepted.
    """
    uf = UnionFind(dfa.states)
    uf.union(target_state, source_state)

    # Queue of state pairs whose outgoing transitions must be reconciled
    queue: deque[Tuple[str, str]] = deque([(target_state, source_state)])

    # Group transitions by (source, symbol) -> set of targets
    trans_map: Dict[Tuple[str, str], Set[str]] = {}
    for (u, sym), v in dfa.transitions.items():
        trans_map.setdefault((u, sym), set()).add(v)

    while queue:
        u_elem, v_elem = queue.popleft()
        root_u = uf.find(u_elem)
        root_v = uf.find(v_elem)

        # For every alphabet symbol, gather all targets from any state in this merged group
        for sym in sorted(dfa.alphabet):
            targets: Set[str] = set()
            for s in dfa.states:
                if uf.find(s) == root_u:
                    targets.update(trans_map.get((s, sym), set()))

            target_roots = {uf.find(t) for t in targets}
            if len(target_roots) > 1:
                # Non-determinism detected: fold all target roots into the first one
                sorted_roots = sorted(list(target_roots))
                rep = sorted_roots[0]
                for other in sorted_roots[1:]:
                    if uf.find(other) != uf.find(rep):
                        uf.union(rep, other)
                        queue.append((rep, other))

    # Build quotient automaton
    quotient_states = {uf.find(s) for s in dfa.states}
    quotient_start = uf.find(dfa.start_state)
    quotient_accept = {uf.find(s) for s in dfa.accept_states}

    quotient_transitions: Dict[Tuple[str, str], str] = {}
    for (u, sym), v in dfa.transitions.items():
        root_u = uf.find(u)
        root_v = uf.find(v)
        quotient_transitions[(root_u, sym)] = root_v

    candidate_dfa = DFA(
        states=quotient_states,
        alphabet=set(dfa.alphabet),
        transitions=quotient_transitions,
        start_state=quotient_start,
        accept_states=quotient_accept,
    )

    # Consistency Check: Does candidate accept any negative string?
    for neg_str in negative_strings:
        if candidate_dfa.accepts(neg_str):
            return None, f"Negative sample '{neg_str}' was incorrectly accepted"

    return candidate_dfa, None


def complete_dfa_consistently(dfa: DFA, negative_strings: List[str]) -> DFA:
    """
    Completes any undefined transitions in dfa without accepting any string in negative_strings.
    Prioritizes candidate targets:
      1. start_state (reset transitions are common in regular languages)
      2. current state (self-loop)
      3. other existing states in sorted order
    Only introduces a non-accepting sink state if no existing state is consistent with S-.
    """
    all_states = sorted(list(dfa.states))
    alphabet = sorted(list(dfa.alphabet))
    missing = [(s, a) for s in all_states for a in alphabet if (s, a) not in dfa.transitions]
    if not missing:
        return dfa

    curr_transitions = dict(dfa.transitions)
    curr_states = set(dfa.states)

    for s, a in missing:
        best_target = None
        candidates = [dfa.start_state, s] + [st for st in all_states if st not in (dfa.start_state, s)]
        seen = set()
        ordered_candidates = [c for c in candidates if not (c in seen or seen.add(c))]

        for cand in ordered_candidates:
            test_trans = dict(curr_transitions)
            test_trans[(s, a)] = cand
            test_dfa = DFA(
                states=set(curr_states),
                alphabet=set(alphabet),
                transitions=test_trans,
                start_state=dfa.start_state,
                accept_states=set(dfa.accept_states),
            )
            if all(not test_dfa.accepts(neg) for neg in negative_strings):
                best_target = cand
                break

        if best_target is not None:
            curr_transitions[(s, a)] = best_target
        else:
            sink = "_sink_"
            curr_states.add(sink)
            for ch in alphabet:
                curr_transitions[(sink, ch)] = sink
            curr_transitions[(s, a)] = sink

    return DFA(
        states=curr_states,
        alphabet=set(alphabet),
        transitions=curr_transitions,
        start_state=dfa.start_state,
        accept_states=set(dfa.accept_states),
    )


class RPNILearner:
    """
    RPNI (Regular Positive and Negative Inference) Algorithm.
    Learns a minimal consistent DFA from positive (S+) and negative (S-) string sets.
    Generates step-by-step merge logs for interactive UI replay.
    """

    def __init__(
        self,
        positive_strings: List[str],
        negative_strings: List[str],
        alphabet: Optional[List[str]] = None,
    ):
        self.positive_strings = sorted(list(set(positive_strings)), key=lambda s: (len(s), s))
        self.negative_strings = sorted(list(set(negative_strings)), key=lambda s: (len(s), s))
        if alphabet:
            self.alphabet = sorted(list(set(alphabet)))
        else:
            all_chars = set("".join(self.positive_strings + self.negative_strings))
            self.alphabet = sorted(list(all_chars)) if all_chars else ["0", "1"]

    def learn(self) -> Dict[str, Any]:
        """
        Executes the RPNI state merging algorithm.
        Returns:
          {
            "inferred_dfa": DFA,
            "pta_dfa": DFA,
            "history": List[Dict[str, Any]],
            "num_steps": int,
            "final_state_count": int
          }
        """
        # Step 1: Construct Prefix Tree Acceptor (PTA)
        pta, prefix_to_state, state_to_prefix = build_prefix_tree_acceptor(
            self.positive_strings, alphabet=self.alphabet
        )

        current_dfa = pta.clone()
        history: List[Dict[str, Any]] = []
        step_counter = 0

        # Initial RED state is the start state (prefix "")
        red_states: List[str] = [current_dfa.start_state]

        # Order states by prefix length then lexicographically
        def state_sort_key(s: str) -> Tuple[int, str]:
            pref = state_to_prefix.get(s, s)
            return (len(pref), pref)

        # Helper to compute current blue states (fringe of red)
        def get_blue_states(dfa: DFA, red: List[str]) -> List[str]:
            red_set = set(red)
            blue = set()
            for r in red:
                for a in sorted(dfa.alphabet):
                    nxt = dfa.step(r, a)
                    if nxt is not None and nxt not in red_set:
                        blue.add(nxt)
            return sorted(list(blue), key=state_sort_key)

        blue_states = get_blue_states(current_dfa, red_states)

        while blue_states:
            q_blue = blue_states[0]
            merged_successfully = False

            # Try merging q_blue into each q_red in order
            for q_red in list(red_states):
                step_counter += 1
                candidate_dfa, conflict = merge_and_fold(
                    dfa=current_dfa,
                    target_state=q_red,
                    source_state=q_blue,
                    negative_strings=self.negative_strings,
                )

                if candidate_dfa is not None:
                    # Merge accepted!
                    history.append({
                        "step": step_counter,
                        "action": "MERGE_ACCEPTED",
                        "target_state": q_red,
                        "source_state": q_blue,
                        "status": "SUCCESS",
                        "reason": f"Merged {q_blue} into {q_red} without negative sample conflict",
                        "num_states_after": len(candidate_dfa.states),
                    })
                    current_dfa = candidate_dfa
                    red_states = [s for s in red_states if s in current_dfa.states]
                    if q_red not in red_states and q_red in current_dfa.states:
                        red_states.append(q_red)
                    merged_successfully = True
                    break
                else:
                    # Merge rejected due to negative conflict
                    history.append({
                        "step": step_counter,
                        "action": "MERGE_REJECTED",
                        "target_state": q_red,
                        "source_state": q_blue,
                        "status": "CONFLICT",
                        "reason": conflict,
                        "num_states_after": len(current_dfa.states),
                    })

            if not merged_successfully:
                # Cannot merge q_blue with any existing red state -> promote q_blue to RED
                red_states.append(q_blue)
                step_counter += 1
                history.append({
                    "step": step_counter,
                    "action": "PROMOTE_TO_RED",
                    "target_state": q_blue,
                    "source_state": None,
                    "status": "PROMOTED",
                    "reason": f"State {q_blue} is distinct from all existing core states",
                    "num_states_after": len(current_dfa.states),
                })

            blue_states = get_blue_states(current_dfa, red_states)

        completed_dfa = complete_dfa_consistently(current_dfa, self.negative_strings)
        final_dfa = minimize_dfa(completed_dfa)

        return {
            "inferred_dfa": final_dfa,
            "pta_dfa": pta,
            "history": history,
            "num_steps": step_counter,
            "final_state_count": len(final_dfa.states),
        }


def rpn_learn(
    positive_strings: List[str],
    negative_strings: List[str],
    alphabet: Optional[List[str]] = None,
) -> DFA:
    learner = RPNILearner(positive_strings, negative_strings, alphabet)
    res = learner.learn()
    return res["inferred_dfa"]
