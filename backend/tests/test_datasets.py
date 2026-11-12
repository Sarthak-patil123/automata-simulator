import unittest
from backend.automata.dataset.tomita import get_tomita_language, list_tomita_languages
from backend.automata.dataset.generator import (
    generate_exhaustive_strings,
    generate_dataset_from_dfa,
    inject_noise,
)


class TestDatasets(unittest.TestCase):

    def test_all_seven_tomita_languages_consistency(self):
        """
        Verify that for all 7 Tomita languages, the reference DFA accepts
        the EXACT same set of strings as the rule_fn for all strings up to length 6.
        """
        alphabet = ["0", "1"]
        test_strings = generate_exhaustive_strings(alphabet, max_length=6)
        self.assertEqual(len(test_strings), 127)  # sum(2^i for i in 0..6)

        for i in range(1, 8):
            lang = get_tomita_language(i)
            for s in test_strings:
                rule_val = lang.rule_fn(s)
                dfa_val = lang.reference_dfa.accepts(s)
                self.assertEqual(
                    rule_val,
                    dfa_val,
                    f"Tomita {i} ({lang.name}) discrepancy on string '{s}': rule={rule_val}, dfa={dfa_val}",
                )

    def test_list_tomita_languages(self):
        langs = list_tomita_languages()
        self.assertEqual(len(langs), 7)
        indices = [l["index"] for l in langs]
        self.assertEqual(indices, [1, 2, 3, 4, 5, 6, 7])

    def test_balanced_dataset_generation(self):
        lang = get_tomita_language(4)  # Strings not containing 000
        dataset = generate_dataset_from_dfa(
            dfa=lang.reference_dfa,
            num_positive=20,
            num_negative=20,
            max_length=6,
            seed=42,
        )

        self.assertEqual(dataset.positive_count, 20)
        self.assertEqual(dataset.negative_count, 20)
        self.assertEqual(dataset.size, 40)

        # Ensure ground truth matches
        for s in dataset.positive:
            self.assertTrue(lang.reference_dfa.accepts(s))
        for s in dataset.negative:
            self.assertFalse(lang.reference_dfa.accepts(s))

    def test_stratified_train_test_split(self):
        lang = get_tomita_language(4)
        dataset = generate_dataset_from_dfa(
            dfa=lang.reference_dfa,
            num_positive=30,
            num_negative=30,
            max_length=7,
            seed=42,
        )

        train, test = dataset.train_test_split(test_ratio=0.2, seed=42)
        self.assertEqual(train.positive_count + test.positive_count, 30)
        self.assertEqual(train.negative_count + test.negative_count, 30)
        # Check no overlap
        self.assertEqual(set(train.positive) & set(test.positive), set())
        self.assertEqual(set(train.negative) & set(test.negative), set())

    def test_noise_injection(self):
        lang = get_tomita_language(4)  # Language with dense positive & negative strings
        dataset = generate_dataset_from_dfa(
            dfa=lang.reference_dfa,
            num_positive=25,
            num_negative=25,
            max_length=6,
            seed=42,
        )

        self.assertEqual(dataset.size, 50)
        noisy = inject_noise(dataset, noise_rate=0.2, seed=42)
        self.assertEqual(noisy.metadata["noise_rate"], 0.2)
        # 20% of 50 is 10 flipped samples
        self.assertEqual(noisy.metadata["flipped_count"], 10)


if __name__ == "__main__":
    unittest.main()
