from __future__ import annotations
from typing import Dict, Set, Tuple, List, Optional
from collections import deque
from .dfa import DFA


def minimize_dfa(dfa: DFA) -> DFA:
    """
    Minimizes a DFA using Hopcroft's partition refinement algorithm.
    Time complexity: O(|Sigma| * |Q| * log |Q|).
    """
    if dfa.start_state is None:
        return dfa.clone()

    # 1. Prune unreachable states
    reachable = dfa.get_reachable_states()
    if not reachable:
        return DFA(alphabet=set(dfa.alphabet))

    # 2. Complete the DFA over reachable states
    alphabet = sorted(list(dfa.alphabet))
    transitions = {k: v for k, v in dfa.transitions.items() if k[0] in reachable and v in reachable}
    accept_states = set(dfa.accept_states & reachable)
    all_states = set(reachable)

    # Check if a sink/dead state is needed to make transitions complete
    needs_sink = False
    sink_state = "_sink_"
    for s in list(all_states):
        for a in alphabet:
            if (s, a) not in transitions:
                transitions[(s, a)] = sink_state
                needs_sink = True

    if needs_sink:
        all_states.add(sink_state)
        for a in alphabet:
            transitions[(sink_state, a)] = sink_state

    # 3. Initial partition P = {F, Q \ F}
    f_set = frozenset(accept_states)
    non_f_set = frozenset(all_states - accept_states)

    if not f_set:
        # No accept states: automaton accepts nothing; single state rejects all
        single = DFA(states={"q0"}, alphabet=set(alphabet), transitions={( "q0", a): "q0" for a in alphabet}, start_state="q0", accept_states=set())
        return single

    if not non_f_set:
        # All states are accepting: automaton accepts everything; single state accepts all
        single = DFA(states={"q0"}, alphabet=set(alphabet), transitions={( "q0", a): "q0" for a in alphabet}, start_state="q0", accept_states={"q0"})
        return single

    partition: Set[frozenset] = {f_set, non_f_set}
    # Worklist W contains the smaller partition block
    worklist: List[frozenset] = [f_set if len(f_set) <= len(non_f_set) else non_f_set]

    while worklist:
        A = worklist.pop()
        for c in alphabet:
            # X = set of states that transition into A on symbol c
            X = frozenset(s for s in all_states if transitions.get((s, c)) in A)
            if not X:
                continue

            new_partition: Set[frozenset] = set()
            for Y in partition:
                intersection = Y & X
                difference = Y - X
                if intersection and difference:
                    new_partition.add(intersection)
                    new_partition.add(difference)

                    if Y in worklist:
                        worklist.remove(Y)
                        worklist.append(intersection)
                        worklist.append(difference)
                    else:
                        if len(intersection) <= len(difference):
                            worklist.append(intersection)
                        else:
                            worklist.append(difference)
                else:
                    new_partition.add(Y)

            partition = new_partition

    # 4. Construct minimal DFA from partitions
    state_to_block: Dict[str, frozenset] = {}
    for block in partition:
        for s in block:
            state_to_block[s] = block

    block_to_name: Dict[frozenset, str] = {}
    new_start_block = state_to_block[dfa.start_state]
    block_to_name[new_start_block] = "q0"
    counter = 1

    for block in partition:
        if block != new_start_block:
            block_to_name[block] = f"q{counter}"
            counter += 1

    new_states = set(block_to_name.values())
    new_accept_states = {
        block_to_name[block]
        for block in partition
        if any(s in accept_states for s in block)
    }
    new_transitions: Dict[Tuple[str, str], str] = {}

    for block in partition:
        rep = next(iter(block))
        u_name = block_to_name[block]
        for a in alphabet:
            nxt = transitions.get((rep, a))
            if nxt is not None:
                v_block = state_to_block[nxt]
                v_name = block_to_name[v_block]
                new_transitions[(u_name, a)] = v_name

    minimized = DFA(
        states=new_states,
        alphabet=set(alphabet),
        transitions=new_transitions,
        start_state="q0",
        accept_states=new_accept_states,
    )
    return minimized.canonicalize()


def complement_dfa(dfa: DFA) -> DFA:
    r"""
    Computes the complement automaton: L(M') = Sigma* \ L(M).
    Requires completing the DFA first.
    """
    complete_dfa = dfa.make_complete("_dead_")
    new_accept = complete_dfa.states - complete_dfa.accept_states
    comp = DFA(
        states=set(complete_dfa.states),
        alphabet=set(complete_dfa.alphabet),
        transitions=dict(complete_dfa.transitions),
        start_state=complete_dfa.start_state,
        accept_states=new_accept,
    )
    return minimize_dfa(comp)


def _product_construction(
    dfa1: DFA,
    dfa2: DFA,
    accept_condition: str,
) -> DFA:
    """
    Helper for cross-product automaton construction.
    accept_condition: 'INTERSECTION', 'UNION', or 'XOR'
    """
    alpha = sorted(list(dfa1.alphabet | dfa2.alphabet))
    c1 = dfa1.make_complete("_dead1_")
    c2 = dfa2.make_complete("_dead2_")

    start_pair = (c1.start_state, c2.start_state)
    visited = set()
    queue = deque([start_pair])

    pair_to_name: Dict[Tuple[str, str], str] = {start_pair: "q0"}
    counter = 1

    prod_states: Set[str] = {"q0"}
    prod_accept: Set[str] = set()
    prod_transitions: Dict[Tuple[str, str], str] = {}

    def is_accepting(u: str, v: str) -> bool:
        in1 = u in c1.accept_states
        in2 = v in c2.accept_states
        if accept_condition == "INTERSECTION":
            return in1 and in2
        elif accept_condition == "UNION":
            return in1 or in2
        elif accept_condition == "XOR":
            return in1 != in2
        return False

    if is_accepting(start_pair[0], start_pair[1]):
        prod_accept.add("q0")

    while queue:
        curr_pair = queue.popleft()
        u, v = curr_pair
        curr_name = pair_to_name[curr_pair]

        for a in alpha:
            nxt_u = c1.step(u, a)
            nxt_v = c2.step(v, a)
            nxt_pair = (nxt_u, nxt_v)

            if nxt_pair not in pair_to_name:
                new_name = f"q{counter}"
                counter += 1
                pair_to_name[nxt_pair] = new_name
                prod_states.add(new_name)
                queue.append(nxt_pair)

                if is_accepting(nxt_u, nxt_v):
                    prod_accept.add(new_name)

            prod_transitions[(curr_name, a)] = pair_to_name[nxt_pair]

    prod_dfa = DFA(
        states=prod_states,
        alphabet=set(alpha),
        transitions=prod_transitions,
        start_state="q0",
        accept_states=prod_accept,
    )
    return minimize_dfa(prod_dfa)


def intersect_dfas(dfa1: DFA, dfa2: DFA) -> DFA:
    return _product_construction(dfa1, dfa2, "INTERSECTION")


def union_dfas(dfa1: DFA, dfa2: DFA) -> DFA:
    return _product_construction(dfa1, dfa2, "UNION")


def symmetric_difference_dfa(dfa1: DFA, dfa2: DFA) -> DFA:
    r"""
    Computes M_diff where L(M_diff) = (L(M1) \ L(M2)) U (L(M2) \ L(M1)).
    """
    return _product_construction(dfa1, dfa2, "XOR")


def are_equivalent(dfa1: DFA, dfa2: DFA) -> Tuple[bool, Optional[str]]:
    """
    Tests if two DFAs decide the exact same language (L(dfa1) == L(dfa2)).
    Returns:
      (True, None) if equivalent.
      (False, counterexample_string) with the shortest differentiating string if not.
    """
    diff_dfa = symmetric_difference_dfa(dfa1, dfa2)
    if diff_dfa.start_state is None or not diff_dfa.accept_states:
        return True, None

    # BFS from start_state to find shortest path to an accept state
    queue = deque([(diff_dfa.start_state, "")])
    visited = {diff_dfa.start_state}

    while queue:
        curr, path = queue.popleft()
        if curr in diff_dfa.accept_states:
            return False, path

        for a in sorted(diff_dfa.alphabet):
            nxt = diff_dfa.step(curr, a)
            if nxt is not None and nxt not in visited:
                visited.add(nxt)
                queue.append((nxt, path + a))

    return True, None
