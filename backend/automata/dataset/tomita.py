from __future__ import annotations
from typing import Callable, Dict, List, Optional, Any
from ..core.dfa import DFA


class TomitaLanguage:
    """
    Representation of one of the 7 Tomita benchmark regular languages.
    """

    def __init__(
        self,
        index: int,
        name: str,
        description: str,
        formula: str,
        reference_dfa: DFA,
        rule_fn: Callable[[str], bool],
    ):
        self.index = index
        self.name = name
        self.description = description
        self.formula = formula
        self.reference_dfa = reference_dfa
        self.rule_fn = rule_fn
        self.alphabet = sorted(list(reference_dfa.alphabet))

    def accepts(self, s: str) -> bool:
        return self.rule_fn(s)


def _build_tomita_1() -> TomitaLanguage:
    # L1: 1* (Only strings of 1s)
    dfa = DFA(
        states={"q0", "q1"},
        alphabet={"0", "1"},
        transitions={
            ("q0", "1"): "q0",
            ("q0", "0"): "q1",
            ("q1", "0"): "q1",
            ("q1", "1"): "q1",
        },
        start_state="q0",
        accept_states={"q0"},
    )
    return TomitaLanguage(
        index=1,
        name="Tomita 1",
        description="All strings containing only 1s (empty string included).",
        formula="1*",
        reference_dfa=dfa,
        rule_fn=lambda s: all(c == "1" for c in s),
    )


def _build_tomita_2() -> TomitaLanguage:
    # L2: (10)*
    dfa = DFA(
        states={"q0", "q1", "q2"},
        alphabet={"0", "1"},
        transitions={
            ("q0", "1"): "q1",
            ("q0", "0"): "q2",
            ("q1", "0"): "q0",
            ("q1", "1"): "q2",
            ("q2", "0"): "q2",
            ("q2", "1"): "q2",
        },
        start_state="q0",
        accept_states={"q0"},
    )

    def rule(s: str) -> bool:
        if len(s) % 2 != 0:
            return False
        for i in range(0, len(s), 2):
            if s[i : i + 2] != "10":
                return False
        return True

    return TomitaLanguage(
        index=2,
        name="Tomita 2",
        description="Alternating 1s and 0s starting with 1, of even length.",
        formula="(10)*",
        reference_dfa=dfa,
        rule_fn=rule,
    )


def _build_tomita_3() -> TomitaLanguage:
    # L3: No odd number of consecutive 0s follows an odd number of 1s
    dfa = DFA(
        states={"q0", "q1", "q2", "q3"},
        alphabet={"0", "1"},
        transitions={
            ("q0", "0"): "q0",
            ("q0", "1"): "q1",
            ("q1", "0"): "q2",
            ("q1", "1"): "q0",
            ("q2", "0"): "q1",
            ("q2", "1"): "q3",
            ("q3", "0"): "q3",
            ("q3", "1"): "q3",
        },
        start_state="q0",
        accept_states={"q0", "q1"},
    )
    return TomitaLanguage(
        index=3,
        name="Tomita 3",
        description="No odd number of consecutive 0s follows an odd number of consecutive 1s.",
        formula="Complement of ( (0|1)* 1(11)* 0(00)* (1|$) )",
        reference_dfa=dfa,
        rule_fn=dfa.accepts,
    )


def _build_tomita_4() -> TomitaLanguage:
    # L4: Does not contain 000
    dfa = DFA(
        states={"q0", "q1", "q2", "q3"},
        alphabet={"0", "1"},
        transitions={
            ("q0", "1"): "q0",
            ("q0", "0"): "q1",
            ("q1", "1"): "q0",
            ("q1", "0"): "q2",
            ("q2", "1"): "q0",
            ("q2", "0"): "q3",
            ("q3", "0"): "q3",
            ("q3", "1"): "q3",
        },
        start_state="q0",
        accept_states={"q0", "q1", "q2"},
    )
    return TomitaLanguage(
        index=4,
        name="Tomita 4",
        description="Strings that do not contain '000' as a substring.",
        formula="~( (0|1)* 000 (0|1)* )",
        reference_dfa=dfa,
        rule_fn=lambda s: "000" not in s,
    )


def _build_tomita_5() -> TomitaLanguage:
    # L5: Even number of 0s and even number of 1s
    dfa = DFA(
        states={"q0", "q1", "q2", "q3"},
        alphabet={"0", "1"},
        transitions={
            ("q0", "0"): "q1",
            ("q0", "1"): "q2",
            ("q1", "0"): "q0",
            ("q1", "1"): "q3",
            ("q2", "0"): "q3",
            ("q2", "1"): "q0",
            ("q3", "0"): "q2",
            ("q3", "1"): "q1",
        },
        start_state="q0",
        accept_states={"q0"},
    )
    return TomitaLanguage(
        index=5,
        name="Tomita 5",
        description="Strings containing an even number of 0s and an even number of 1s.",
        formula="N0 % 2 == 0 AND N1 % 2 == 0",
        reference_dfa=dfa,
        rule_fn=lambda s: (s.count("0") % 2 == 0) and (s.count("1") % 2 == 0),
    )


def _build_tomita_6() -> TomitaLanguage:
    # L6: (N0 - N1) % 3 == 0
    dfa = DFA(
        states={"q0", "q1", "q2"},
        alphabet={"0", "1"},
        transitions={
            ("q0", "0"): "q1",
            ("q0", "1"): "q2",
            ("q1", "0"): "q2",
            ("q1", "1"): "q0",
            ("q2", "0"): "q0",
            ("q2", "1"): "q1",
        },
        start_state="q0",
        accept_states={"q0"},
    )
    return TomitaLanguage(
        index=6,
        name="Tomita 6",
        description="Difference between number of 0s and 1s is a multiple of 3.",
        formula="(N0 - N1) % 3 == 0",
        reference_dfa=dfa,
        rule_fn=lambda s: (s.count("0") - s.count("1")) % 3 == 0,
    )


def _build_tomita_7() -> TomitaLanguage:
    # L7: 0* 1* 0* 1*
    dfa = DFA(
        states={"q0", "q1", "q2", "q3", "q4"},
        alphabet={"0", "1"},
        transitions={
            ("q0", "0"): "q0",
            ("q0", "1"): "q1",
            ("q1", "0"): "q2",
            ("q1", "1"): "q1",
            ("q2", "0"): "q2",
            ("q2", "1"): "q3",
            ("q3", "0"): "q4",
            ("q3", "1"): "q3",
            ("q4", "0"): "q4",
            ("q4", "1"): "q4",
        },
        start_state="q0",
        accept_states={"q0", "q1", "q2", "q3"},
    )

    def rule(s: str) -> bool:
        # At most 3 blocks of alternates: 0s then 1s then 0s then 1s
        state = 0
        for c in s:
            if state == 0:
                if c == "1":
                    state = 1
            elif state == 1:
                if c == "0":
                    state = 2
            elif state == 2:
                if c == "1":
                    state = 3
            elif state == 3:
                if c == "0":
                    return False
        return True

    return TomitaLanguage(
        index=7,
        name="Tomita 7",
        description="Strings of the form 0* 1* 0* 1* (at most 3 changes of character).",
        formula="0* 1* 0* 1*",
        reference_dfa=dfa,
        rule_fn=rule,
    )


_TOMITA_BUILDERS = {
    1: _build_tomita_1,
    2: _build_tomita_2,
    3: _build_tomita_3,
    4: _build_tomita_4,
    5: _build_tomita_5,
    6: _build_tomita_6,
    7: _build_tomita_7,
}


def get_tomita_language(index: int) -> TomitaLanguage:
    if index not in _TOMITA_BUILDERS:
        raise ValueError(f"Tomita language index must be between 1 and 7, got {index}")
    return _TOMITA_BUILDERS[index]()


def list_tomita_languages() -> List[Dict[str, Any]]:
    return [
        {
            "index": i,
            "name": lang.name,
            "description": lang.description,
            "formula": lang.formula,
            "num_states": len(lang.reference_dfa.states),
        }
        for i, lang in ((i, get_tomita_language(i)) for i in range(1, 8))
    ]
