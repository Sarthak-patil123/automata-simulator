from __future__ import annotations
from typing import Dict, List, Set, Tuple, Optional
from ..core.dfa import DFA


def build_prefix_tree_acceptor(
    positive_strings: List[str],
    alphabet: Optional[List[str]] = None,
) -> Tuple[DFA, Dict[str, str], Dict[str, str]]:
    """
    Constructs the Prefix Tree Acceptor (PTA) from positive strings S+.
    Returns:
      (pta_dfa, prefix_to_state, state_to_prefix)
    """
    if alphabet is not None:
        alpha_set = set(alphabet)
    else:
        alpha_set = set("".join(positive_strings)) if positive_strings else {"0", "1"}

    prefix_to_state: Dict[str, str] = {"": "q0"}
    state_to_prefix: Dict[str, str] = {"q0": ""}
    state_counter = 1

    states: Set[str] = {"q0"}
    transitions: Dict[Tuple[str, str], str] = {}
    accept_states: Set[str] = set()

    if "" in positive_strings:
        accept_states.add("q0")

    # Sort strings by length and lexicographically to maintain canonical state numbering
    sorted_positives = sorted(list(set(positive_strings)), key=lambda s: (len(s), s))

    for s in sorted_positives:
        curr_prefix = ""
        curr_state = "q0"

        for char in s:
            next_prefix = curr_prefix + char
            if next_prefix not in prefix_to_state:
                new_state = f"q{state_counter}"
                state_counter += 1
                prefix_to_state[next_prefix] = new_state
                state_to_prefix[new_state] = next_prefix
                states.add(new_state)

            next_state = prefix_to_state[next_prefix]
            transitions[(curr_state, char)] = next_state

            curr_prefix = next_prefix
            curr_state = next_state

        accept_states.add(curr_state)

    pta_dfa = DFA(
        states=states,
        alphabet=alpha_set,
        transitions=transitions,
        start_state="q0",
        accept_states=accept_states,
    )

    return pta_dfa, prefix_to_state, state_to_prefix

