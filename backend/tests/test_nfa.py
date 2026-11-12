import unittest
from backend.automata.core.nfa import NFA


class TestNFA(unittest.TestCase):

    def setUp(self):
        # NFA for language: Strings containing substring 'ab'
        # q0: start state, self loop on a, b; transition on 'a' to q1
        # q1: transition on 'b' to q2
        # q2: accept state, self loop on a, b
        self.nfa = NFA(
            states={"q0", "q1", "q2"},
            alphabet={"a", "b"},
            transitions={
                ("q0", "a"): {"q0", "q1"},
                ("q0", "b"): {"q0"},
                ("q1", "b"): {"q2"},
                ("q2", "a"): {"q2"},
                ("q2", "b"): {"q2"},
            },
            start_state="q0",
            accept_states={"q2"},
        )

    def test_nfa_acceptance(self):
        self.assertTrue(self.nfa.accepts("ab"))
        self.assertTrue(self.nfa.accepts("aab"))
        self.assertTrue(self.nfa.accepts("baba"))
        self.assertTrue(self.nfa.accepts("bbbbab"))

        self.assertFalse(self.nfa.accepts(""))
        self.assertFalse(self.nfa.accepts("a"))
        self.assertFalse(self.nfa.accepts("b"))
        self.assertFalse(self.nfa.accepts("ba"))
        self.assertFalse(self.nfa.accepts("bbaaa"))

    def test_epsilon_transitions(self):
        # NFA with epsilon transition: accepts "a" or "b"
        # q0 -eps-> q1 -a-> q2 (accept)
        # q0 -eps-> q3 -b-> q4 (accept)
        eps_nfa = NFA(
            states={"q0", "q1", "q2", "q3", "q4"},
            alphabet={"a", "b"},
            transitions={
                ("q0", "ε"): {"q1", "q3"},
                ("q1", "a"): {"q2"},
                ("q3", "b"): {"q4"},
            },
            start_state="q0",
            accept_states={"q2", "q4"},
        )

        closure_q0 = eps_nfa.epsilon_closure({"q0"})
        self.assertEqual(closure_q0, {"q0", "q1", "q3"})

        self.assertTrue(eps_nfa.accepts("a"))
        self.assertTrue(eps_nfa.accepts("b"))
        self.assertFalse(eps_nfa.accepts(""))
        self.assertFalse(eps_nfa.accepts("ab"))
        self.assertFalse(eps_nfa.accepts("ba"))

    def test_subset_construction_to_dfa(self):
        # Convert the 'contains ab' NFA to DFA
        dfa = self.nfa.to_dfa()

        test_strings = [
            ("ab", True),
            ("aab", True),
            ("baba", True),
            ("bbbbab", True),
            ("", False),
            ("a", False),
            ("b", False),
            ("ba", False),
            ("bbaaa", False),
        ]

        for s, expected in test_strings:
            self.assertEqual(
                dfa.accepts(s),
                expected,
                f"DFA conversion mismatch on string '{s}'",
            )


if __name__ == "__main__":
    unittest.main()

