import unittest
from backend.automata.core.dfa import DFA
from backend.automata.core.operations import (
    minimize_dfa,
    complement_dfa,
    intersect_dfas,
    union_dfas,
    are_equivalent,
)


class TestOperations(unittest.TestCase):

    def test_hopcroft_minimization(self):
        # Redundant DFA: accepts strings with even number of 'a's over alphabet {'a'}
        # Built with 4 states: q0 (even), q1 (odd), q2 (even - redundant), q3 (odd - redundant)
        redundant_dfa = DFA(
            states={"q0", "q1", "q2", "q3"},
            alphabet={"a"},
            transitions={
                ("q0", "a"): "q1",
                ("q1", "a"): "q2",
                ("q2", "a"): "q3",
                ("q3", "a"): "q0",
            },
            start_state="q0",
            accept_states={"q0", "q2"},
        )

        minimized = minimize_dfa(redundant_dfa)
        # The minimal DFA for even number of 'a's has exactly 2 states!
        self.assertEqual(len(minimized.states), 2)

        # Check equivalence across sample strings
        for i in range(10):
            s = "a" * i
            self.assertEqual(minimized.accepts(s), (i % 2 == 0))

    def test_equivalence_and_counterexample(self):
        # DFA 1: Ends with '1'
        dfa1 = DFA(
            states={"q0", "q1"},
            alphabet={"0", "1"},
            transitions={
                ("q0", "0"): "q0",
                ("q0", "1"): "q1",
                ("q1", "0"): "q0",
                ("q1", "1"): "q1",
            },
            start_state="q0",
            accept_states={"q1"},
        )

        # DFA 2: Same language, but isomorphic / redundant naming
        dfa2 = DFA(
            states={"s0", "s1"},
            alphabet={"0", "1"},
            transitions={
                ("s0", "0"): "s0",
                ("s0", "1"): "s1",
                ("s1", "0"): "s0",
                ("s1", "1"): "s1",
            },
            start_state="s0",
            accept_states={"s1"},
        )

        is_eq, ce = are_equivalent(dfa1, dfa2)
        self.assertTrue(is_eq)
        self.assertIsNone(ce)

        # DFA 3: Accepts strings with AT LEAST ONE '1' (different language)
        dfa3 = DFA(
            states={"p0", "p1"},
            alphabet={"0", "1"},
            transitions={
                ("p0", "0"): "p0",
                ("p0", "1"): "p1",
                ("p1", "0"): "p1",
                ("p1", "1"): "p1",
            },
            start_state="p0",
            accept_states={"p1"},
        )

        is_eq_diff, counterexample = are_equivalent(dfa1, dfa3)
        self.assertFalse(is_eq_diff)
        self.assertIsNotNone(counterexample)
        # DFA1 and DFA3 must give opposite answers on the counterexample!
        self.assertNotEqual(
            dfa1.accepts(counterexample),
            dfa3.accepts(counterexample),
            f"Counterexample '{counterexample}' did not distinguish the DFAs!",
        )

    def test_complement(self):
        # Language: Ends with 1
        dfa = DFA(
            states={"q0", "q1"},
            alphabet={"0", "1"},
            transitions={
                ("q0", "0"): "q0",
                ("q0", "1"): "q1",
                ("q1", "0"): "q0",
                ("q1", "1"): "q1",
            },
            start_state="q0",
            accept_states={"q1"},
        )
        comp = complement_dfa(dfa)
        # Complement should accept strings that DO NOT end with 1
        self.assertTrue(comp.accepts(""))
        self.assertTrue(comp.accepts("0"))
        self.assertTrue(comp.accepts("10"))
        self.assertFalse(comp.accepts("1"))
        self.assertFalse(comp.accepts("01"))


if __name__ == "__main__":
    unittest.main()

