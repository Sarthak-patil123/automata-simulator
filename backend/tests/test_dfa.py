import unittest
from backend.automata.core.dfa import DFA


class TestDFA(unittest.TestCase):

    def setUp(self):
        # Language: Strings ending with '1' over alphabet {'0', '1'}
        # q0: start state (ends with 0 or empty)
        # q1: accept state (ends with 1)
        self.dfa = DFA(
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

    def test_acceptance(self):
        self.assertTrue(self.dfa.accepts("1"))
        self.assertTrue(self.dfa.accepts("01"))
        self.assertTrue(self.dfa.accepts("1011"))
        self.assertTrue(self.dfa.accepts("0001"))

        self.assertFalse(self.dfa.accepts(""))
        self.assertFalse(self.dfa.accepts("0"))
        self.assertFalse(self.dfa.accepts("10"))
        self.assertFalse(self.dfa.accepts("1010"))

    def test_simulation_trace_ui_contract(self):
        trace = self.dfa.simulate("01")
        self.assertTrue(trace["accepted"])
        self.assertEqual(trace["input_string"], "01")
        self.assertFalse(trace["is_stuck"])
        self.assertEqual(trace["final_state"], "q1")

        steps = trace["execution_steps"]
        # Step 0: Initial
        self.assertEqual(steps[0]["step"], 0)
        self.assertIsNone(steps[0]["consumed_symbol"])
        self.assertEqual(steps[0]["active_states"], ["q0"])
        self.assertEqual(steps[0]["remaining_tape"], "01")

        # Step 1: Consumed '0'
        self.assertEqual(steps[1]["consumed_symbol"], "0")
        self.assertEqual(steps[1]["active_states"], ["q0"])
        self.assertEqual(steps[1]["traversed_edge_ids"], ["e_q0_q0_0"])
        self.assertEqual(steps[1]["remaining_tape"], "1")

        # Step 2: Consumed '1'
        self.assertEqual(steps[2]["consumed_symbol"], "1")
        self.assertEqual(steps[2]["active_states"], ["q1"])
        self.assertEqual(steps[2]["traversed_edge_ids"], ["e_q0_q1_1"])
        self.assertEqual(steps[2]["remaining_tape"], "")

    def test_graph_serialization_for_ui(self):
        graph = self.dfa.to_graph_dict()
        self.assertEqual(graph["automaton_type"], "DFA")
        self.assertEqual(graph["alphabet"], ["0", "1"])
        self.assertEqual(graph["initial_state"], "q0")
        self.assertEqual(graph["accepting_states"], ["q1"])

        node_ids = {n["id"] for n in graph["nodes"]}
        self.assertEqual(node_ids, {"q0", "q1"})

        # Check node flags
        q0_node = next(n for n in graph["nodes"] if n["id"] == "q0")
        self.assertTrue(q0_node["is_initial"])
        self.assertFalse(q0_node["is_accepting"])

        q1_node = next(n for n in graph["nodes"] if n["id"] == "q1")
        self.assertFalse(q1_node["is_initial"])
        self.assertTrue(q1_node["is_accepting"])

        self.assertEqual(len(graph["edges"]), 4)


if __name__ == "__main__":
    unittest.main()

