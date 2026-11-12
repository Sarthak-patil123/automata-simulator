import os
import json
import csv
from typing import Dict, List, Set, Tuple, Callable

# Ensure directories exist
TESTCASES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "testcases")
OUTPUT_DFA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "output_dfas")

os.makedirs(TESTCASES_DIR, exist_ok=True)
os.makedirs(OUTPUT_DFA_DIR, exist_ok=True)

class QuestionSpec:
    def __init__(
        self,
        number: int,
        level: str,
        name: str,
        slug: str,
        description: str,
        states: List[str],
        start_state: str,
        accept_states: List[str],
        transitions: Dict[Tuple[str, str], str],
        state_meanings: Dict[str, str],
        rule_fn: Callable[[str], bool],
        difficulty_target_samples: int,
    ):
        self.number = number
        self.level = level
        self.name = name
        self.slug = slug
        self.description = description
        self.states = states
        self.alphabet = ["0", "1"]
        self.start_state = start_state
        self.accept_states = accept_states
        self.transitions = transitions
        self.state_meanings = state_meanings
        self.rule_fn = rule_fn
        self.target_samples = difficulty_target_samples

    def accepts(self, s: str) -> bool:
        curr = self.start_state
        for ch in s:
            if (curr, ch) not in self.transitions:
                return False
            curr = self.transitions[(curr, ch)]
        return curr in self.accept_states


def get_all_questions() -> List[QuestionSpec]:
    questions = []

    # -------------------------------------------------------------
    # Level 1 – Easy (1–5)
    # -------------------------------------------------------------
    # Q1: End with 0
    questions.append(QuestionSpec(
        number=1,
        level="Level 1 – Easy",
        name="End with 0",
        slug="01_ends_with_0",
        description="Accepts strings over {0, 1} that end with the symbol 0.",
        states=["q0", "q1"],
        start_state="q0",
        accept_states=["q1"],
        transitions={
            ("q0", "0"): "q1", ("q0", "1"): "q0",
            ("q1", "0"): "q1", ("q1", "1"): "q0",
        },
        state_meanings={
            "q0": "Start / string is empty or last symbol read was 1 (non-accepting)",
            "q1": "Last symbol read was 0 (accepting)",
        },
        rule_fn=lambda s: s.endswith("0"),
        difficulty_target_samples=16,
    ))

    # Q2: Start with 1
    questions.append(QuestionSpec(
        number=2,
        level="Level 1 – Easy",
        name="Start with 1",
        slug="02_starts_with_1",
        description="Accepts strings over {0, 1} that start with the symbol 1.",
        states=["q0", "q1", "qd"],
        start_state="q0",
        accept_states=["q1"],
        transitions={
            ("q0", "0"): "qd", ("q0", "1"): "q1",
            ("q1", "0"): "q1", ("q1", "1"): "q1",
            ("qd", "0"): "qd", ("qd", "1"): "qd",
        },
        state_meanings={
            "q0": "Start state / empty string (non-accepting)",
            "q1": "First symbol was 1 (accepting trap state)",
            "qd": "First symbol was 0 (dead / reject trap state)",
        },
        rule_fn=lambda s: s.startswith("1"),
        difficulty_target_samples=16,
    ))

    # Q3: Contain at least one 0
    questions.append(QuestionSpec(
        number=3,
        level="Level 1 – Easy",
        name="Contain at least one 0",
        slug="03_contains_at_least_one_0",
        description="Accepts strings over {0, 1} that contain at least one occurrence of 0.",
        states=["q0", "q1"],
        start_state="q0",
        accept_states=["q1"],
        transitions={
            ("q0", "0"): "q1", ("q0", "1"): "q0",
            ("q1", "0"): "q1", ("q1", "1"): "q1",
        },
        state_meanings={
            "q0": "No 0 seen yet (only 1s or empty string) (non-accepting)",
            "q1": "At least one 0 has been observed (accepting trap state)",
        },
        rule_fn=lambda s: "0" in s,
        difficulty_target_samples=16,
    ))

    # Q4: Contain exactly one 1
    questions.append(QuestionSpec(
        number=4,
        level="Level 1 – Easy",
        name="Contain exactly one 1",
        slug="04_contains_exactly_one_1",
        description="Accepts strings over {0, 1} that contain exactly one occurrence of 1.",
        states=["q0", "q1", "qd"],
        start_state="q0",
        accept_states=["q1"],
        transitions={
            ("q0", "0"): "q0", ("q0", "1"): "q1",
            ("q1", "0"): "q1", ("q1", "1"): "qd",
            ("qd", "0"): "qd", ("qd", "1"): "qd",
        },
        state_meanings={
            "q0": "Zero 1s observed so far (non-accepting)",
            "q1": "Exactly one 1 observed so far (accepting)",
            "qd": "Two or more 1s observed (dead / reject trap state)",
        },
        rule_fn=lambda s: s.count("1") == 1,
        difficulty_target_samples=18,
    ))

    # Q5: Have an even number of 0s
    questions.append(QuestionSpec(
        number=5,
        level="Level 1 – Easy",
        name="Have an even number of 0s",
        slug="05_even_number_of_0s",
        description="Accepts strings over {0, 1} with an even number of 0s (including empty string).",
        states=["q0", "q1"],
        start_state="q0",
        accept_states=["q0"],
        transitions={
            ("q0", "0"): "q1", ("q0", "1"): "q0",
            ("q1", "0"): "q0", ("q1", "1"): "q1",
        },
        state_meanings={
            "q0": "Count of 0s is even (accepting)",
            "q1": "Count of 0s is odd (non-accepting)",
        },
        rule_fn=lambda s: s.count("0") % 2 == 0,
        difficulty_target_samples=18,
    ))

    # -------------------------------------------------------------
    # Level 2 – Easy to Moderate (6–10)
    # -------------------------------------------------------------
    # Q6: Have an odd number of 1s
    questions.append(QuestionSpec(
        number=6,
        level="Level 2 – Easy to Moderate",
        name="Have an odd number of 1s",
        slug="06_odd_number_of_1s",
        description="Accepts strings over {0, 1} with an odd number of 1s.",
        states=["q0", "q1"],
        start_state="q0",
        accept_states=["q1"],
        transitions={
            ("q0", "0"): "q0", ("q0", "1"): "q1",
            ("q1", "0"): "q1", ("q1", "1"): "q0",
        },
        state_meanings={
            "q0": "Count of 1s is even (non-accepting)",
            "q1": "Count of 1s is odd (accepting)",
        },
        rule_fn=lambda s: s.count("1") % 2 == 1,
        difficulty_target_samples=20,
    ))

    # Q7: End with 01
    questions.append(QuestionSpec(
        number=7,
        level="Level 2 – Easy to Moderate",
        name="End with 01",
        slug="07_ends_with_01",
        description="Accepts strings over {0, 1} that end with the suffix 01.",
        states=["q0", "q1", "q2"],
        start_state="q0",
        accept_states=["q2"],
        transitions={
            ("q0", "0"): "q1", ("q0", "1"): "q0",
            ("q1", "0"): "q1", ("q1", "1"): "q2",
            ("q2", "0"): "q1", ("q2", "1"): "q0",
        },
        state_meanings={
            "q0": "No matching suffix / last symbol read was 1 (or empty) (non-accepting)",
            "q1": "Last symbol read was 0 (non-accepting)",
            "q2": "Last two symbols read were 01 (accepting)",
        },
        rule_fn=lambda s: s.endswith("01"),
        difficulty_target_samples=22,
    ))

    # Q8: Start with 0 and end with 1
    questions.append(QuestionSpec(
        number=8,
        level="Level 2 – Easy to Moderate",
        name="Start with 0 and end with 1",
        slug="08_starts_with_0_and_ends_with_1",
        description="Accepts strings over {0, 1} that start with 0 and end with 1.",
        states=["q0", "q1", "q2", "qd"],
        start_state="q0",
        accept_states=["q2"],
        transitions={
            ("q0", "0"): "q1", ("q0", "1"): "qd",
            ("q1", "0"): "q1", ("q1", "1"): "q2",
            ("q2", "0"): "q1", ("q2", "1"): "q2",
            ("qd", "0"): "qd", ("qd", "1"): "qd",
        },
        state_meanings={
            "q0": "Initial state / empty string (non-accepting)",
            "q1": "Started with 0, and last symbol was 0 (non-accepting)",
            "q2": "Started with 0, and last symbol was 1 (accepting)",
            "qd": "Started with 1 (dead / reject trap state)",
        },
        rule_fn=lambda s: s.startswith("0") and s.endswith("1"),
        difficulty_target_samples=24,
    ))

    # Q9: Contain substring 00
    questions.append(QuestionSpec(
        number=9,
        level="Level 2 – Easy to Moderate",
        name="Contain substring 00",
        slug="09_contains_substring_00",
        description="Accepts strings over {0, 1} containing '00' as a contiguous substring.",
        states=["q0", "q1", "q2"],
        start_state="q0",
        accept_states=["q2"],
        transitions={
            ("q0", "0"): "q1", ("q0", "1"): "q0",
            ("q1", "0"): "q2", ("q1", "1"): "q0",
            ("q2", "0"): "q2", ("q2", "1"): "q2",
        },
        state_meanings={
            "q0": "No recent 0 seen / last symbol was 1 (non-accepting)",
            "q1": "Exactly one 0 seen recently (non-accepting)",
            "q2": "Substring 00 has been observed (accepting trap state)",
        },
        rule_fn=lambda s: "00" in s,
        difficulty_target_samples=22,
    ))

    # Q10: Do not contain substring 11
    questions.append(QuestionSpec(
        number=10,
        level="Level 2 – Easy to Moderate",
        name="Do not contain substring 11",
        slug="10_does_not_contain_substring_11",
        description="Accepts strings over {0, 1} that do NOT contain '11' as a substring.",
        states=["q0", "q1", "qd"],
        start_state="q0",
        accept_states=["q0", "q1"],
        transitions={
            ("q0", "0"): "q0", ("q0", "1"): "q1",
            ("q1", "0"): "q0", ("q1", "1"): "qd",
            ("qd", "0"): "qd", ("qd", "1"): "qd",
        },
        state_meanings={
            "q0": "Valid string, last symbol was 0 or empty (accepting)",
            "q1": "Valid string, last symbol was 1 (accepting)",
            "qd": "Forbidden substring 11 seen (dead / reject trap state)",
        },
        rule_fn=lambda s: "11" not in s,
        difficulty_target_samples=22,
    ))

    # -------------------------------------------------------------
    # Level 3 – Moderate (11–15)
    # -------------------------------------------------------------
    # Q11: Even number of 0s and even number of 1s
    questions.append(QuestionSpec(
        number=11,
        level="Level 3 – Moderate",
        name="Even number of 0s and even number of 1s",
        slug="11_even_0s_and_even_1s",
        description="Accepts strings over {0, 1} with both an even count of 0s and an even count of 1s.",
        states=["q_ee", "q_oe", "q_eo", "q_oo"],
        start_state="q_ee",
        accept_states=["q_ee"],
        transitions={
            ("q_ee", "0"): "q_oe", ("q_ee", "1"): "q_eo",
            ("q_oe", "0"): "q_ee", ("q_oe", "1"): "q_oo",
            ("q_eo", "0"): "q_oo", ("q_eo", "1"): "q_ee",
            ("q_oo", "0"): "q_eo", ("q_oo", "1"): "q_oe",
        },
        state_meanings={
            "q_ee": "Even number of 0s, even number of 1s (start and accepting)",
            "q_oe": "Odd number of 0s, even number of 1s (non-accepting)",
            "q_eo": "Even number of 0s, odd number of 1s (non-accepting)",
            "q_oo": "Odd number of 0s, odd number of 1s (non-accepting)",
        },
        rule_fn=lambda s: (s.count("0") % 2 == 0) and (s.count("1") % 2 == 0),
        difficulty_target_samples=28,
    ))

    # Q12: Contain at least two consecutive 0s
    questions.append(QuestionSpec(
        number=12,
        level="Level 3 – Moderate",
        name="Contain at least two consecutive 0s",
        slug="12_at_least_two_consecutive_0s",
        description="Accepts strings over {0, 1} containing at least two consecutive 0s (equivalent to containing '00').",
        states=["q0", "q1", "q2"],
        start_state="q0",
        accept_states=["q2"],
        transitions={
            ("q0", "0"): "q1", ("q0", "1"): "q0",
            ("q1", "0"): "q2", ("q1", "1"): "q0",
            ("q2", "0"): "q2", ("q2", "1"): "q2",
        },
        state_meanings={
            "q0": "Zero consecutive 0s currently tracked (non-accepting)",
            "q1": "One 0 seen currently (non-accepting)",
            "q2": "Two or more consecutive 0s achieved (accepting trap state)",
        },
        rule_fn=lambda s: "00" in s,
        difficulty_target_samples=24,
    ))

    # Q13: Have a number of 1s divisible by 3
    questions.append(QuestionSpec(
        number=13,
        level="Level 3 – Moderate",
        name="Number of 1s divisible by 3",
        slug="13_number_of_1s_divisible_by_3",
        description="Accepts strings over {0, 1} where the total count of 1s is a multiple of 3.",
        states=["q0", "q1", "q2"],
        start_state="q0",
        accept_states=["q0"],
        transitions={
            ("q0", "0"): "q0", ("q0", "1"): "q1",
            ("q1", "0"): "q1", ("q1", "1"): "q2",
            ("q2", "0"): "q2", ("q2", "1"): "q0",
        },
        state_meanings={
            "q0": "Count of 1s mod 3 == 0 (accepting)",
            "q1": "Count of 1s mod 3 == 1 (non-accepting)",
            "q2": "Count of 1s mod 3 == 2 (non-accepting)",
        },
        rule_fn=lambda s: s.count("1") % 3 == 0,
        difficulty_target_samples=26,
    ))

    # Q14: End with 101 or 010
    questions.append(QuestionSpec(
        number=14,
        level="Level 3 – Moderate",
        name="End with 101 or 010",
        slug="14_ends_with_101_or_010",
        description="Accepts strings over {0, 1} that terminate in either 101 or 010.",
        states=["q_eps", "q_0", "q_1", "q_01", "q_10", "q_010", "q_101"],
        start_state="q_eps",
        accept_states=["q_010", "q_101"],
        transitions={
            ("q_eps", "0"): "q_0",   ("q_eps", "1"): "q_1",
            ("q_0", "0"): "q_0",     ("q_0", "1"): "q_01",
            ("q_1", "0"): "q_10",    ("q_1", "1"): "q_1",
            ("q_01", "0"): "q_010",  ("q_01", "1"): "q_1",
            ("q_10", "0"): "q_0",    ("q_10", "1"): "q_101",
            ("q_010", "0"): "q_0",   ("q_010", "1"): "q_101",
            ("q_101", "0"): "q_010", ("q_101", "1"): "q_1",
        },
        state_meanings={
            "q_eps": "Start state / empty string (non-accepting)",
            "q_0": "Ends with 0 (not 10 or 010) (non-accepting)",
            "q_1": "Ends with 1 (not 01 or 101) (non-accepting)",
            "q_01": "Ends with 01 (non-accepting)",
            "q_10": "Ends with 10 (non-accepting)",
            "q_010": "Ends with 010 (accepting)",
            "q_101": "Ends with 101 (accepting)",
        },
        rule_fn=lambda s: s.endswith("101") or s.endswith("010"),
        difficulty_target_samples=32,
    ))

    # Q15: Contain exactly two occurrences of 0
    questions.append(QuestionSpec(
        number=15,
        level="Level 3 – Moderate",
        name="Contain exactly two occurrences of 0",
        slug="15_exactly_two_occurrences_of_0",
        description="Accepts strings over {0, 1} with exactly two occurrences of 0 anywhere.",
        states=["q0", "q1", "q2", "qd"],
        start_state="q0",
        accept_states=["q2"],
        transitions={
            ("q0", "0"): "q1", ("q0", "1"): "q0",
            ("q1", "0"): "q2", ("q1", "1"): "q1",
            ("q2", "0"): "qd", ("q2", "1"): "q2",
            ("qd", "0"): "qd", ("qd", "1"): "qd",
        },
        state_meanings={
            "q0": "Zero 0s observed (non-accepting)",
            "q1": "One 0 observed (non-accepting)",
            "q2": "Exactly two 0s observed (accepting)",
            "qd": "Three or more 0s observed (dead / reject trap state)",
        },
        rule_fn=lambda s: s.count("0") == 2,
        difficulty_target_samples=26,
    ))

    # -------------------------------------------------------------
    # Level 4 – Medium (16–20)
    # -------------------------------------------------------------
    # Q16: Even number of 0s and odd number of 1s
    questions.append(QuestionSpec(
        number=16,
        level="Level 4 – Medium",
        name="Even number of 0s and odd number of 1s",
        slug="16_even_0s_and_odd_1s",
        description="Accepts strings over {0, 1} with an even count of 0s and an odd count of 1s.",
        states=["q_ee", "q_oe", "q_eo", "q_oo"],
        start_state="q_ee",
        accept_states=["q_eo"],
        transitions={
            ("q_ee", "0"): "q_oe", ("q_ee", "1"): "q_eo",
            ("q_oe", "0"): "q_ee", ("q_oe", "1"): "q_oo",
            ("q_eo", "0"): "q_oo", ("q_eo", "1"): "q_ee",
            ("q_oo", "0"): "q_eo", ("q_oo", "1"): "q_oe",
        },
        state_meanings={
            "q_ee": "Even 0s, even 1s (start state, non-accepting)",
            "q_oe": "Odd 0s, even 1s (non-accepting)",
            "q_eo": "Even 0s, odd 1s (accepting)",
            "q_oo": "Odd 0s, odd 1s (non-accepting)",
        },
        rule_fn=lambda s: (s.count("0") % 2 == 0) and (s.count("1") % 2 == 1),
        difficulty_target_samples=28,
    ))

    # Q17: Do not contain substring 010
    questions.append(QuestionSpec(
        number=17,
        level="Level 4 – Medium",
        name="Do not contain substring 010",
        slug="17_does_not_contain_substring_010",
        description="Accepts strings over {0, 1} that do NOT contain '010' as a contiguous substring.",
        states=["q0", "q1", "q01", "qd"],
        start_state="q0",
        accept_states=["q0", "q1", "q01"],
        transitions={
            ("q0", "0"): "q1",  ("q0", "1"): "q0",
            ("q1", "0"): "q1",  ("q1", "1"): "q01",
            ("q01", "0"): "qd", ("q01", "1"): "q0",
            ("qd", "0"): "qd",  ("qd", "1"): "qd",
        },
        state_meanings={
            "q0": "Valid string, no prefix of 010 tracked / last was 1 or empty (accepting)",
            "q1": "Valid string, last symbol was 0 (accepting)",
            "q01": "Valid string, last symbols were 01 (accepting)",
            "qd": "Forbidden substring 010 encountered (dead / reject trap state)",
        },
        rule_fn=lambda s: "010" not in s,
        difficulty_target_samples=28,
    ))

    # Q18: Have binary value divisible by 3
    questions.append(QuestionSpec(
        number=18,
        level="Level 4 – Medium",
        name="Binary value divisible by 3",
        slug="18_binary_value_divisible_by_3",
        description="Accepts binary representations (evaluated MSB to LSB) whose decimal value is divisible by 3.",
        states=["q0", "q1", "q2"],
        start_state="q0",
        accept_states=["q0"],
        transitions={
            ("q0", "0"): "q0", ("q0", "1"): "q1",
            ("q1", "0"): "q2", ("q1", "1"): "q0",
            ("q2", "0"): "q1", ("q2", "1"): "q2",
        },
        state_meanings={
            "q0": "Current numerical value mod 3 == 0 (accepting, also start state for 0 / empty string)",
            "q1": "Current numerical value mod 3 == 1 (non-accepting)",
            "q2": "Current numerical value mod 3 == 2 (non-accepting)",
        },
        rule_fn=lambda s: (int(s, 2) % 3 == 0) if s else True,
        difficulty_target_samples=30,
    ))

    # Q19: Contain both substrings 00 and 11
    questions.append(QuestionSpec(
        number=19,
        level="Level 4 – Medium",
        name="Contain both substrings 00 and 11",
        slug="19_contains_both_00_and_11",
        description="Accepts strings over {0, 1} containing both '00' and '11' as substrings (in any order).",
        states=["q0", "q1", "q2", "q3", "q4", "q5", "q6", "q7"],
        start_state="q0",
        accept_states=["q4"],
        transitions={
            ("q0", "0"): "q1", ("q0", "1"): "q5",
            ("q1", "0"): "q2", ("q1", "1"): "q5",
            ("q2", "0"): "q2", ("q2", "1"): "q3",
            ("q3", "0"): "q2", ("q3", "1"): "q4",
            ("q4", "0"): "q4", ("q4", "1"): "q4",
            ("q5", "0"): "q1", ("q5", "1"): "q6",
            ("q6", "0"): "q7", ("q6", "1"): "q6",
            ("q7", "0"): "q4", ("q7", "1"): "q6",
        },
        state_meanings={
            "q0": "Start / neither 00 nor 11 seen (non-accepting)",
            "q1": "Saw trailing 0, neither target achieved yet (non-accepting)",
            "q2": "Achieved 00, now waiting for 11 / trailing 0 (non-accepting)",
            "q3": "Achieved 00, saw trailing 1 / waiting for one more 1 (non-accepting)",
            "q4": "Both 00 and 11 achieved (accepting trap state)",
            "q5": "Saw trailing 1, neither target achieved yet (non-accepting)",
            "q6": "Achieved 11, now waiting for 00 / trailing 1 (non-accepting)",
            "q7": "Achieved 11, saw trailing 0 / waiting for one more 0 (non-accepting)",
        },
        rule_fn=lambda s: ("00" in s) and ("11" in s),
        difficulty_target_samples=36,
    ))

    # Q20: Length divisible by 3 and end with 1
    questions.append(QuestionSpec(
        number=20,
        level="Level 4 – Medium",
        name="Length divisible by 3 and end with 1",
        slug="20_length_divisible_by_3_and_ends_with_1",
        description="Accepts strings over {0, 1} whose length is a multiple of 3 and which end with the symbol 1.",
        states=["q0", "q1", "q2", "qa"],
        start_state="q0",
        accept_states=["qa"],
        transitions={
            ("q0", "0"): "q1", ("q0", "1"): "q1",
            ("q1", "0"): "q2", ("q1", "1"): "q2",
            ("q2", "0"): "q0", ("q2", "1"): "qa",
            ("qa", "0"): "q1", ("qa", "1"): "q1",
        },
        state_meanings={
            "q0": "Length mod 3 == 0, but did not end with 1 (or empty string) (non-accepting)",
            "q1": "Length mod 3 == 1 (non-accepting)",
            "q2": "Length mod 3 == 2 (non-accepting)",
            "qa": "Length mod 3 == 0 and last symbol was 1 (accepting)",
        },
        rule_fn=lambda s: (len(s) % 3 == 0) and s.endswith("1"),
        difficulty_target_samples=32,
    ))

    return questions


def generate_candidate_strings(max_len: int = 6) -> List[str]:
    candidates = [""]
    for l in range(1, max_len + 1):
        for i in range(2**l):
            candidates.append(bin(i)[2:].zfill(l))
    return candidates


def generate_dataset_for_question(q: QuestionSpec) -> Tuple[List[str], List[str]]:
    """
    Selects balanced, diverse positive and negative samples covering:
    - Empty string epsilon
    - Single characters (0, 1)
    - Short strings (length 2 to 3)
    - Boundary and characteristic counterexamples
    - Medium strings (length 4 to 6)
    """
    all_candidates = generate_candidate_strings(max_len=6)
    
    positives = []
    negatives = []

    for s in all_candidates:
        acc = q.accepts(s)
        # Double check with rule_fn
        rule_acc = q.rule_fn(s)
        assert acc == rule_acc, f"DFA vs Rule mismatch for Q{q.number} on string '{s}' ({acc} vs {rule_acc})"
        if acc:
            positives.append(s)
        else:
            negatives.append(s)

    target_each = q.target_samples // 2

    # Prioritize:
    # 1. Shortest strings (essential for prefix tree / state exploration)
    # 2. Key representative strings
    selected_pos = positives[:target_each]
    selected_neg = negatives[:target_each]

    # Verify both sets are non-empty
    assert len(selected_pos) > 0, f"Q{q.number} has no positive samples!"
    assert len(selected_neg) > 0, f"Q{q.number} has no negative samples!"

    return selected_pos, selected_neg


def main():
    questions = get_all_questions()
    print(f"Loaded {len(questions)} questions.")

    summary_rows = []

    for q in questions:
        pos, neg = generate_dataset_for_question(q)
        total_samples = len(pos) + len(neg)

        # 1. Write CSV testcase
        csv_filename = f"{q.slug}.csv"
        csv_path = os.path.join(TESTCASES_DIR, csv_filename)
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["string", "label"])
            for p in pos:
                writer.writerow([p, 1])
            for n in neg:
                writer.writerow([n, 0])

        # 2. Write JSON Output DFA
        json_filename = f"{q.slug}.json"
        json_path = os.path.join(OUTPUT_DFA_DIR, json_filename)
        
        # Build transitions dict representation for JSON
        formatted_transitions = {}
        for (src, sym), tgt in q.transitions.items():
            formatted_transitions[f"{src},{sym}"] = tgt

        transition_table = []
        for state in q.states:
            transition_table.append({
                "state": state,
                "meaning": q.state_meanings.get(state, ""),
                "is_start": (state == q.start_state),
                "is_accept": (state in q.accept_states),
                "on_0": q.transitions.get((state, "0")),
                "on_1": q.transitions.get((state, "1")),
            })

        dfa_payload = {
            "question_number": q.number,
            "level": q.level,
            "title": q.name,
            "slug": q.slug,
            "description": q.description,
            "formal_definition": {
                "states": q.states,
                "alphabet": q.alphabet,
                "start_state": q.start_state,
                "accept_states": q.accept_states,
                "transitions": formatted_transitions,
            },
            "transition_table": transition_table,
            "metrics": {
                "num_states": len(q.states),
                "num_transitions": len(q.transitions),
                "is_complete": True,
                "is_minimal": True,
            },
            "testcase_summary": {
                "positive_count": len(pos),
                "negative_count": len(neg),
                "total_samples": total_samples,
                "csv_file": csv_filename,
            }
        }

        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(dfa_payload, f, indent=2)

        summary_rows.append({
            "no": q.number,
            "level": q.level,
            "name": q.name,
            "states": len(q.states),
            "start": q.start_state,
            "accept": ", ".join(q.accept_states),
            "csv": csv_filename,
            "pos": len(pos),
            "neg": len(neg),
        })

        print(f"Generated Q{q.number:02d}: {q.name} -> {len(q.states)} states, {total_samples} samples ({len(pos)}+ / {len(neg)}-)")

    # 3. Write README in testcases/
    testcases_readme = os.path.join(TESTCASES_DIR, "README.md")
    with open(testcases_readme, "w", encoding="utf-8") as f:
        f.write("# Automata Learning Studio — Benchmark Testcases CSVs\n\n")
        f.write("This directory contains balanced, verified testcase CSV files for all 20 benchmark questions across 4 difficulty levels.\n\n")
        f.write("| No. | Level | Question Name | Positive | Negative | Total | CSV File |\n")
        f.write("|:---:|:---|:---|:---:|:---:|:---:|:---|\n")
        for r in summary_rows:
            f.write(f"| {r['no']} | {r['level']} | {r['name']} | {r['pos']} | {r['neg']} | {r['pos']+r['neg']} | [`{r['csv']}`](./{r['csv']}) |\n")
        f.write("\nAll CSV files follow the standard `string,label` format compatible with the Automata Learning Studio frontend and backend preprocessor.\n")

    # 4. Write README in output_dfas/
    output_dfa_readme = os.path.join(OUTPUT_DFA_DIR, "README.md")
    with open(output_dfa_readme, "w", encoding="utf-8") as f:
        f.write("# Mathematically Minimal Ground-Truth DFAs\n\n")
        f.write("This directory contains the ground-truth minimal Deterministic Finite Automata (DFAs) for all 20 benchmark problems.\n")
        f.write("Each question includes formal 5-tuple definitions $(Q, \\Sigma, \\delta, q_0, F)$, state semantics, and transition tables.\n\n")
        f.write("| No. | Level | Problem Name | States | Start | Accept States | JSON Specification |\n")
        f.write("|:---:|:---|:---|:---:|:---:|:---:|:---|\n")
        for r in summary_rows:
            f.write(f"| {r['no']} | {r['level']} | {r['name']} | {r['states']} | `{r['start']}` | `{r['accept']}` | [`{r['csv'].replace('.csv', '.json')}`](./{r['csv'].replace('.csv', '.json')}) |\n")

    print("\nSuccessfully built all 20 testcase CSVs and 20 ground-truth DFA specifications!")

if __name__ == "__main__":
    main()
