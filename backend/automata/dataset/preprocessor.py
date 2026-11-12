"""
CSV Preprocessor Layer for Automata Learning
Parses, cleans, normalizes, and validates user-uploaded CSV files containing string samples and labels.
"""

import csv
import io
from typing import Dict, List, Set, Tuple, Optional, Any

POSITIVE_LABELS = {
    "1", "true", "t", "yes", "y", "accept", "accepted", "pos", "positive", "+", "acc"
}
NEGATIVE_LABELS = {
    "0", "false", "f", "no", "n", "reject", "rejected", "neg", "negative", "-", "rej"
}
EPSILON_REPRESENTATIONS = {"", "empty", "epsilon", "eps", "ε"}


def normalize_label(val: Any) -> Optional[bool]:
    """
    Normalizes diverse string/number representations into a boolean (True=positive, False=negative).
    Returns None if label is unrecognized or invalid.
    """
    if val is None:
        return None
    s = str(val).strip().lower()
    if s in POSITIVE_LABELS:
        return True
    if s in NEGATIVE_LABELS:
        return False
    return None


def normalize_string(val: Any) -> str:
    """
    Normalizes input string, trimming whitespace and resolving empty string / epsilon representations.
    """
    if val is None:
        return ""
    s = str(val).strip()
    if s.lower() in EPSILON_REPRESENTATIONS:
        return ""
    # Strip enclosing quotes if present
    if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
        s = s[1:-1]
    return s


def preprocess_csv_content(csv_text: str) -> Dict[str, Any]:
    """
    Parses raw CSV string content, auto-detects column mapping,
    extracts the alphabet, and returns clean positive and negative string lists.
    """
    if not csv_text or not csv_text.strip():
        return {
            "is_valid": False,
            "error": "CSV content is empty.",
            "positive_strings": [],
            "negative_strings": [],
            "alphabet": [],
            "total_samples": 0,
        }

    # Detect delimiter (comma, semicolon, tab)
    sample_snippet = csv_text[:2048]
    delimiter = ","
    try:
        sniffer = csv.Sniffer()
        dialect = sniffer.sniff(sample_snippet, delimiters=[",", ";", "\t", "|"])
        delimiter = dialect.delimiter
    except Exception:
        delimiter = ","

    f = io.StringIO(csv_text.strip())
    reader = list(csv.reader(f, delimiter=delimiter))

    if not reader:
        return {
            "is_valid": False,
            "error": "No data found in CSV.",
            "positive_strings": [],
            "negative_strings": [],
            "alphabet": [],
            "total_samples": 0,
        }

    # Determine headers vs raw data
    first_row = [c.strip().lower() for c in reader[0]]
    has_header = False
    str_col = 0
    label_col = 1

    # Check common header column names
    string_candidates = {
        "string", "input", "text", "word", "sample", "str", "w", "sequence",
        "binary_string", "binary", "s", "symbol", "token", "pattern",
    }
    label_candidates = {
        "label", "class", "accepted", "target", "output", "result", "is_valid", "valid", "y",
        "is_accepted", "is_divisible_by_3", "divisible", "accept", "matches", "match",
        "classification", "verdict",
    }

    for idx, col in enumerate(first_row):
        if col in string_candidates:
            str_col = idx
            has_header = True
        elif col in label_candidates:
            label_col = idx
            has_header = True

    # If first row contains non-data text headers
    if not has_header and len(first_row) >= 2:
        norm_test = normalize_label(first_row[1])
        if norm_test is None:
            # First row is likely header
            has_header = True
            str_col = 0
            label_col = 1

    data_rows = reader[1:] if has_header else reader

    pos_strings: Set[str] = set()
    neg_strings: Set[str] = set()
    alphabet: Set[str] = set()
    skipped_rows: List[Dict[str, Any]] = []
    preview_rows: List[Dict[str, Any]] = []

    for row_idx, row in enumerate(data_rows, start=2 if has_header else 1):
        if not row or all(not str(c).strip() for c in row):
            continue

        raw_str = row[str_col] if len(row) > str_col else ""
        raw_lbl = row[label_col] if len(row) > label_col else None

        clean_str = normalize_string(raw_str)
        bool_lbl = normalize_label(raw_lbl)

        if bool_lbl is None:
            skipped_rows.append({
                "line": row_idx,
                "raw_string": raw_str,
                "raw_label": raw_lbl,
                "reason": f"Unrecognized label '{raw_lbl}'. Expected 1/0, true/false, or accept/reject.",
            })
            continue

        if bool_lbl:
            pos_strings.add(clean_str)
        else:
            neg_strings.add(clean_str)

        # Update alphabet
        for char in clean_str:
            alphabet.add(char)

        if len(preview_rows) < 15:
            preview_rows.append({
                "string": clean_str if clean_str != "" else "ε",
                "label": "Accepted (1)" if bool_lbl else "Rejected (0)",
                "raw_label": raw_lbl,
            })

    sorted_pos = sorted(list(pos_strings), key=lambda s: (len(s), s))
    sorted_neg = sorted(list(neg_strings), key=lambda s: (len(s), s))
    sorted_alpha = sorted(list(alphabet)) if alphabet else ["0", "1"]

    total_valid = len(sorted_pos) + len(sorted_neg)
    is_valid = (len(sorted_pos) > 0 and len(sorted_neg) > 0)

    error_msg = None
    if not is_valid:
        if len(sorted_pos) == 0 and len(sorted_neg) == 0:
            error_msg = "No valid labeled strings could be extracted from the CSV."
        elif len(sorted_pos) == 0:
            error_msg = "CSV contains only negative strings (at least one positive sample is required)."
        elif len(sorted_neg) == 0:
            error_msg = "CSV contains only positive strings (at least one negative sample is required to prevent over-generalization)."

    return {
        "is_valid": is_valid,
        "error": error_msg,
        "total_samples": total_valid,
        "positive_count": len(sorted_pos),
        "negative_count": len(sorted_neg),
        "alphabet": sorted_alpha,
        "positive_strings": sorted_pos,
        "negative_strings": sorted_neg,
        "skipped_rows_count": len(skipped_rows),
        "skipped_rows": skipped_rows,
        "preview_rows": preview_rows,
    }

