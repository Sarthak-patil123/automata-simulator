from __future__ import annotations
from typing import Dict, List, Optional, Any, Union
from collections import deque
from .automata.core.dfa import DFA
from .automata.core.nfa import NFA
from .automata.core.operations import are_equivalent, minimize_dfa
from .automata.dataset.tomita import get_tomita_language, list_tomita_languages
from .automata.dataset.preprocessor import preprocess_csv_content
from .automata.dataset.generator import (
    Dataset,
    generate_dataset_from_dfa,
    generate_characteristic_dataset,
    inject_noise,
)
from .automata.learning.rpni import RPNILearner
from .automata.learning.edsm import EDSMLearner
from .automata.learning.sat_dfa import SATDFALearner
from .automata.learning.lstar import LStarLearner, Teacher, InteractiveActiveLearner
from .automata.learning.nfa_learning import NFALearner
from .automata.evaluation.metrics import evaluate_automaton
from .automata.evaluation.ablation import run_sample_size_ablation, run_noise_ablation
from .automata.serializers.schema import (
    format_graph_payload,
    format_simulation_trace,
    format_ablation_payload,
)


class AutomataMLService:
    """
    Unified high-level API Service for Automata Learning, Testing & Visualization.
    Uses L* with Human-in-the-Loop (HITL) active learning as the primary DFA inference
    algorithm, with RPNI as an internal warm-start. Session-isolated via session_id.
    """

    def __init__(self):
        # session_id -> {"learner": InteractiveActiveLearner|None, "model": DFA|NFA|None,
        #                "positive": list, "negative": list, "alphabet": list}
        self._sessions: Dict[str, Dict] = {}
        self._current_model: Optional[Union[DFA, NFA]] = None
        self._interactive_session: Optional[InteractiveActiveLearner] = None

    # ------------------------------------------------------------------
    # Session management
    # ------------------------------------------------------------------

    def _get_or_create_session(self, session_id: Optional[str] = None) -> Dict:
        sid = session_id or "default"
        if sid not in self._sessions:
            self._sessions[sid] = {
                "learner": None,
                "model": self._current_model,
                "positive": [],
                "negative": [],
                "alphabet": [],
            }
        return self._sessions[sid]

    # ------------------------------------------------------------------
    # Dataset helpers
    # ------------------------------------------------------------------

    def preprocess_csv(self, csv_text: str) -> Dict[str, Any]:
        """
        Parses raw CSV content into sanitized positive/negative strings and extracts alphabet.
        Adds a data_quality_warning if the sample count looks sparse.
        """
        result = preprocess_csv_content(csv_text)
        positive = result.get("positive_strings", [])
        negative = result.get("negative_strings", [])
        alphabet = result.get("alphabet", [])
        total_samples = len(positive) + len(negative)
        threshold = max(15, len(alphabet) * 8)
        if total_samples < threshold:
            result["data_quality_warning"] = (
                f"Dataset may be too sparse ({total_samples} samples for alphabet size "
                f"{len(alphabet)}). Consider providing at least {threshold} samples for "
                f"reliable DFA inference."
            )
        else:
            result["data_quality_warning"] = None
        return result

    def get_preset_languages(self) -> List[Dict[str, Any]]:
        """
        Returns all 7 Tomita benchmark regular languages with reference graph payloads.
        """
        presets = []
        for meta in list_tomita_languages():
            lang = get_tomita_language(meta["index"])
            presets.append({
                **meta,
                "graph": format_graph_payload(lang.reference_dfa, name=lang.name),
            })
        return presets

    def generate_data(
        self,
        preset_index: int,
        num_positive: int = 30,
        num_negative: int = 30,
        max_length: int = 10,
        noise_rate: float = 0.0,
        sampling_strategy: str = "random",
        seed: Optional[int] = 42,
    ) -> Dict[str, Any]:
        """
        Generates labeled training and test sets from a benchmark grammar with optional noise.
        """
        lang = get_tomita_language(preset_index)

        if sampling_strategy == "characteristic":
            raw_dataset = generate_characteristic_dataset(dfa=lang.reference_dfa)
        else:
            raw_dataset = generate_dataset_from_dfa(
                dfa=lang.reference_dfa,
                num_positive=num_positive,
                num_negative=num_negative,
                max_length=max_length,
                seed=seed,
            )

        if noise_rate > 0.0:
            dataset = inject_noise(raw_dataset, noise_rate=noise_rate, seed=seed)
        else:
            dataset = raw_dataset

        train_set, test_set = dataset.train_test_split(test_ratio=0.25, seed=seed)

        return {
            "preset_index": preset_index,
            "language_name": lang.name,
            "alphabet": dataset.alphabet,
            "noise_rate": noise_rate,
            "sampling_strategy": sampling_strategy,
            "train_set": train_set.to_dict(),
            "test_set": test_set.to_dict(),
        }

    # ------------------------------------------------------------------
    # Training
    # ------------------------------------------------------------------

    def train_model(
        self,
        positive_strings: Optional[List[str]] = None,
        negative_strings: Optional[List[str]] = None,
        alphabet: Optional[List[str]] = None,
        model_type: Optional[str] = None,
        session_id: Optional[str] = None,
        algorithm: Optional[str] = None,
        preset_reference_index: Optional[int] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        """
        Main training entry point.
        Supports both the new active-learning/HITL session API and legacy benchmark calls.
        """
        pos_strings = list(positive_strings) if positive_strings is not None else []
        neg_strings = list(negative_strings) if negative_strings is not None else []

        if alphabet is None or len(alphabet) == 0:
            all_chars = set("".join(pos_strings + neg_strings))
            alphabet = sorted(list(all_chars)) if all_chars else ["0", "1"]

        # --- Legacy Benchmark / Algorithm Mode ---
        if algorithm is not None or preset_reference_index is not None:
            ref_dfa = None
            if preset_reference_index is not None:
                ref_dfa = get_tomita_language(preset_reference_index).reference_dfa

            algo = (algorithm or "rpni").lower()
            if algo == "lstar":
                if ref_dfa is None:
                    raise ValueError("L* active learning requires a reference oracle or preset index.")
                teacher = Teacher(membership_oracle=ref_dfa.accepts, reference_dfa=ref_dfa)
                learner = LStarLearner(alphabet=alphabet, teacher=teacher)
                if pos_strings or neg_strings:
                    learner.seed_from_examples(pos_strings + neg_strings)
                res = learner.learn()
                inferred_automaton = res["learned_dfa"]
                history = res["history"]
                extra = {
                    "membership_queries": res["membership_queries"],
                    "equivalence_queries": res["equivalence_queries"],
                    "observation_table": res["observation_table"],
                    "is_converged": res["is_converged"],
                }
                pta_graph = None

            elif algo == "edsm":
                edsm_learner = EDSMLearner(pos_strings, neg_strings, alphabet)
                res = edsm_learner.learn()
                inferred_automaton = res["inferred_dfa"]
                history = res["history"]
                extra = {"total_merge_steps": res["num_steps"]}
                pta_graph = format_graph_payload(res["pta_dfa"], name="Prefix Tree Acceptor")

            elif algo == "nfa":
                nfa_learner = NFALearner(pos_strings, neg_strings, alphabet)
                res = nfa_learner.learn()
                inferred_automaton = res["inferred_nfa"]
                history = res["history"]
                extra = {
                    "total_merge_steps": res["num_steps"],
                    "equivalent_dfa_states": len(res["equivalent_dfa"].states),
                }
                pta_graph = None

            else:  # default rpni
                rpni_learner = RPNILearner(pos_strings, neg_strings, alphabet)
                res = rpni_learner.learn()
                inferred_automaton = res["inferred_dfa"]
                history = res["history"]
                extra = {"total_merge_steps": res["num_steps"]}
                pta_graph = format_graph_payload(res["pta_dfa"], name="Prefix Tree Acceptor")

            self._current_model = inferred_automaton
            sid = session_id or "default"
            session = self._get_or_create_session(sid)
            session["model"] = inferred_automaton

            train_data = Dataset(pos_strings, neg_strings, alphabet)
            train_eval = evaluate_automaton(inferred_automaton, train_data)

            equivalence_report = None
            if ref_dfa is not None:
                model_dfa = (
                    inferred_automaton
                    if isinstance(inferred_automaton, DFA)
                    else inferred_automaton.to_dfa()
                )
                is_eq, ce = are_equivalent(model_dfa, ref_dfa)
                equivalence_report = {
                    "is_exact_equivalent": is_eq,
                    "shortest_counterexample": ce,
                    "reference_states": len(ref_dfa.states),
                    "inferred_states": len(inferred_automaton.states),
                }

            return {
                "algorithm": algo,
                "inferred_graph": format_graph_payload(
                    inferred_automaton, name=f"Inferred {algo.upper()}"
                ),
                "pta_graph": pta_graph,
                "history": history,
                "metrics": train_eval,
                "equivalence": equivalence_report,
                "extra": extra,
            }

        # --- Active Learning / HITL Web Application Flow ---
        sid = session_id or "default"
        session = self._get_or_create_session(sid)
        session["positive"] = list(pos_strings)
        session["negative"] = list(neg_strings)
        session["alphabet"] = list(alphabet)

        m_type = (model_type or "dfa").lower()

        if m_type == "nfa":
            nfa_learner = NFALearner(pos_strings, neg_strings, alphabet)
            result = nfa_learner.learn()
            inferred_nfa = result["inferred_nfa"]
            session["model"] = inferred_nfa
            session["learner"] = None
            self._current_model = inferred_nfa

            graph = format_graph_payload(inferred_nfa, name="NFA")
            metrics = evaluate_automaton(
                inferred_nfa, Dataset(pos_strings, neg_strings, alphabet)
            )
            return {
                "session_id": sid,
                "needs_hitl": False,
                "graph": graph,
                "metrics": metrics,
            }

        else:
            # DFA path: Exact SAT synthesis for small datasets, or RPNI warm-start then L* HITL
            total_samples = len(pos_strings) + len(neg_strings)
            first_pass_dfa = None
            inference_engine = "RPNI (State-Merging)"

            if total_samples <= 25 and len(pos_strings) > 0 and len(neg_strings) > 0:
                try:
                    sat_learner = SATDFALearner(pos_strings, neg_strings, alphabet, timeout_sec=2.0)
                    sat_res = sat_learner.learn(max_states=8)
                    if sat_res is not None:
                        first_pass_dfa = sat_res["inferred_dfa"]
                        inference_engine = f"Exact SAT (Biermann-Feldman, k={sat_res['k']})"
                except Exception:
                    first_pass_dfa = None

            if first_pass_dfa is None:
                rpni_learner = RPNILearner(pos_strings, neg_strings, alphabet)
                rpni_result = rpni_learner.learn()
                first_pass_dfa = rpni_result["inferred_dfa"]

            session["model"] = first_pass_dfa
            self._current_model = first_pass_dfa

            first_pass_graph = format_graph_payload(first_pass_dfa, name="DFA (Initial Pass)")
            first_pass_metrics = evaluate_automaton(
                first_pass_dfa, Dataset(pos_strings, neg_strings, alphabet)
            )

            # Extract access strings from the warm-start DFA for efficient L* seeding
            access_strings = []
            if first_pass_dfa.start_state is not None:
                queue = deque([first_pass_dfa.start_state])
                access_map = {first_pass_dfa.start_state: ""}
                while queue:
                    curr = queue.popleft()
                    for a in sorted(first_pass_dfa.alphabet):
                        nxt = first_pass_dfa.step(curr, a)
                        if nxt is not None and nxt not in access_map:
                            access_map[nxt] = access_map[curr] + a
                            queue.append(nxt)
                access_strings = list(access_map.values())

            learner = InteractiveActiveLearner(
                alphabet=alphabet,
                initial_positive=pos_strings,
                initial_negative=neg_strings,
                reference_oracle=None,
                seed_access_strings=access_strings,
            )
            session["learner"] = learner
            self._interactive_session = learner

            step_result = learner.step()

            if step_result["status"] == "NEED_MEMBERSHIP_QUERY":
                return {
                    "session_id": sid,
                    "needs_hitl": True,
                    "hitl_status": "NEED_MEMBERSHIP_QUERY",
                    "inference_engine": inference_engine,
                    "query_string": step_result["query_string"],
                    "first_pass_graph": first_pass_graph,
                    "first_pass_metrics": first_pass_metrics,
                    "total_queries_asked": 0,
                }
            elif step_result["status"] == "CONJECTURE_READY":
                conj_graph = format_graph_payload(
                    learner.current_conjecture, name="DFA (Conjecture)"
                )
                session["model"] = learner.current_conjecture
                self._current_model = learner.current_conjecture
                return {
                    "session_id": sid,
                    "needs_hitl": True,
                    "hitl_status": "CONJECTURE_READY",
                    "inference_engine": inference_engine,
                    "first_pass_graph": first_pass_graph,
                    "first_pass_metrics": first_pass_metrics,
                    "conjectured_graph": conj_graph,
                    "total_queries_asked": 0,
                }
            else:  # CONVERGED
                final_graph = format_graph_payload(
                    learner.current_conjecture, name="DFA (Learned)"
                )
                session["model"] = learner.current_conjecture
                self._current_model = learner.current_conjecture
                metrics = evaluate_automaton(
                    learner.current_conjecture,
                    Dataset(pos_strings, neg_strings, alphabet),
                )
                return {
                    "session_id": sid,
                    "needs_hitl": False,
                    "inference_engine": inference_engine,
                    "graph": final_graph,
                    "metrics": metrics,
                }

    # ------------------------------------------------------------------
    # HITL interaction
    # ------------------------------------------------------------------

    def answer_hitl_query(self, session_id: str = "default", is_accepted: bool = False) -> Dict[str, Any]:
        """
        Routes to learner.answer_membership_query(is_accepted), then processes result.
        """
        sid = session_id or "default"
        session = self._get_or_create_session(sid)
        learner: Optional[InteractiveActiveLearner] = session.get("learner") or self._interactive_session
        if learner is None:
            raise ValueError(f"No active HITL session for session_id={sid!r}.")
        step_result = learner.answer_membership_query(is_accepted)
        return self._process_hitl_step_result(sid, step_result)

    def confirm_hitl_conjecture(
        self,
        session_id: str = "default",
        counterexample: Optional[str] = None,
        expected_label: Optional[bool] = None,
    ) -> Dict[str, Any]:
        """
        Confirms a conjecture or incorporates a counterexample via incremental synthesis.
        When a counterexample is provided:
          - Automatically determines the correct ground-truth label
          - Adds counterexample to (S+, S-) and known_labels
          - Triggers fast incremental synthesis (SAT / RPNI)
          - Emits the refined conjecture immediately without re-querying known prefixes.
        """
        sid = session_id or "default"
        session = self._get_or_create_session(sid)
        learner: Optional[InteractiveActiveLearner] = session.get("learner") or self._interactive_session

        if not counterexample:
            if learner is None:
                raise ValueError(f"No active HITL session for session_id={sid!r}.")
            step_result = learner.provide_counterexample(None)
            return self._process_hitl_step_result(sid, step_result)

        # Counterexample provided
        curr_model = session.get("model") or (learner.current_conjecture if learner else None)
        if expected_label is not None:
            true_label = bool(expected_label)
        elif curr_model is not None:
            # Counterexample indicates current model was wrong, so true label is inverted
            true_label = not curr_model.accepts(counterexample)
        else:
            true_label = False

        # 1. Update session examples
        if true_label:
            if counterexample not in session["positive"]:
                session["positive"].append(counterexample)
        else:
            if counterexample not in session["negative"]:
                session["negative"].append(counterexample)

        # 2. Update learner known labels and query history
        if learner is not None:
            learner.known_labels[counterexample] = true_label
            learner.query_history.append({
                "query_string": counterexample,
                "answer": true_label,
                "source": "counterexample",
            })

        # 3. Incremental Re-Synthesis with updated dataset
        pos_strings = session["positive"]
        neg_strings = session["negative"]
        alphabet = session.get("alphabet") or ["0", "1"]
        total_samples = len(pos_strings) + len(neg_strings)

        refined_dfa = None
        engine_name = "RPNI (State-Merging)"
        if total_samples <= 25:
            try:
                sat_learner = SATDFALearner(pos_strings, neg_strings, alphabet, timeout_sec=2.5)
                sat_res = sat_learner.learn(max_states=8)
                if sat_res is not None:
                    refined_dfa = sat_res["inferred_dfa"]
                    engine_name = f"Exact SAT (Biermann-Feldman, k={sat_res['k']})"
            except Exception:
                refined_dfa = None

        if refined_dfa is None:
            rpni_learner = RPNILearner(pos_strings, neg_strings, alphabet)
            rpni_result = rpni_learner.learn()
            refined_dfa = rpni_result["inferred_dfa"]

        session["model"] = refined_dfa
        self._current_model = refined_dfa
        if learner is not None:
            learner.current_conjecture = refined_dfa

        refined_graph = format_graph_payload(refined_dfa, name="DFA (Refined Conjecture)")
        refined_metrics = evaluate_automaton(refined_dfa, Dataset(pos_strings, neg_strings, alphabet))
        total_queries = len(learner.query_history) if learner else 0

        return {
            "status": "CONJECTURE_READY",
            "session_id": sid,
            "hitl_status": "CONJECTURE_READY",
            "conjectured_graph": refined_graph,
            "metrics": refined_metrics,
            "counterexample_incorporated": counterexample,
            "counterexample_label": "accepted" if true_label else "rejected",
            "inference_engine": engine_name,
            "message": f"Incorporated counterexample '{counterexample}' as {'ACCEPTED' if true_label else 'REJECTED'}. Model refined via {engine_name}.",
            "total_queries_asked": total_queries,
        }

    def _process_hitl_step_result(
        self, session_id: str, step_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Shared helper for answer_hitl_query and confirm_hitl_conjecture.
        Converts the learner's step_result dict into a uniform API response.
        """
        sid = session_id or "default"
        session = self._get_or_create_session(sid)
        learner: InteractiveActiveLearner = session["learner"] or self._interactive_session
        status = step_result["status"]
        total_queries = len(learner.query_history)

        if status == "NEED_MEMBERSHIP_QUERY":
            return {
                "status": status,
                "session_id": sid,
                "hitl_status": "NEED_MEMBERSHIP_QUERY",
                "query_string": step_result["query_string"],
                "total_queries_asked": total_queries,
            }

        elif status == "CONJECTURE_READY":
            if learner.current_conjecture is not None:
                session["model"] = learner.current_conjecture
                self._current_model = learner.current_conjecture
                conj_graph = format_graph_payload(
                    learner.current_conjecture, name="DFA (Conjecture)"
                )
            else:
                conj_graph = None
            return {
                "status": status,
                "session_id": sid,
                "hitl_status": "CONJECTURE_READY",
                "conjectured_graph": conj_graph,
                "total_queries_asked": total_queries,
            }

        else:  # CONVERGED
            if learner.current_conjecture is not None:
                session["model"] = learner.current_conjecture
                self._current_model = learner.current_conjecture
                final_graph = format_graph_payload(
                    learner.current_conjecture, name="DFA (Learned)"
                )
            else:
                final_graph = None
            return {
                "status": status,
                "session_id": sid,
                "hitl_status": "CONVERGED",
                "final_graph": final_graph,
                "total_queries_asked": total_queries,
            }

    # ------------------------------------------------------------------
    # Legacy Interactive API compatibility
    # ------------------------------------------------------------------

    def start_interactive_learning(
        self,
        alphabet: List[str],
        initial_positive: Optional[List[str]] = None,
        initial_negative: Optional[List[str]] = None,
        preset_reference_index: Optional[int] = None,
        session_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        oracle = None
        if preset_reference_index is not None:
            oracle = get_tomita_language(preset_reference_index).reference_dfa.accepts

        sid = session_id or "default"
        session = self._get_or_create_session(sid)
        learner = InteractiveActiveLearner(
            alphabet=alphabet,
            initial_positive=initial_positive,
            initial_negative=initial_negative,
            reference_oracle=oracle,
        )
        session["learner"] = learner
        self._interactive_session = learner
        return learner.step()

    def answer_interactive_query(self, is_accepted: bool, session_id: Optional[str] = None) -> Dict[str, Any]:
        return self.answer_hitl_query(session_id=session_id or "default", is_accepted=is_accepted)

    def confirm_interactive_conjecture(self, counterexample: Optional[str] = None, session_id: Optional[str] = None) -> Dict[str, Any]:
        return self.confirm_hitl_conjecture(session_id=session_id or "default", counterexample=counterexample)

    # ------------------------------------------------------------------
    # Simulation
    # ------------------------------------------------------------------

    def simulate(self, *args, **kwargs) -> Dict[str, Any]:
        """
        Runs simulation on the session's current model (DFA or NFA).
        Supports:
          simulate("1010")
          simulate(session_id="...", test_string="1010")
          simulate("...", "1010")
        """
        test_string = kwargs.get("test_string")
        session_id = kwargs.get("session_id")

        if len(args) == 1:
            test_string = args[0]
        elif len(args) >= 2:
            session_id = args[0]
            test_string = args[1]

        if test_string is None:
            test_string = ""

        sid = session_id or "default"
        session = self._get_or_create_session(sid)
        model = session.get("model") or self._current_model

        if model is None:
            raise ValueError(
                f"No model trained for session_id={sid!r}. Train a model first."
            )
        raw_trace = model.simulate(test_string)
        return format_simulation_trace(raw_trace)

    # ------------------------------------------------------------------
    # Ablation studies
    # ------------------------------------------------------------------

    def run_ablation(
        self,
        preset_index: int,
        study_type: str = "sample_size",
        learner_type: str = "rpni",
    ) -> Dict[str, Any]:
        """
        Executes empirical parameter sweeps and returns chart-ready payloads.
        """
        lang = get_tomita_language(preset_index)
        alphabet = sorted(list(lang.reference_dfa.alphabet))

        if study_type == "noise":
            raw_data = run_noise_ablation(
                reference_dfa=lang.reference_dfa,
                alphabet=alphabet,
                learner_type=learner_type,
            )
            return format_ablation_payload(
                study_name=f"Noise Sensitivity Analysis ({lang.name})",
                x_axis_key="noise_percentage",
                y_axis_keys=["inferred_state_count", "test_accuracy"],
                data_points=raw_data,
            )
        else:
            raw_data = run_sample_size_ablation(
                reference_dfa=lang.reference_dfa,
                alphabet=alphabet,
                learner_type=learner_type,
            )
            return format_ablation_payload(
                study_name=f"Sample Complexity Analysis ({lang.name})",
                x_axis_key="sample_size",
                y_axis_keys=["test_accuracy", "inferred_state_count"],
                data_points=raw_data,
            )

