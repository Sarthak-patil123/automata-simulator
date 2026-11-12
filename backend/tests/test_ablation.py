import unittest
from backend.automata.evaluation.metrics import evaluate_automaton, evaluate_generalization
from backend.automata.evaluation.ablation import run_sample_size_ablation, run_noise_ablation
from backend.automata.dataset.tomita import get_tomita_language
from backend.automata.dataset.generator import Dataset


class TestEvaluationAndAblation(unittest.TestCase):

    def test_metrics_calculation(self):
        lang = get_tomita_language(1)  # 1*
        # Model that accepts only strings of 1s
        model = lang.reference_dfa

        test_data = Dataset(
            positive=["1", "11", "111"],
            negative=["0", "01", "10"],
            alphabet=["0", "1"],
        )

        metrics = evaluate_automaton(model, test_data)
        self.assertEqual(metrics["total_samples"], 6)
        self.assertEqual(metrics["accuracy"], 1.0)
        self.assertEqual(metrics["precision"], 1.0)
        self.assertEqual(metrics["recall"], 1.0)
        self.assertEqual(metrics["f1_score"], 1.0)
        self.assertEqual(metrics["confusion_matrix"]["true_positive"], 3)
        self.assertEqual(metrics["confusion_matrix"]["true_negative"], 3)
        self.assertEqual(metrics["confusion_matrix"]["false_positive"], 0)
        self.assertEqual(metrics["confusion_matrix"]["false_negative"], 0)

    def test_sample_size_ablation_output_structure(self):
        lang = get_tomita_language(4)  # No 000
        results = run_sample_size_ablation(
            reference_dfa=lang.reference_dfa,
            alphabet=["0", "1"],
            sample_sizes=[10, 20],
            max_length=6,
            seed=42,
        )

        self.assertEqual(len(results), 2)
        for row in results:
            self.assertIn("sample_size", row)
            self.assertIn("inferred_state_count", row)
            self.assertIn("train_accuracy", row)
            self.assertIn("test_accuracy", row)
            self.assertIn("is_exact_equivalent", row)

    def test_noise_ablation_output_structure(self):
        lang = get_tomita_language(4)
        results = run_noise_ablation(
            reference_dfa=lang.reference_dfa,
            alphabet=["0", "1"],
            sample_size=30,
            noise_rates=[0.0, 0.1],
            max_length=6,
            seed=42,
        )

        self.assertEqual(len(results), 2)
        for row in results:
            self.assertIn("noise_rate", row)
            self.assertIn("inferred_state_count", row)
            self.assertIn("test_accuracy", row)


if __name__ == "__main__":
    unittest.main()

