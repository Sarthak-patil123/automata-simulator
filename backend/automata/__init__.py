"""
Automata Core Package
Provides DFA, NFA, minimization, and formal language operations.
"""

from .core.dfa import DFA
from .core.nfa import NFA
from .core.operations import (
    minimize_dfa,
    complement_dfa,
    intersect_dfas,
    union_dfas,
    symmetric_difference_dfa,
    are_equivalent,
)

__all__ = [
    "DFA",
    "NFA",
    "minimize_dfa",
    "complement_dfa",
    "intersect_dfas",
    "union_dfas",
    "symmetric_difference_dfa",
    "are_equivalent",
]

