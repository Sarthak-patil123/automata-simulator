"""
Dataset Generator & Benchmark Package
"""

from .tomita import TomitaLanguage, get_tomita_language, list_tomita_languages
from .generator import (
    Dataset,
    generate_exhaustive_strings,
    generate_random_strings,
    generate_dataset_from_dfa,
    generate_characteristic_dataset,
    inject_noise,
)

__all__ = [
    "TomitaLanguage",
    "get_tomita_language",
    "list_tomita_languages",
    "Dataset",
    "generate_exhaustive_strings",
    "generate_random_strings",
    "generate_dataset_from_dfa",
    "generate_characteristic_dataset",
    "inject_noise",
]

