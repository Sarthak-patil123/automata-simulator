from __future__ import annotations
from typing import Dict, List, Optional, Any
from ..core.dfa import DFA
from ..core.operations import are_equivalent
from ..dataset.generator import generate_dataset_from_dfa, inject_noise
from ..learning.rpni import RPNILearner
from ..learning.edsm import EDSMLearner
from ..learning.nfa_learning import NFALearner
from .metrics import evaluate_automaton


def run_sample_size_ablation(
    reference_dfa: DFA,
    alphabet: List[str],
    sample_sizes: Optional[List[int]] = None,
    max_length: int = 10,
    learner_type: str = "rpni",
    seed: Optional[int] = 42,
) -> List[Dict[str, Any]]:
    """
    Studies the effect of training sample quantity on:
    - Model Accuracy
    - Inferred State Count
    - Exact Language Equivalence
    """
    if sample_sizes is None:
        sample_sizes = [10, 20, 40, 80, 120]

    # Generate a holdout test set to evaluate generalization
    test_dataset = generate_dataset_from_dfa(
        dfa=reference_dfa,
        num_positive=40,
        num_negative=40,
        max_length=max_length + 2,
        seed=1000 + (seed or 0),
    )

    results: List[Dict[str, Any]] = []

    for size in sample_sizes:
        num_pos = size // 2
        num_neg = size - num_pos

        train_data = generate_dataset_from_dfa(
            dfa=reference_dfa,
            num_positive=num_pos,
            num_negative=num_neg,
            max_length=max_length,
            seed=seed,
        )

        if learner_type == "edsm":
            learner = EDSMLearner(train_data.positive, train_data.negative, alphabet)
            out = learner.learn()
            model = out["inferred_dfa"]
            state_count = len(model.states)
        elif learner_type == "nfa":
            learner = NFALearner(train_data.positive, train_data.negative, alphabet)
            out = learner.learn()
            model = out["inferred_nfa"]
            state_count = len(model.states)
        else:  # default rpni
            learner = RPNILearner(train_data.positive, train_data.negative, alphabet)
            out = learner.learn()
            model = out["inferred_dfa"]
            state_count = len(model.states)

        # Performance on clean test set
        test_eval = evaluate_automaton(model, test_dataset)
        train_eval = evaluate_automaton(model, train_data)

        # Check exact equivalence if model is a DFA or has to_dfa
        target_dfa = model if isinstance(model, DFA) else model.to_dfa()
        is_equiv, counterexample = are_equivalent(target_dfa, reference_dfa)

        results.append({
            "sample_size": size,
            "actual_samples": train_data.size,
            "inferred_state_count": state_count,
            "train_accuracy": train_eval["accuracy"],
            "test_accuracy": test_eval["accuracy"],
            "test_f1": test_eval["f1_score"],
            "is_exact_equivalent": is_equiv,
            "counterexample": counterexample,
        })

    return results


def run_noise_ablation(
    reference_dfa: DFA,
    alphabet: List[str],
    sample_size: int = 60,
    noise_rates: Optional[List[float]] = None,
    max_length: int = 10,
    learner_type: str = "rpni",
    seed: Optional[int] = 42,
) -> List[Dict[str, Any]]:
    """
    Studies the effect of noisy training labels on:
    - State explosion (number of states inflating due to label contradictions)
    - Test accuracy decay
    """
    if noise_rates is None:
        noise_rates = [0.0, 0.05, 0.10, 0.15, 0.20]

    num_pos = sample_size // 2
    num_neg = sample_size - num_pos

    base_train = generate_dataset_from_dfa(
        dfa=reference_dfa,
        num_positive=num_pos,
        num_negative=num_neg,
        max_length=max_length,
        seed=seed,
    )

    test_dataset = generate_dataset_from_dfa(
        dfa=reference_dfa,
        num_positive=40,
        num_negative=40,
        max_length=max_length + 2,
        seed=2000 + (seed or 0),
    )

    results: List[Dict[str, Any]] = []

    for noise_rate in noise_rates:
        noisy_train = inject_noise(base_train, noise_rate=noise_rate, seed=seed)

        if learner_type == "edsm":
            learner = EDSMLearner(noisy_train.positive, noisy_train.negative, alphabet)
            out = learner.learn()
            model = out["inferred_dfa"]
        else:
            learner = RPNILearner(noisy_train.positive, noisy_train.negative, alphabet)
            out = learner.learn()
            model = out["inferred_dfa"]

        test_eval = evaluate_automaton(model, test_dataset)
        target_dfa = model if isinstance(model, DFA) else model.to_dfa()
        is_equiv, _ = are_equivalent(target_dfa, reference_dfa)

        results.append({
            "noise_rate": noise_rate,
            "noise_percentage": f"{int(noise_rate * 100)}%",
            "flipped_labels": noisy_train.metadata.get("flipped_count", 0),
            "inferred_state_count": len(model.states),
            "test_accuracy": test_eval["accuracy"],
            "test_f1": test_eval["f1_score"],
            "is_exact_equivalent": is_equiv,
        })

    return results

