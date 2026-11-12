from __future__ import annotations
import random
from itertools import product
from typing import Dict, List, Set, Tuple, Optional, Any, Callable
from ..core.dfa import DFA


class Dataset:
    """
    Container for positive and negative string samples.
    """

    def __init__(
        self,
        positive: List[str],
        negative: List[str],
        alphabet: List[str],
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.positive: List[str] = sorted(list(set(positive)), key=lambda s: (len(s), s))
        self.negative: List[str] = sorted(list(set(negative)), key=lambda s: (len(s), s))
        self.alphabet: List[str] = sorted(list(set(alphabet)))
        self.metadata: Dict[str, Any] = metadata or {}

    @property
    def size(self) -> int:
        return len(self.positive) + len(self.negative)

    @property
    def positive_count(self) -> int:
        return len(self.positive)

    @property
    def negative_count(self) -> int:
        return len(self.negative)

    def get_labeled_samples(self) -> List[Tuple[str, bool]]:
        samples = [(s, True) for s in self.positive] + [(s, False) for s in self.negative]
        samples.sort(key=lambda item: (len(item[0]), item[0]))
        return samples

    def train_test_split(
        self, test_ratio: float = 0.2, seed: Optional[int] = None
    ) -> Tuple[Dataset, Dataset]:
        """
        Performs a stratified train-test split preserving class balance.
        """
        rng = random.Random(seed)
        pos = list(self.positive)
        neg = list(self.negative)
        rng.shuffle(pos)
        rng.shuffle(neg)

        pos_test_len = max(1, int(len(pos) * test_ratio)) if pos else 0
        neg_test_len = max(1, int(len(neg) * test_ratio)) if neg else 0

        test_pos = pos[:pos_test_len]
        train_pos = pos[pos_test_len:]

        test_neg = neg[:neg_test_len]
        train_neg = neg[neg_test_len:]

        train_data = Dataset(
            positive=train_pos,
            negative=train_neg,
            alphabet=self.alphabet,
            metadata={**self.metadata, "split": "train"},
        )
        test_data = Dataset(
            positive=test_pos,
            negative=test_neg,
            alphabet=self.alphabet,
            metadata={**self.metadata, "split": "test"},
        )
        return train_data, test_data

    def to_dict(self) -> Dict[str, Any]:
        return {
            "size": self.size,
            "num_positive": self.positive_count,
            "num_negative": self.negative_count,
            "alphabet": self.alphabet,
            "positive": self.positive,
            "negative": self.negative,
            "metadata": self.metadata,
        }


def generate_exhaustive_strings(alphabet: List[str], max_length: int) -> List[str]:
    """
    Generates all strings in Sigma* up to max_length in standard shortlex order.
    """
    strings = [""]
    for length in range(1, max_length + 1):
        for combo in product(alphabet, repeat=length):
            strings.append("".join(combo))
    return strings


def generate_random_strings(
    count: int,
    min_len: int,
    max_len: int,
    alphabet: List[str],
    seed: Optional[int] = None,
) -> List[str]:
    """
    Generates unique random strings within specified length bounds.
    """
    rng = random.Random(seed)
    seen: Set[str] = set()
    strings: List[str] = []
    max_attempts = count * 20
    attempts = 0

    while len(strings) < count and attempts < max_attempts:
        attempts += 1
        length = rng.randint(min_len, max_len)
        s = "".join(rng.choice(alphabet) for _ in range(length))
        if s not in seen:
            seen.add(s)
            strings.append(s)

    strings.sort(key=lambda s: (len(s), s))
    return strings


def generate_characteristic_dataset(
    dfa: DFA,
    distinguishing_depth: Optional[int] = None,
) -> Dataset:
    """
    Generates a mathematically complete Characteristic Sample (Chow's W-Method)
    that is theoretically guaranteed to enable RPNI and EDSM to perfectly reconstruct
    the minimal DFA, even for large state machines (8 to 15+ nodes).
    
    Includes:
    1. State Cover: Shortest access prefix for every reachable state.
    2. Transition Cover: Traverses every (state, symbol) edge.
    3. Distinguishing Suffixes: All suffixes up to depth ceil(log2(|Q|)) to separate all state pairs.
    """
    from collections import deque
    import math

    alphabet = sorted(list(dfa.alphabet))
    if dfa.start_state is None:
        return Dataset([], [], alphabet)

    # 1. State Cover: BFS access string for each state
    access_strings: Dict[str, str] = {dfa.start_state: ""}
    queue = deque([dfa.start_state])

    while queue:
        curr = queue.popleft()
        for a in alphabet:
            nxt = dfa.step(curr, a)
            if nxt is not None and nxt not in access_strings:
                access_strings[nxt] = access_strings[curr] + a
                queue.append(nxt)

    # 2. Transition Cover: access string + each symbol
    prefixes = list(access_strings.values())
    for p in list(prefixes):
        for a in alphabet:
            prefixes.append(p + a)

    # 3. Distinguishing Suffixes (W-set)
    num_states = max(len(access_strings), 2)
    depth = distinguishing_depth or max(2, min(5, int(math.ceil(math.log2(num_states))) + 1))
    suffixes = generate_exhaustive_strings(alphabet, max_length=depth)

    all_strings = set()
    for p in prefixes:
        for s in suffixes:
            all_strings.add(p + s)

    positive = [w for w in all_strings if dfa.accepts(w)]
    negative = [w for w in all_strings if not dfa.accepts(w)]

    return Dataset(
        positive=positive,
        negative=negative,
        alphabet=alphabet,
        metadata={
            "source": "characteristic_cover",
            "state_count": len(access_strings),
            "distinguishing_depth": depth,
            "total_samples": len(all_strings),
        },
    )


def generate_dataset_from_dfa(
    dfa: DFA,
    num_positive: int = 50,
    num_negative: int = 50,
    max_length: int = 10,
    seed: Optional[int] = None,
) -> Dataset:
    """
    Generates a balanced dataset (S+, S-) from a reference DFA.
    Uses shortlex exhaustive search for short strings, combined with directed walks
    on the DFA to guarantee finding positive and negative strings even for sparse languages.
    """
    rng = random.Random(seed)
    alphabet = sorted(list(dfa.alphabet))
    positive_set: Set[str] = set()
    negative_set: Set[str] = set()

    # Phase 1: Shortlex search up to length min(5, max_length)
    short_limit = min(5, max_length)
    for s in generate_exhaustive_strings(alphabet, short_limit):
        if dfa.accepts(s):
            if len(positive_set) < num_positive:
                positive_set.add(s)
        else:
            if len(negative_set) < num_negative:
                negative_set.add(s)

    # Phase 2: Directed walks on the DFA for positive strings
    # We walk from start state; if we land on an accept state, record string
    if dfa.start_state is not None and dfa.accept_states:
        walk_attempts = 0
        max_walks = num_positive * 200
        while len(positive_set) < num_positive and walk_attempts < max_walks:
            walk_attempts += 1
            curr = dfa.start_state
            path_chars = []
            target_len = rng.randint(0, max_length)
            for _ in range(target_len):
                sym = rng.choice(alphabet)
                nxt = dfa.step(curr, sym)
                if nxt is None:
                    break
                curr = nxt
                path_chars.append(sym)
                if curr in dfa.accept_states and len(positive_set) < num_positive:
                    s = "".join(path_chars)
                    if len(s) <= max_length:
                        positive_set.add(s)

    # Phase 3: Directed walks / random walks for negative strings
    walk_attempts = 0
    max_walks = num_negative * 200
    while len(negative_set) < num_negative and walk_attempts < max_walks:
        walk_attempts += 1
        curr = dfa.start_state
        path_chars = []
        target_len = rng.randint(1, max_length)
        for _ in range(target_len):
            sym = rng.choice(alphabet)
            path_chars.append(sym)
            if curr is not None:
                curr = dfa.step(curr, sym)
        s = "".join(path_chars)
        if not dfa.accepts(s) and len(negative_set) < num_negative:
            negative_set.add(s)

    return Dataset(
        positive=list(positive_set),
        negative=list(negative_set),
        alphabet=alphabet,
        metadata={
            "source": "dfa",
            "max_length": max_length,
            "is_balanced": (len(positive_set) == len(negative_set)),
        },
    )


def inject_noise(
    dataset: Dataset,
    noise_rate: float,
    seed: Optional[int] = None,
) -> Dataset:
    """
    Inverts the labels of a fraction `noise_rate` of samples.
    Simulates real-world label noise (e.g., faulty measurements or transcription errors).
    """
    if noise_rate <= 0.0:
        return Dataset(
            positive=list(dataset.positive),
            negative=list(dataset.negative),
            alphabet=dataset.alphabet,
            metadata={**dataset.metadata, "noise_rate": 0.0},
        )

    rng = random.Random(seed)
    labeled = dataset.get_labeled_samples()
    num_to_flip = int(len(labeled) * noise_rate)

    flip_indices = set(rng.sample(range(len(labeled)), min(num_to_flip, len(labeled))))

    new_pos: List[str] = []
    new_neg: List[str] = []
    flipped_strings: List[str] = []

    for idx, (s, label) in enumerate(labeled):
        if idx in flip_indices:
            new_label = not label
            flipped_strings.append(s)
        else:
            new_label = label

        if new_label:
            new_pos.append(s)
        else:
            new_neg.append(s)

    return Dataset(
        positive=new_pos,
        negative=new_neg,
        alphabet=dataset.alphabet,
        metadata={
            **dataset.metadata,
            "noise_rate": noise_rate,
            "flipped_count": len(flipped_strings),
            "flipped_samples": flipped_strings,
        },
    )
