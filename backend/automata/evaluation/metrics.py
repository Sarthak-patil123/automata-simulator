from __future__ import annotations
from typing import Dict, List, Set, Tuple, Optional, Any, Union
from ..core.dfa import DFA
from ..core.nfa import NFA
from ..dataset.generator import Dataset, generate_random_strings


def evaluate_automaton(
    automaton: Union[DFA, NFA],
    dataset: Dataset,
) -> Dict[str, Any]:
    """
    Computes classification performance metrics on a labeled dataset.
    Returns: Accuracy, Precision, Recall, F1 score, Confusion Matrix, and misclassified samples.
    """
    tp = 0
    fp = 0
    tn = 0
    fn = 0
    misclassified: List[Dict[str, Any]] = []

    # Evaluate positive samples
    for s in dataset.positive:
        pred = automaton.accepts(s)
        if pred:
            tp += 1
        else:
            fn += 1
            misclassified.append({
                "string": s,
                "ground_truth": True,
                "predicted": False,
                "length": len(s),
            })

    # Evaluate negative samples
    for s in dataset.negative:
        pred = automaton.accepts(s)
        if not pred:
            tn += 1
        else:
            fp += 1
            misclassified.append({
                "string": s,
                "ground_truth": False,
                "predicted": True,
                "length": len(s),
            })

    total = tp + fp + tn + fn
    accuracy = (tp + tn) / total if total > 0 else 0.0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (
        2 * (precision * recall) / (precision + recall)
        if (precision + recall) > 0
        else 0.0
    )

    return {
        "total_samples": total,
        "accuracy": round(accuracy, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "confusion_matrix": {
            "true_positive": tp,
            "false_positive": fp,
            "true_negative": tn,
            "false_negative": fn,
        },
        "num_misclassified": len(misclassified),
        "misclassified_samples": misclassified[:50],  # cap for UI display
    }


def evaluate_generalization(
    automaton: Union[DFA, NFA],
    reference_dfa: DFA,
    alphabet: List[str],
    lengths: Optional[List[int]] = None,
    samples_per_length: int = 40,
    seed: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """
    Evaluates whether the learned automaton generalizes to strings longer than the training set.
    Tests across discrete length intervals.
    """
    if lengths is None:
        lengths = [1, 2, 4, 6, 8, 10, 12, 15]

    results: List[Dict[str, Any]] = []

    for length in lengths:
        strings = generate_random_strings(
            count=samples_per_length,
            min_len=length,
            max_len=length,
            alphabet=alphabet,
            seed=seed,
        )
        if not strings:
            continue

        correct = 0
        for s in strings:
            ground_truth = reference_dfa.accepts(s)
            pred = automaton.accepts(s)
            if ground_truth == pred:
                correct += 1

        acc = correct / len(strings) if strings else 0.0
        results.append({
            "string_length": length,
            "sample_count": len(strings),
            "accuracy": round(acc, 4),
            "correct_count": correct,
        })

    return results

