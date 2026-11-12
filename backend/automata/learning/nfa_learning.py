from __future__ import annotations
from typing import Dict, List, Set, Tuple, Optional, Any
from collections import deque
from ..core.nfa import NFA
from ..core.dfa import DFA
from .pta import build_prefix_tree_acceptor


def complete_and_canonicalize_nfa(nfa: NFA, negative_strings: List[str]) -> NFA:
    """
    1. Fills missing transitions in NFA where an existing state can be targeted
       without accepting any negative string.
    2. Canonicalizes state names using BFS order to q0, q1, q2...
    """
    all_states = sorted(list(nfa.states))
    alphabet = sorted(list(nfa.alphabet))

    curr_transitions: Dict[Tuple[str, str], Set[str]] = {
        k: set(v) for k, v in nfa.transitions.items()
    }

    orig_transitions: Set[Tuple[str, str]] = set()
    for (u, a) in nfa.transitions:
        if nfa.transitions[(u, a)]:
            orig_transitions.add((u, a))

    completed_transitions: Set[Tuple[str, str]] = set()

    for s in all_states:
        for a in alphabet:
            if (s, a) not in curr_transitions or not curr_transitions[(s, a)]:
                candidates = [nfa.start_state, s] + [st for st in all_states if st not in (nfa.start_state, s)]
                seen = set()
                ordered = [c for c in candidates if not (c in seen or seen.add(c))]
                for cand in ordered:
                    test_trans = {k: set(v) for k, v in curr_transitions.items()}
                    test_trans.setdefault((s, a), set()).add(cand)
                    test_nfa = NFA(
                        states=set(all_states),
                        alphabet=set(alphabet),
                        transitions=test_trans,
                        start_state=nfa.start_state,
                        accept_states=set(nfa.accept_states),
                    )
                    if all(not test_nfa.accepts(neg) for neg in negative_strings):
                        curr_transitions.setdefault((s, a), set()).add(cand)
                        completed_transitions.add((s, a))
                        break

    # Canonicalize state names with BFS from start_state
    mapping: Dict[str, str] = {}
    if nfa.start_state is not None:
        queue = deque([nfa.start_state])
        mapping[nfa.start_state] = "q0"
        counter = 1
        visited = {nfa.start_state}
        while queue:
            curr = queue.popleft()
            for a in alphabet:
                for nxt in sorted(curr_transitions.get((curr, a), set())):
                    if nxt not in visited:
                        visited.add(nxt)
                        mapping[nxt] = f"q{counter}"
                        counter += 1
                        queue.append(nxt)

    counter = len(mapping)
    for s in all_states:
        if s not in mapping:
            mapping[s] = f"q{counter}"
            counter += 1

    canon_trans: Dict[Tuple[str, str], Set[str]] = {}
    canon_confidence: Dict[Tuple[str, str], str] = {}

    for (u, a), tgts in curr_transitions.items():
        if u in mapping:
            mu = mapping[u]
            canon_trans[(mu, a)] = {mapping[t] for t in tgts if t in mapping}
            canon_confidence[(mu, a)] = "completed" if (u, a) in completed_transitions else "direct"

    start_st = mapping.get(nfa.start_state, "q0") if nfa.start_state else None
    accept_sts = {mapping[s] for s in nfa.accept_states if s in mapping}

    return NFA(
        states=set(mapping.values()),
        alphabet=set(alphabet),
        transitions=canon_trans,
        start_state=start_st,
        accept_states=accept_sts,
        transition_confidence=canon_confidence,
    )


def merge_nfa_states(nfa: NFA, target_u: str, source_v: str) -> NFA:
    """
    Merges source_v into target_u in an NFA without determinizing.
    Guarantees that any string accepted by `nfa` remains accepted.
    """
    new_states = {s for s in nfa.states if s != source_v}
    new_start = target_u if nfa.start_state == source_v else nfa.start_state

    new_accept = set()
    for s in nfa.accept_states:
        if s == source_v:
            new_accept.add(target_u)
        else:
            new_accept.add(s)

    new_transitions: Dict[Tuple[str, str], Set[str]] = {}
    for (from_s, sym), targets in nfa.transitions.items():
        curr_from = target_u if from_s == source_v else from_s
        curr_targets = {target_u if t == source_v else t for t in targets}
        new_transitions.setdefault((curr_from, sym), set()).update(curr_targets)

    return NFA(
        states=new_states,
        alphabet=set(nfa.alphabet),
        transitions=new_transitions,
        start_state=new_start,
        accept_states=new_accept,
    )


class NFALearner:
    """
    Non-deterministic Automata Learner.
    Performs state-merging on the Prefix Tree Acceptor without forcing determinization,
    producing compact NFAs that are strictly consistent with S+ and S-.
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
        pta_dfa, _, state_to_prefix = build_prefix_tree_acceptor(
            self.positive_strings, alphabet=self.alphabet
        )

        nfa_transitions: Dict[Tuple[str, str], Set[str]] = {}
        for (u, sym), v in pta_dfa.transitions.items():
            nfa_transitions.setdefault((u, sym), set()).add(v)

        current_nfa = NFA(
            states=set(pta_dfa.states),
            alphabet=set(self.alphabet),
            transitions=nfa_transitions,
            start_state=pta_dfa.start_state,
            accept_states=set(pta_dfa.accept_states),
        )

        def sort_key(s: str) -> Tuple[int, str]:
            pref = state_to_prefix.get(s, s)
            return (len(pref), pref)

        history: List[Dict[str, Any]] = []
        step_counter = 0

        # Iteratively try merging pairs of states
        changed = True
        while changed:
            changed = False
            ordered_states = sorted(list(current_nfa.states), key=sort_key)

            for i in range(len(ordered_states)):
                u = ordered_states[i]
                if u not in current_nfa.states:
                    continue

                for j in range(i + 1, len(ordered_states)):
                    v = ordered_states[j]
                    if v not in current_nfa.states:
                        continue

                    step_counter += 1
                    candidate_nfa = merge_nfa_states(current_nfa, target_u=u, source_v=v)

                    # Consistency check: does candidate_nfa reject all S- ?
                    conflict = False
                    violating_string = None
                    for neg_str in self.negative_strings:
                        if candidate_nfa.accepts(neg_str):
                            conflict = True
                            violating_string = neg_str
                            break

                    if not conflict:
                        # Valid NFA merge!
                        current_nfa = candidate_nfa
                        changed = True
                        history.append({
                            "step": step_counter,
                            "action": "NFA_MERGE_SUCCESS",
                            "merged_state": v,
                            "target_state": u,
                            "status": "SUCCESS",
                            "reason": f"Non-deterministic merge of {v} into {u} consistent with S-",
                            "num_states_after": len(current_nfa.states),
                        })
                        break
                    else:
                        history.append({
                            "step": step_counter,
                            "action": "NFA_MERGE_REJECTED",
                            "merged_state": v,
                            "target_state": u,
                            "status": "CONFLICT",
                            "reason": f"Rejected: negative string '{violating_string}' accepted",
                            "num_states_after": len(current_nfa.states),
                        })

                if changed:
                    break

        final_nfa = complete_and_canonicalize_nfa(current_nfa, self.negative_strings)

        return {
            "inferred_nfa": final_nfa,
            "equivalent_dfa": final_nfa.to_dfa(),
            "history": history,
            "num_steps": step_counter,
            "final_nfa_states": len(final_nfa.states),
        }
