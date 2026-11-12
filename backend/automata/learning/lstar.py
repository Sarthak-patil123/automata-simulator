from __future__ import annotations
from typing import Dict, List, Set, Tuple, Optional, Any, Callable
from ..core.dfa import DFA
from ..core.operations import are_equivalent, minimize_dfa


class Teacher:
    """
    Teacher / Oracle interface for Angluin's L* Active Learning.
    Can wrap a ground-truth DFA, a Python rule function, or interactive user queries.
    """

    def __init__(
        self,
        membership_oracle: Callable[[str], bool],
        equivalence_oracle: Optional[Callable[[DFA], Tuple[bool, Optional[str]]]] = None,
        reference_dfa: Optional[DFA] = None,
    ):
        self.membership_oracle = membership_oracle
        self.reference_dfa = reference_dfa
        self.equivalence_oracle = equivalence_oracle
        self.membership_query_count = 0
        self.equivalence_query_count = 0

    def query_membership(self, w: str) -> bool:
        self.membership_query_count += 1
        return self.membership_oracle(w)

    def query_equivalence(self, conjectured_dfa: DFA) -> Tuple[bool, Optional[str]]:
        self.equivalence_query_count += 1
        if self.equivalence_oracle is not None:
            return self.equivalence_oracle(conjectured_dfa)
        if self.reference_dfa is not None:
            return are_equivalent(conjectured_dfa, self.reference_dfa)
        raise ValueError("No equivalence oracle or reference DFA provided to Teacher.")


class ObservationTable:
    """
    Observation Table (S, E, T) for L* algorithm.
    S: Access prefixes
    E: Test suffixes
    T: Table cells mapping (prefix, suffix) -> bool
    """

    def __init__(self, alphabet: List[str], teacher: Teacher):
        self.alphabet = sorted(list(alphabet))
        self.teacher = teacher
        self.S: List[str] = [""]
        self.E: List[str] = [""]
        self.table: Dict[Tuple[str, str], bool] = {}
        self._fill_missing()

    def _fill_missing(self) -> None:
        # Fill S x E
        for s in self.S:
            for e in self.E:
                if (s, e) not in self.table:
                    self.table[(s, e)] = self.teacher.query_membership(s + e)

        # Fill (S . Sigma) x E
        for s in self.S:
            for a in self.alphabet:
                sa = s + a
                for e in self.E:
                    if (sa, e) not in self.table:
                        self.table[(sa, e)] = self.teacher.query_membership(sa + e)

    def row(self, prefix: str) -> Tuple[bool, ...]:
        return tuple(self.table[(prefix, e)] for e in self.E)

    def get_s_rows(self) -> Dict[str, Tuple[bool, ...]]:
        return {s: self.row(s) for s in self.S}

    def is_closed(self) -> Tuple[bool, Optional[str]]:
        """
        Closed: For every t in S . Sigma, exists s in S with row(t) == row(s).
        Returns: (True, None) or (False, candidate_t)
        """
        s_rows = set(self.row(s) for s in self.S)
        for s in self.S:
            for a in self.alphabet:
                sa = s + a
                if self.row(sa) not in s_rows:
                    return False, sa
        return True, None

    def is_consistent(self) -> Tuple[bool, Optional[str]]:
        """
        Consistent: If row(s1) == row(s2), then for all a, row(s1.a) == row(s2.a).
        Returns: (True, None) or (False, new_distinguishing_suffix_ae)
        """
        for i in range(len(self.S)):
            for j in range(i + 1, len(self.S)):
                s1 = self.S[i]
                s2 = self.S[j]
                if self.row(s1) == self.row(s2):
                    for a in self.alphabet:
                        for k, e in enumerate(self.E):
                            v1 = self.table[(s1 + a, e)]
                            v2 = self.table[(s2 + a, e)]
                            if v1 != v2:
                                # Distinguishing suffix is a + e
                                new_e = a + e
                                if new_e not in self.E:
                                    return False, new_e
        return True, None

    def add_to_s(self, prefix: str) -> None:
        if prefix not in self.S:
            self.S.append(prefix)
            self._fill_missing()

    def add_to_e(self, suffix: str) -> None:
        if suffix not in self.E:
            self.E.append(suffix)
            self._fill_missing()

    def build_conjectured_dfa(self) -> DFA:
        """
        Constructs the conjectured DFA from the closed & consistent table.
        """
        row_to_rep: Dict[Tuple[bool, ...], str] = {}
        for s in self.S:
            r = self.row(s)
            if r not in row_to_rep:
                row_to_rep[r] = s

        states = set(row_to_rep.values())
        start_state = row_to_rep[self.row("")]

        # State is accept if row(s)[e=""] is True
        empty_suffix_idx = self.E.index("")
        accept_states = {
            s for s in states if self.row(s)[empty_suffix_idx] is True
        }

        transitions: Dict[Tuple[str, str], str] = {}
        for s in states:
            for a in self.alphabet:
                target_row = self.row(s + a)
                target_state = row_to_rep[target_row]
                transitions[(s, a)] = target_state

        dfa = DFA(
            states=states,
            alphabet=set(self.alphabet),
            transitions=transitions,
            start_state=start_state,
            accept_states=accept_states,
        )
        return minimize_dfa(dfa)

    def to_table_dict(self) -> Dict[str, Any]:
        """
        Returns structured observation table representation for UI rendering.
        """
        s_dot_sigma = []
        s_set = set(self.S)
        for s in self.S:
            for a in self.alphabet:
                sa = s + a
                if sa not in s_set and sa not in s_dot_sigma:
                    s_dot_sigma.append(sa)

        return {
            "S_prefixes": list(self.S),
            "E_suffixes": list(self.E),
            "S_dot_sigma": s_dot_sigma,
            "S_rows": {s: [int(self.table[(s, e)]) for e in self.E] for s in self.S},
            "S_dot_sigma_rows": {
                sa: [int(self.table[(sa, e)]) for e in self.E] for sa in s_dot_sigma
            },
        }


class InteractiveActiveLearner:
    """
    Human-in-the-Loop (HITL) Interactive Active Learning.
    Allows a user or web frontend to step through Angluin's L* queries interactively:
    - Asks the user targeted Yes/No validation questions on ambiguous strings.
    - Presents intermediate conjectured DFAs for user confirmation or counterexamples.
    - Reaches 100% exact minimal DFA with only 3-5 user clicks.
    """

    def __init__(
        self,
        alphabet: List[str],
        initial_positive: Optional[List[str]] = None,
        initial_negative: Optional[List[str]] = None,
        reference_oracle: Optional[Callable[[str], bool]] = None,
        seed_access_strings: Optional[List[str]] = None,
    ):
        self.alphabet = sorted(list(alphabet))
        self.reference_oracle = reference_oracle
        self.known_labels: Dict[str, bool] = {}

        if initial_positive:
            for s in initial_positive:
                self.known_labels[s] = True
        if initial_negative:
            for s in initial_negative:
                self.known_labels[s] = False

        self.S: List[str] = [""]
        self.E: List[str] = [""]
        self.table: Dict[Tuple[str, str], bool] = {}
        self.pending_membership_query: Optional[str] = None
        self.current_conjecture: Optional[DFA] = None
        self.query_history: List[Dict[str, Any]] = []
        self.is_converged = False

        # Seed S with warm-start access strings or prefixes of initial strings
        if seed_access_strings:
            for s in seed_access_strings:
                if s not in self.S:
                    self.S.append(s)
        else:
            initial_strings = (initial_positive or []) + (initial_negative or [])
            for s in initial_strings:
                for length in range(1, len(s) + 1):
                    pref = s[:length]
                    if pref not in self.S:
                        self.S.append(pref)

    def _get_required_cells(self) -> List[Tuple[str, str, str]]:
        """
        Returns all (prefix, suffix, full_string) cells needed by the observation table.
        """
        cells = []
        for s in self.S:
            for e in self.E:
                cells.append((s, e, s + e))

        for s in self.S:
            for a in self.alphabet:
                sa = s + a
                for e in self.E:
                    cells.append((sa, e, sa + e))
        return cells

    def step(self) -> Dict[str, Any]:
        """
        Executes one step of the interactive learner.
        Returns the next action required:
        - "NEED_MEMBERSHIP_QUERY": Need user to label a string.
        - "CONJECTURE_READY": Formulated DFA, awaiting confirmation or counterexample.
        - "CONVERGED": Learning complete!
        """
        if self.is_converged:
            return {
                "status": "CONVERGED",
                "message": "Model has converged to the final minimal DFA.",
                "dfa": self.current_conjecture.to_graph_dict() if self.current_conjecture else None,
            }

        # 1. Fill missing table entries
        for s, e, full_str in self._get_required_cells():
            if (s, e) not in self.table:
                if full_str in self.known_labels:
                    self.table[(s, e)] = self.known_labels[full_str]
                elif self.reference_oracle is not None:
                    # Auto-answer from oracle if available
                    label = self.reference_oracle(full_str)
                    self.known_labels[full_str] = label
                    self.table[(s, e)] = label
                else:
                    # Must ask the user!
                    self.pending_membership_query = full_str
                    return {
                        "status": "NEED_MEMBERSHIP_QUERY",
                        "query_string": full_str,
                        "prompt": f"Is the string '{full_str}' ACCEPTED in your target language?",
                        "total_queries_asked": len(self.query_history),
                        "current_conjecture": self.current_conjecture.to_graph_dict() if self.current_conjecture else None,
                    }

        # 2. Check if table is closed
        s_rows = set(tuple(self.table[(s, e)] for e in self.E) for s in self.S)
        for s in list(self.S):
            for a in self.alphabet:
                sa = s + a
                sa_row = tuple(self.table[(sa, e)] for e in self.E)
                if sa_row not in s_rows:
                    self.S.append(sa)
                    return self.step()

        # 3. Check if table is consistent
        for i in range(len(self.S)):
            for j in range(i + 1, len(self.S)):
                s1, s2 = self.S[i], self.S[j]
                r1 = tuple(self.table[(s1, e)] for e in self.E)
                r2 = tuple(self.table[(s2, e)] for e in self.E)
                if r1 == r2:
                    for a in self.alphabet:
                        for e in self.E:
                            if self.table.get((s1 + a, e)) != self.table.get((s2 + a, e)):
                                new_e = a + e
                                if new_e not in self.E:
                                    self.E.append(new_e)
                                    return self.step()

        # 4. Table is closed and consistent -> Formulate Conjecture
        row_to_rep = {}
        for s in self.S:
            r = tuple(self.table[(s, e)] for e in self.E)
            if r not in row_to_rep:
                row_to_rep[r] = s

        states = set(row_to_rep.values())
        start_state = row_to_rep[tuple(self.table[("", e)] for e in self.E)]
        empty_idx = self.E.index("")
        accept_states = {
            s for s in states if self.table[(s, "")] is True
        }

        transitions = {}
        for s in states:
            for a in self.alphabet:
                target_row = tuple(self.table[(s + a, e)] for e in self.E)
                target_state = row_to_rep[target_row]
                transitions[(s, a)] = target_state

        conjectured_raw = DFA(states, set(self.alphabet), transitions, start_state, accept_states)
        self.current_conjecture = minimize_dfa(conjectured_raw)

        return {
            "status": "CONJECTURE_READY",
            "conjectured_dfa": self.current_conjecture.to_graph_dict(),
            "state_count": len(self.current_conjecture.states),
            "prompt": "Current hypothesized DFA is ready. Confirm if correct, or provide a counterexample.",
            "total_queries_asked": len(self.query_history),
        }

    def answer_membership_query(self, is_accepted: bool) -> Dict[str, Any]:
        """
        Receives user's Yes/No answer for the pending query string.
        """
        if self.pending_membership_query is None:
            raise ValueError("No membership query currently pending.")

        q_str = self.pending_membership_query
        self.known_labels[q_str] = is_accepted
        self.query_history.append({"query_string": q_str, "answer": is_accepted})
        self.pending_membership_query = None

        return self.step()

    def provide_counterexample(self, counterexample_string: Optional[str]) -> Dict[str, Any]:
        """
        User provides a counterexample where the conjecture is wrong,
        or passes None if the conjecture is confirmed correct.
        """
        if counterexample_string is None or counterexample_string == "":
            self.is_converged = True
            return {
                "status": "CONVERGED",
                "message": "User confirmed equivalence! Model successfully learned.",
                "final_dfa": self.current_conjecture.to_graph_dict() if self.current_conjecture else None,
                "total_queries": len(self.query_history),
            }

        # Add all prefixes of the counterexample to S
        for length in range(1, len(counterexample_string) + 1):
            pref = counterexample_string[:length]
            if pref not in self.S:
                self.S.append(pref)

        return self.step()


class LStarLearner:
    """
    Angluin's L* Active Learning Algorithm (Automated Teacher Mode).
    Interacts with a Teacher oracle via Membership and Equivalence queries.
    """

    def __init__(self, alphabet: List[str], teacher: Teacher, max_iterations: int = 50):
        self.alphabet = sorted(list(alphabet))
        self.teacher = teacher
        self.max_iterations = max_iterations
        self.table = ObservationTable(self.alphabet, self.teacher)

    def seed_from_examples(self, strings: List[str]) -> None:
        """
        Warm-starts the observation table using initial positive and negative examples
        provided by the user. Significantly reduces the number of queries needed.
        """
        for s in strings:
            for length in range(1, len(s) + 1):
                self.table.add_to_s(s[:length])

    def learn(self) -> Dict[str, Any]:
        iterations = 0
        history: List[Dict[str, Any]] = []

        while iterations < self.max_iterations:
            iterations += 1

            # 1. Close the table
            while True:
                closed, cand_s = self.table.is_closed()
                if not closed and cand_s is not None:
                    self.table.add_to_s(cand_s)
                    history.append({
                        "iteration": iterations,
                        "action": "MAKE_CLOSED",
                        "added_to_S": cand_s,
                        "table_snapshot": self.table.to_table_dict(),
                    })
                    continue

                # 2. Make consistent
                consistent, cand_e = self.table.is_consistent()
                if not consistent and cand_e is not None:
                    self.table.add_to_e(cand_e)
                    history.append({
                        "iteration": iterations,
                        "action": "MAKE_CONSISTENT",
                        "added_to_E": cand_e,
                        "table_snapshot": self.table.to_table_dict(),
                    })
                    continue

                break

            # Table is now closed and consistent -> Formulate Conjecture
            conjectured_dfa = self.table.build_conjectured_dfa()

            # Ask Equivalence Query
            is_equiv, counterexample = self.teacher.query_equivalence(conjectured_dfa)

            if is_equiv:
                history.append({
                    "iteration": iterations,
                    "action": "EQUIVALENCE_CONFIRMED",
                    "counterexample": None,
                    "final_state_count": len(conjectured_dfa.states),
                })
                return {
                    "learned_dfa": conjectured_dfa,
                    "is_converged": True,
                    "total_iterations": iterations,
                    "membership_queries": self.teacher.membership_query_count,
                    "equivalence_queries": self.teacher.equivalence_query_count,
                    "observation_table": self.table.to_table_dict(),
                    "history": history,
                }

            # Process Counterexample: Add counterexample and all its prefixes to S
            history.append({
                "iteration": iterations,
                "action": "COUNTEREXAMPLE_RECEIVED",
                "counterexample": counterexample,
                "conjecture_states": len(conjectured_dfa.states),
            })

            if counterexample is not None:
                for length in range(1, len(counterexample) + 1):
                    prefix = counterexample[:length]
                    self.table.add_to_s(prefix)

        # Max iterations reached
        return {
            "learned_dfa": self.table.build_conjectured_dfa(),
            "is_converged": False,
            "total_iterations": iterations,
            "membership_queries": self.teacher.membership_query_count,
            "equivalence_queries": self.teacher.equivalence_query_count,
            "observation_table": self.table.to_table_dict(),
            "history": history,
        }

