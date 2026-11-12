from __future__ import annotations
from typing import Dict, List, Any, Union
from ..core.dfa import DFA
from ..core.nfa import NFA


def format_graph_payload(automaton: Union[DFA, NFA], name: str = "Automaton") -> Dict[str, Any]:
    """
    Produces a standardized UI-ready node-link payload compatible with
    React Flow, Cytoscape.js, D3.js, and Vis.js.

    Edges are deduplicated by (source, target) pair so that multi-symbol
    transitions appear as a single edge with a combined label (e.g. "0,1").
    """
    raw_dict = automaton.to_graph_dict()

    # Enrich nodes with UI display coordinates hints & CSS classes
    enhanced_nodes = []
    for node in raw_dict["nodes"]:
        classes = ["automaton-node"]
        if node["is_initial"]:
            classes.append("initial-state")
        if node["is_accepting"]:
            classes.append("accepting-state")

        enhanced_nodes.append({
            "id": node["id"],
            "data": {
                "label": node["label"],
                "is_initial": node["is_initial"],
                "is_accepting": node["is_accepting"],
            },
            "classes": " ".join(classes),
        })

    # Deduplicate edges by (source, target) pair.
    # DFA.to_graph_dict() emits one entry per symbol, with a "combined_label"
    # field that already contains the grouped label for that (source, target) pair.
    # We keep the first occurrence of each pair and use its combined_label.
    seen_pairs: Dict[tuple, Dict] = {}
    for edge in raw_dict["edges"]:
        pair = (edge["source"], edge["target"])
        if pair not in seen_pairs:
            seen_pairs[pair] = edge

    enhanced_edges = []
    for (src, tgt), edge in seen_pairs.items():
        combined = edge.get("combined_label", edge.get("symbol", ""))
        enhanced_edges.append({
            "id": f"e_{src}_{tgt}",
            "source": src,
            "target": tgt,
            "label": combined,
            "data": {
                "symbols": combined.split(",") if combined else [],
                "combined_label": combined,
            },
            "animated": False,
        })

    return {
        "name": name,
        "automaton_type": raw_dict["automaton_type"],
        "alphabet": raw_dict["alphabet"],
        "initial_state": raw_dict["initial_state"],
        "accepting_states": raw_dict["accepting_states"],
        "nodes": enhanced_nodes,
        "edges": enhanced_edges,
        "metrics": raw_dict["metrics"],
    }


def format_simulation_trace(trace: Dict[str, Any]) -> Dict[str, Any]:
    """
    Formats the execution step-by-step trace for playback widgets.
    """
    return {
        "input_string": trace["input_string"],
        "accepted": trace["accepted"],
        "num_steps": len(trace["execution_steps"]),
        "steps": trace["execution_steps"],
    }


def format_ablation_payload(
    study_name: str,
    x_axis_key: str,
    y_axis_keys: List[str],
    data_points: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Formats parameter sweep curves for Recharts / Chart.js line charts.
    """
    return {
        "study_name": study_name,
        "x_axis": x_axis_key,
        "series": y_axis_keys,
        "data": data_points,
    }
