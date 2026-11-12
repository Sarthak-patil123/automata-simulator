import unittest
from backend.automata.learning.sat_dfa import PureDPLL, SATDFALearner
from backend.automata.core.dfa import DFA
from backend.automata.core.operations import minimize_dfa
from backend.automata.serializers.schema import format_graph_payload
from backend.api import AutomataMLService


class TestPureDPLL(unittest.TestCase):

    def test_dpll_simple_satisfiable(self):
        # (x1 or x2) and (not x1 or x2) -> x2 must be True
        cnf = [[1, 2], [-1, 2]]
        model = PureDPLL(cnf).solve()
        self.assertIsNotNone(model)
        self.assertIn(2, model)
        self.assertTrue(model[2])

    def test_dpll_simple_unsatisfiable(self):
        # (x1) and (not x1)
        cnf = [[1], [-1]]
        model = PureDPLL(cnf).solve()
        self.assertIsNone(model)

    def test_dpll_empty_clause(self):
        # CNF containing an empty clause is trivially unsat
        cnf = [[1, 2], []]
        model = PureDPLL(cnf).solve()
        self.assertIsNone(model)

    def test_dpll_empty_formula(self):
        # Empty CNF is trivially satisfiable
        cnf = []
        model = PureDPLL(cnf).solve()
        self.assertIsNotNone(model)


class TestSATDFALearner(unittest.TestCase):

    def test_learns_ends_with_01(self):
        pos = ["01", "001", "101", "0101"]
        neg = ["", "0", "1", "10", "11", "010"]
        learner = SATDFALearner(pos, neg, alphabet=["0", "1"], timeout_sec=3.0)
        res = learner.learn(max_states=6)

        self.assertIsNotNone(res)
        dfa = res["inferred_dfa"]
        self.assertIsInstance(dfa, DFA)
        # Should need exactly 3 states for "ends with 01"
        self.assertEqual(len(dfa.states), 3)

        for p in pos:
            self.assertTrue(dfa.accepts(p), f"Should accept positive string '{p}'")
        for n in neg:
            self.assertFalse(dfa.accepts(n), f"Should reject negative string '{n}'")

        # Confidence dictionary check
        self.assertIsInstance(dfa.transition_confidence, dict)
        self.assertIn("direct", dfa.transition_confidence.values())

    def test_learns_even_zeros_and_ones(self):
        pos = ["", "00", "11", "0101", "1010", "0011"]
        neg = ["0", "1", "000", "111", "01", "10", "011", "100"]
        learner = SATDFALearner(pos, neg, alphabet=["0", "1"], timeout_sec=5.0)
        res = learner.learn(max_states=6)

        self.assertIsNotNone(res)
        dfa = res["inferred_dfa"]
        self.assertEqual(len(dfa.states), 4)

        for p in pos:
            self.assertTrue(dfa.accepts(p))
        for n in neg:
            self.assertFalse(dfa.accepts(n))

    def test_transition_confidence_preserved_in_operations(self):
        pos = ["01"]
        neg = ["0", "1"]
        learner = SATDFALearner(pos, neg, alphabet=["0", "1"])
        res = learner.learn(max_states=4)
        dfa = res["inferred_dfa"]

        # Ensure canonicalize preserves transition_confidence
        canonical = dfa.canonicalize()
        self.assertTrue(hasattr(canonical, "transition_confidence"))
        self.assertEqual(len(canonical.transition_confidence), len(dfa.transition_confidence))

        # Ensure minimize preserves transition_confidence
        minimized = minimize_dfa(dfa)
        self.assertTrue(hasattr(minimized, "transition_confidence"))
        self.assertGreater(len(minimized.transition_confidence), 0)

        # Ensure schema serialization formats confidence correctly
        payload = format_graph_payload(dfa)
        self.assertIn("edges", payload)
        self.assertGreater(len(payload["edges"]), 0)
        first_edge = payload["edges"][0]
        self.assertIn("confidence", first_edge)
        self.assertIn("is_completed", first_edge)


class TestCounterexampleActiveOracle(unittest.TestCase):

    def setUp(self):
        self.service = AutomataMLService()

    def test_hitl_counterexample_incorporation(self):
        session_id = "test_counterexample_oracle"

        # Initial small sample (language: contains '0')
        pos = ["0", "00", "01"]
        neg = ["1", "11"]
        alphabet = ["0", "1"]

        train_res = self.service.train_model(
            session_id=session_id,
            model_type="dfa",
            positive_strings=pos,
            negative_strings=neg,
            alphabet=alphabet,
        )
        self.assertTrue(train_res.get("needs_hitl"))
        self.assertIn("Exact SAT", train_res.get("inference_engine", ""))

        # Provide counterexample "10", which contains '0' and should be ACCEPTED
        hitl_res = self.service.confirm_hitl_conjecture(
            session_id=session_id,
            counterexample="10",
            expected_label=True,
        )
        self.assertIn(hitl_res.get("hitl_status"), ["CONJECTURE_READY", "CONVERGED"])
        self.assertIn("message", hitl_res)
        self.assertIn("Incorporated counterexample", hitl_res["message"])

        # Check that the new conjectured or final graph is present
        new_graph = hitl_res.get("conjectured_graph") or hitl_res.get("final_graph")
        self.assertIsNotNone(new_graph)

        # Further confirm with counterexample "111", should be REJECTED
        hitl_res2 = self.service.confirm_hitl_conjecture(
            session_id=session_id,
            counterexample="111",
            expected_label=False,
        )
        self.assertIn("Incorporated counterexample", hitl_res2["message"])


if __name__ == "__main__":
    unittest.main()
