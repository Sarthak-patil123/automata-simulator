import unittest
from backend.automata.learning.nfa_learning import NFALearner
from backend.automata.dataset.tomita import get_tomita_language
from backend.automata.dataset.generator import generate_dataset_from_dfa


class TestNFALearning(unittest.TestCase):

    def test_nfa_learning_consistency(self):
        lang = get_tomita_language(2)  # (10)*
        dataset = generate_dataset_from_dfa(
            dfa=lang.reference_dfa,
            num_positive=10,
            num_negative=20,
            max_length=10,
            seed=42,
        )

        learner = NFALearner(
            positive_strings=dataset.positive,
            negative_strings=dataset.negative,
            alphabet=["0", "1"],
        )
        res = learner.learn()
        inferred_nfa = res["inferred_nfa"]

        # Ensure all positive strings are accepted
        for s in dataset.positive:
            self.assertTrue(inferred_nfa.accepts(s), f"NFA failed to accept positive sample '{s}'")

        # Ensure all negative strings are rejected
        for s in dataset.negative:
            self.assertFalse(inferred_nfa.accepts(s), f"NFA erroneously accepted negative sample '{s}'")

        # Check history has steps
        self.assertGreater(len(res["history"]), 0)


if __name__ == "__main__":
    unittest.main()

