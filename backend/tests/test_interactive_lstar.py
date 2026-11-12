import unittest
from backend.automata.learning.lstar import InteractiveActiveLearner
from backend.automata.core.operations import are_equivalent
from backend.automata.dataset.tomita import get_tomita_language
from backend.api import AutomataMLService


class TestInteractiveActiveLearner(unittest.TestCase):

    def test_interactive_turn_by_turn_convergence(self):
        # Target: Tomita 2: (10)*
        lang = get_tomita_language(2)

        # Initialize with just 2 sample strings
        session = InteractiveActiveLearner(
            alphabet=["0", "1"],
            initial_positive=["10"],
            initial_negative=["0"],
        )

        step_res = session.step()
        queries_asked = 0
        max_turns = 20

        while step_res["status"] == "NEED_MEMBERSHIP_QUERY" and queries_asked < max_turns:
            queries_asked += 1
            query_str = step_res["query_string"]
            # Ground truth answer from the language rule
            ans = lang.rule_fn(query_str)
            step_res = session.answer_membership_query(ans)

        self.assertEqual(step_res["status"], "CONJECTURE_READY")
        conjectured_dfa = session.current_conjecture

        # User confirms conjecture if equivalent, or provides counterexample
        is_eq, ce = are_equivalent(conjectured_dfa, lang.reference_dfa)
        if not is_eq:
            step_res = session.provide_counterexample(ce)
            while step_res["status"] == "NEED_MEMBERSHIP_QUERY":
                ans = lang.rule_fn(step_res["query_string"])
                step_res = session.answer_membership_query(ans)

        # Final confirm
        final_res = session.provide_counterexample(None)
        self.assertEqual(final_res["status"], "CONVERGED")
        self.assertTrue(are_equivalent(session.current_conjecture, lang.reference_dfa)[0])

    def test_service_interactive_api(self):
        service = AutomataMLService()
        lang = get_tomita_language(1)  # 1*

        # Auto-oracle mode
        res = service.start_interactive_learning(
            alphabet=["0", "1"],
            initial_positive=["1", "11"],
            initial_negative=["0"],
            preset_reference_index=1,
        )

        self.assertIn(res["status"], ["CONJECTURE_READY", "CONVERGED"])
        confirm_res = service.confirm_interactive_conjecture(None)
        self.assertEqual(confirm_res["status"], "CONVERGED")


if __name__ == "__main__":
    unittest.main()

