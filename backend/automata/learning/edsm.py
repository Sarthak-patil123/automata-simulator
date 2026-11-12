from __future__ import annotations
from typing import Dict, List, Set, Tuple, Optional, Any
from ..core.dfa import DFA
from ..core.operations import minimize_dfa
from .pta import build_prefix_tree_acceptor
from .rpni import merge_and_fold, complete_dfa_consistently


class EDSMLearner:
    """
    Evidence-Driven State Merging (EDSM).
    Evaluates all candidate (red, blue) state merges and greedily performs
    the merge that provides the highest evidence (highest compression/consistency score).
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

    def _compute_evidence_score(
        self,
        dfa_before: DFA,
        candidate_dfa: DFA,
    ) -> float:
        """
        Calculates the evidence score:
        Higher score corresponds to more states successfully folded during determinization
        without violating negative constraints (Occam's razor / Minimum Description Length).
        """
        state_reduction = len(dfa_before.states) - len(candidate_dfa.states)
        return float(state_reduction)

    def learn(self) -> Dict[str, Any]:
        pta, prefix_to_state, state_to_prefix = build_prefix_tree_acceptor(
            self.positive_strings, alphabet=self.alphabet
        )

        current_dfa = pta.clone()
        red_states: List[str] = [current_dfa.start_state]
        history: List[Dict[str, Any]] = []
        step_counter = 0

        def state_sort_key(s: str) -> Tuple[int, str]:
            pref = state_to_prefix.get(s, s)
            return (len(pref), pref)

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
            best_merge = None
            best_score = -1.0
            best_candidate_dfa = None

            # Evaluate all candidate merges between blue states and red states
            for q_blue in blue_states:
                for q_red in red_states:
                    candidate_dfa, conflict = merge_and_fold(
                        dfa=current_dfa,
                        target_state=q_red,
                        source_state=q_blue,
                        negative_strings=self.negative_strings,
                    )
                    if candidate_dfa is not None:
                        score = self._compute_evidence_score(current_dfa, candidate_dfa)
                        if score > best_score:
                            best_score = score
                            best_merge = (q_red, q_blue)
                            best_candidate_dfa = candidate_dfa

            step_counter += 1
            if best_merge is not None and best_candidate_dfa is not None:
                q_red, q_blue = best_merge
                history.append({
                    "step": step_counter,
                    "action": "BEST_MERGE_COMMITTED",
                    "target_state": q_red,
                    "source_state": q_blue,
                    "score": best_score,
                    "status": "SUCCESS",
                    "reason": f"Merged {q_blue} -> {q_red} with evidence score {best_score}",
                    "num_states_after": len(best_candidate_dfa.states),
                })
                current_dfa = best_candidate_dfa
                # Ensure all red states are valid states in current_dfa
                red_states = [s for s in red_states if s in current_dfa.states]
                if q_red not in red_states and q_red in current_dfa.states:
                    red_states.append(q_red)
            else:
                # No valid merge could be made without conflict -> promote first blue state
                q_blue = blue_states[0]
                red_states.append(q_blue)
                history.append({
                    "step": step_counter,
                    "action": "PROMOTE_TO_RED",
                    "target_state": q_blue,
                    "source_state": None,
                    "score": 0.0,
                    "status": "PROMOTED",
                    "reason": f"State {q_blue} promoted to kernel due to no consistent merge options",
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


def edsm_learn(
    positive_strings: List[str],
    negative_strings: List[str],
    alphabet: Optional[List[str]] = None,
) -> DFA:
    learner = EDSMLearner(positive_strings, negative_strings, alphabet)
    res = learner.learn()
    return res["inferred_dfa"]
