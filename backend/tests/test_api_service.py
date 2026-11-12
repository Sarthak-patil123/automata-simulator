import unittest
from backend.api import AutomataMLService


class TestAutomataMLService(unittest.TestCase):

    def setUp(self):
        self.service = AutomataMLService()

    def test_get_presets(self):
        presets = self.service.get_preset_languages()
        self.assertEqual(len(presets), 7)
        first = presets[0]
        self.assertEqual(first["name"], "Tomita 1")
        self.assertIn("graph", first)
        self.assertIn("nodes", first["graph"])
        self.assertIn("edges", first["graph"])

    def test_generate_data(self):
        data = self.service.generate_data(
            preset_index=4,
            num_positive=20,
            num_negative=20,
            max_length=6,
            noise_rate=0.1,
            seed=42,
        )
        self.assertEqual(data["preset_index"], 4)
        self.assertEqual(data["noise_rate"], 0.1)
        self.assertIn("train_set", data)
        self.assertIn("test_set", data)

    def test_end_to_end_rpni_pipeline(self):
        # 1. Generate data
        data = self.service.generate_data(preset_index=1, num_positive=15, num_negative=15, max_length=15, seed=42)
        train_pos = data["train_set"]["positive"]
        train_neg = data["train_set"]["negative"]

        # 2. Train model
        train_res = self.service.train_model(
            positive_strings=train_pos,
            negative_strings=train_neg,
            algorithm="rpni",
            preset_reference_index=1,
        )

        self.assertEqual(train_res["algorithm"], "rpni")
        self.assertIn("inferred_graph", train_res)
        self.assertIn("pta_graph", train_res)
        self.assertIn("history", train_res)
        self.assertIn("metrics", train_res)
        self.assertIn("equivalence", train_res)
        self.assertTrue(train_res["equivalence"]["is_exact_equivalent"])

        # 3. Simulate string
        trace = self.service.simulate("111")
        self.assertTrue(trace["accepted"])
        self.assertEqual(trace["num_steps"], 4)

        neg_trace = self.service.simulate("101")
        self.assertFalse(neg_trace["accepted"])

    def test_end_to_end_lstar_pipeline(self):
        train_res = self.service.train_model(
            positive_strings=[],
            negative_strings=[],
            alphabet=["0", "1"],
            algorithm="lstar",
            preset_reference_index=2,
        )
        self.assertEqual(train_res["algorithm"], "lstar")
        self.assertTrue(train_res["extra"]["is_converged"])
        self.assertTrue(train_res["equivalence"]["is_exact_equivalent"])

        # Check observation table was produced
        obs = train_res["extra"]["observation_table"]
        self.assertIn("S_prefixes", obs)
        self.assertIn("E_suffixes", obs)

    def test_end_to_end_nfa_pipeline(self):
        data = self.service.generate_data(preset_index=2, num_positive=10, num_negative=15, max_length=8, seed=42)
        train_res = self.service.train_model(
            positive_strings=data["train_set"]["positive"],
            negative_strings=data["train_set"]["negative"],
            algorithm="nfa",
            preset_reference_index=2,
        )
        self.assertEqual(train_res["algorithm"], "nfa")
        self.assertEqual(train_res["inferred_graph"]["automaton_type"], "NFA")

    def test_ablation_endpoints(self):
        size_ablation = self.service.run_ablation(preset_index=4, study_type="sample_size")
        self.assertEqual(size_ablation["x_axis"], "sample_size")
        self.assertGreater(len(size_ablation["data"]), 0)

        noise_ablation = self.service.run_ablation(preset_index=4, study_type="noise")
        self.assertEqual(noise_ablation["x_axis"], "noise_percentage")
        self.assertGreater(len(noise_ablation["data"]), 0)


if __name__ == "__main__":
    unittest.main()

