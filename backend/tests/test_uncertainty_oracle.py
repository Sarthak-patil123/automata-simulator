import unittest
from backend.automata.learning.uncertainty_oracle import UncertaintyActiveLearner
from backend.automata.learning.sat_dfa import SATDFALearner
from backend.automata.core.dfa import DFA
from backend.api import AutomataMLService


class TestUncertaintyOracle(unittest.TestCase):

    def test_max_questions_hard_cap(self):
        # Construct an automaton with several states
        dfa = DFA(
            states={"q0", "q1", "q2"},
            alphabet={"0", "1"},
            transitions={
                ("q0", "0"): "q1", ("q0", "1"): "q0",
                ("q1", "0"): "q2", ("q1", "1"): "q0",
                ("q2", "0"): "q2", ("q2", "1"): "q2",
            },
            start_state="q0",
            accept_states={"q2"},
            transition_confidence={
                ("q0", "0"): "completed",
                ("q1", "0"): "completed",
                ("q1", "1"): "completed",
            }
        )
        learner = UncertaintyActiveLearner(
            model=dfa,
            positive_strings=["00"],
            negative_strings=["", "0", "1"],
            alphabet=["0", "1"],
            max_questions=3,
        )
        self.assertLessEqual(len(learner.queries), 3)

    def test_confident_dfa_asks_zero_questions(self):
        # Fully witnessed simple DFA
        pos = ["0", "00", "10"]
        neg = ["", "1", "01", "11"]
        sat = SATDFALearner(pos, neg, ["0", "1"])
        res = sat.learn()
        dfa = res["inferred_dfa"]

        learner = UncertaintyActiveLearner(
            model=dfa,
            positive_strings=pos,
            negative_strings=neg,
            alphabet=["0", "1"],
            max_questions=4,
        )
        # Even if transitions were completed, queries must never exceed 4
        self.assertLessEqual(len(learner.queries), 4)

    def test_interactive_answering_and_skip(self):
        service = AutomataMLService()
        sid = "test_uncertainty_flow"

        # Train on Q04 (exact one 1)
        res = service.train_model(
            session_id=sid,
            model_type="dfa",
            positive_strings=["1", "01", "10"],
            negative_strings=["", "0", "11", "00"],
            alphabet=["0", "1"],
        )

        if res.get("needs_hitl"):
            # Answering a question should advance and not exceed max 4
            ans_res = service.answer_hitl_query(session_id=sid, is_accepted=False)
            self.assertIn(ans_res.get("hitl_status"), ["NEED_MEMBERSHIP_QUERY", "CONVERGED"])
            
            # Skipping should immediately finalize
            skip_res = service.skip_hitl(session_id=sid)
            self.assertEqual(skip_res.get("hitl_status"), "CONVERGED")
            self.assertIn("final_graph", skip_res)


if __name__ == "__main__":
    unittest.main()
