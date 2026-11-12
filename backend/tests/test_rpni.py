import unittest
from backend.automata.learning.pta import build_prefix_tree_acceptor
from backend.automata.learning.rpni import RPNILearner, rpn_learn
from backend.automata.learning.edsm import EDSMLearner
from backend.automata.dataset.tomita import get_tomita_language
from backend.automata.dataset.generator import generate_dataset_from_dfa
from backend.automata.core.operations import are_equivalent


class TestRPNIAndEDSM(unittest.TestCase):

    def test_pta_construction(self):
        positive = ["", "0", "01"]
        pta, pref_to_state, state_to_pref = build_prefix_tree_acceptor(positive, alphabet=["0", "1"])

        # Prefixes should be: "", "0", "01" -> exactly 3 states
        self.assertEqual(len(pta.states), 3)
        self.assertTrue(pta.accepts(""))
        self.assertTrue(pta.accepts("0"))
        self.assertTrue(pta.accepts("01"))

        # Negative / unseen strings rejected by PTA
        self.assertFalse(pta.accepts("1"))
        self.assertFalse(pta.accepts("00"))

    def test_rpni_learns_tomita_1(self):
        # Tomita 1: 1*
        lang = get_tomita_language(1)
        dataset = generate_dataset_from_dfa(
            dfa=lang.reference_dfa,
            num_positive=15,
            num_negative=15,
            max_length=15,
            seed=42,
        )

        learner = RPNILearner(
            positive_strings=dataset.positive,
            negative_strings=dataset.negative,
            alphabet=["0", "1"],
        )
        result = learner.learn()
        inferred_dfa = result["inferred_dfa"]

        self.assertIsNotNone(inferred_dfa)
        # Check that inferred DFA is equivalent to ground-truth Tomita 1
        is_equiv, counterexample = are_equivalent(inferred_dfa, lang.reference_dfa)
        self.assertTrue(is_equiv, f"RPNI failed on Tomita 1. Differentiating string: {counterexample}")

        # Check history was recorded for UI
        self.assertGreater(len(result["history"]), 0)
        self.assertIn("action", result["history"][0])

    def test_edsm_learns_tomita_2(self):
        # Tomita 2: (10)*
        lang = get_tomita_language(2)
        dataset = generate_dataset_from_dfa(
            dfa=lang.reference_dfa,
            num_positive=10,
            num_negative=20,
            max_length=10,
            seed=42,
        )

        learner = EDSMLearner(
            positive_strings=dataset.positive,
            negative_strings=dataset.negative,
            alphabet=["0", "1"],
        )
        result = learner.learn()
        inferred = result["inferred_dfa"]

        is_equiv, ce = are_equivalent(inferred, lang.reference_dfa)
        self.assertTrue(is_equiv, f"EDSM failed on Tomita 2. Differentiating string: {ce}")


    def test_rpni_characteristic_cover_learns_8_state_dfa(self):
        from backend.run_benchmark import build_third_from_end_dfa
        from backend.automata.dataset.generator import generate_characteristic_dataset

        dfa8 = build_third_from_end_dfa()
        dataset = generate_characteristic_dataset(dfa8)

        learner = RPNILearner(dataset.positive, dataset.negative, ["0", "1"])
        res = learner.learn()

        is_equiv, ce = are_equivalent(res["inferred_dfa"], dfa8)
        self.assertTrue(is_equiv, f"RPNI failed on 8-state DFA with characteristic cover: {ce}")
        self.assertEqual(len(res["inferred_dfa"].states), 8)


if __name__ == "__main__":
    unittest.main()

