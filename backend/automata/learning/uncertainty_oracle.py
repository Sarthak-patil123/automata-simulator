from __future__ import annotations
from typing import Dict, List, Set, Tuple, Optional, Any, Union
from collections import deque
from ..core.dfa import DFA
from ..core.nfa import NFA


class UncertaintyActiveLearner:
    """
    Uncertainty-Guided Active Query Selector for Automata Learning.
    
    Rather than requiring dozens or hundreds of blind table-filling questions
    (as in classical Angluin L*), this learner identifies the top 3-5 most ambiguous
    or unverified boundary strings from the synthesized automaton and prompts
    the human only when genuinely unsure.
    
    Guarantees a strict hard cap of max_questions (default: 4, max: 5).
    """

    def __init__(
        self,
        model: Union[DFA, NFA],
        positive_strings: List[str],
        negative_strings: List[str],
        alphabet: List[str],
        max_questions: int = 4,
    ):
        self.model = model
        self.positive_strings = list(positive_strings)
        self.negative_strings = list(negative_strings)
        self.alphabet = sorted(list(alphabet))
        self.max_questions = min(max(1, max_questions), 5)
        
        self.known_labels: Dict[str, bool] = {s: True for s in positive_strings}
        for s in negative_strings:
            self.known_labels[s] = False

        self.queries: List[str] = self._extract_ambiguous_queries()
        self.current_query_index: int = 0
        self.answers: Dict[str, bool] = {}
        self.query_history: List[Dict[str, Any]] = []
        self.current_conjecture: Optional[Union[DFA, NFA]] = model
        self.is_converged: bool = (len(self.queries) == 0)

    def _extract_ambiguous_queries(self) -> List[str]:
        """
        Extracts the most critical disambiguating strings:
        1. Paths traversing consistency-completed transitions (edges inferred without direct S+ evidence).
        2. Short unobserved boundary transitions (access strings + symbol not present in S+ or S-).
        """
        if not isinstance(self.model, DFA):
            # For NFA, convert or extract shortest unobserved paths
            try:
                dfa = self.model.to_dfa()
            except Exception:
                return []
        else:
            dfa = self.model

        if not dfa.states or dfa.start_state is None:
            return []

        known = set(self.known_labels.keys())

        # 1. BFS to compute shortest access string to every state
        access: Dict[str, str] = {dfa.start_state: ""}
        q_bfs = deque([dfa.start_state])
        while q_bfs:
            curr = q_bfs.popleft()
            for a in self.alphabet:
                nxt = dfa.step(curr, a)
                if nxt is not None and nxt not in access:
                    access[nxt] = access[curr] + a
                    q_bfs.append(nxt)

        # 2. BFS backwards to find shortest string from each state to an accepting state
        to_accept: Dict[str, str] = {}
        for s in dfa.accept_states:
            to_accept[s] = ""
        rev_q = deque(list(dfa.accept_states))
        visited_accept = set(dfa.accept_states)
        while rev_q:
            curr = rev_q.popleft()
            for u in dfa.states:
                for a in self.alphabet:
                    if dfa.step(u, a) == curr and u not in visited_accept:
                        visited_accept.add(u)
                        to_accept[u] = a + to_accept[curr]
                        rev_q.append(u)

        candidates: List[Tuple[int, int, str]] = []

        # Category A: Transitions marked as "completed" (highest ambiguity)
        completed_edges = [
            (u, a)
            for (u, a), conf in getattr(dfa, "transition_confidence", {}).items()
            if conf == "completed"
        ]
        for u, a in completed_edges:
            u_acc = access.get(u, "")
            nxt = dfa.step(u, a)
            if nxt is not None:
                suffix = to_accept.get(nxt, "")
                cand = u_acc + a + suffix
                if cand not in known:
                    # Priority 0: Completed edge with accepting suffix
                    candidates.append((len(cand), 0, cand))
                # Also try access string + symbol alone
                cand_short = u_acc + a
                if cand_short not in known:
                    candidates.append((len(cand_short), 1, cand_short))

        # Category B: Short unobserved transitions from access strings
        # Only needed if completed edges did not supply enough queries
        if len(candidates) < self.max_questions:
            for u, u_acc in sorted(access.items(), key=lambda item: len(item[1])):
                for a in self.alphabet:
                    cand = u_acc + a
                    if cand not in known:
                        candidates.append((len(cand), 2, cand))
                    nxt = dfa.step(u, a)
                    if nxt is not None and nxt in to_accept:
                        suffix = to_accept[nxt]
                        cand2 = u_acc + a + suffix
                        if cand2 not in known:
                            candidates.append((len(cand2), 2, cand2))

        # Deduplicate while preserving length & priority ordering
        seen: Set[str] = set()
        ranked_queries: List[str] = []
        for length, prio, c in sorted(candidates, key=lambda x: (x[1], x[0], len(x[2]), x[2])):
            if c not in seen and c not in known:
                seen.add(c)
                ranked_queries.append(c)
                if len(ranked_queries) >= self.max_questions:
                    break

        return ranked_queries

    def get_step_result(self) -> Dict[str, Any]:
        """
        Returns the current state of the interactive question flow.
        """
        if self.current_query_index >= len(self.queries):
            self.is_converged = True
            return {
                "status": "CONVERGED",
                "message": f"All {len(self.answers)} verification questions answered. Minimal model generated!",
                "total_queries_asked": len(self.answers),
                "total_queries": len(self.queries),
            }

        curr_q = self.queries[self.current_query_index]
        return {
            "status": "NEED_MEMBERSHIP_QUERY",
            "query_string": curr_q,
            "query_index": self.current_query_index + 1,
            "total_queries": len(self.queries),
            "total_queries_asked": len(self.answers),
            "prompt": f"Is the string '{curr_q}' ACCEPTED in your target language?",
        }

    def answer_membership_query(self, is_accepted: bool) -> Tuple[str, bool]:
        """
        Records the answer for the current query string and advances to the next.
        Returns (answered_query_string, is_accepted).
        """
        if self.current_query_index >= len(self.queries):
            raise ValueError("All scheduled queries have already been answered.")

        q_str = self.queries[self.current_query_index]
        self.answers[q_str] = bool(is_accepted)
        self.known_labels[q_str] = bool(is_accepted)
        self.query_history.append({
            "query_string": q_str,
            "answer": bool(is_accepted),
            "source": "uncertainty_oracle",
        })
        self.current_query_index += 1

        if self.current_query_index >= len(self.queries):
            self.is_converged = True

        return q_str, bool(is_accepted)

    def skip_remaining(self) -> None:
        """
        Skips all remaining queries and marks the learner as converged.
        """
        self.current_query_index = len(self.queries)
        self.is_converged = True
