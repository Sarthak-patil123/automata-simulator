import unittest
from backend.automata.learning.lstar import LStarLearner, Teacher
from backend.automata.dataset.tomita import get_tomita_language
from backend.automata.core.operations import are_equivalent


class TestLStar(unittest.TestCase):

    def test_lstar_on_tomita_1(self):
        lang = get_tomita_language(1)  # 1*
        teacher = Teacher(
            membership_oracle=lang.rule_fn,
            reference_dfa=lang.reference_dfa,
        )

        learner = LStarLearner(alphabet=["0", "1"], teacher=teacher)
        result = learner.learn()

        self.assertTrue(result["is_converged"])
        learned_dfa = result["learned_dfa"]

        is_equiv, ce = are_equivalent(learned_dfa, lang.reference_dfa)
        self.assertTrue(is_equiv, f"L* failed on Tomita 1. Counterexample: {ce}")
        self.assertEqual(len(learned_dfa.states), len(lang.reference_dfa.states))

    def test_lstar_on_tomita_4(self):
        # Tomita 4: Does not contain 000
        lang = get_tomita_language(4)
        teacher = Teacher(
            membership_oracle=lang.rule_fn,
            reference_dfa=lang.reference_dfa,
        )

        learner = LStarLearner(alphabet=["0", "1"], teacher=teacher)
        result = learner.learn()

        self.assertTrue(result["is_converged"])
        learned_dfa = result["learned_dfa"]

        is_equiv, ce = are_equivalent(learned_dfa, lang.reference_dfa)
        self.assertTrue(is_equiv, f"L* failed on Tomita 4. Counterexample: {ce}")

    def test_lstar_observation_table_ui_schema(self):
        lang = get_tomita_language(2)
        teacher = Teacher(
            membership_oracle=lang.rule_fn,
            reference_dfa=lang.reference_dfa,
        )
        learner = LStarLearner(alphabet=["0", "1"], teacher=teacher)
        result = learner.learn()

        obs = result["observation_table"]
        self.assertIn("S_prefixes", obs)
        self.assertIn("E_suffixes", obs)
        self.assertIn("S_rows", obs)
        self.assertIn("S_dot_sigma_rows", obs)
        self.assertIn("", obs["S_prefixes"])
        self.assertIn("", obs["E_suffixes"])


if __name__ == "__main__":
    unittest.main()

