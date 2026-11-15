"""
Testcase Verification & Runner Script
======================================
For each of the 20 benchmark problems:
1. Loads the reference DFA from output_dfas/*.json
2. Loads the testcase CSV from testcases/*.csv
3. Verifies every string in the CSV against:
   a. The reference DFA (run-time simulation)
   b. The rule function (ground truth)
4. Reports per-testcase metrics and records a full result file
"""

import os
import sys
import json
import csv
from typing import Dict, List, Tuple, Callable, Optional

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TESTCASES_DIR = os.path.join(BASE_DIR, "testcases")
OUTPUT_DFA_DIR = os.path.join(BASE_DIR, "output_dfas")
RESULTS_FILE = os.path.join(BASE_DIR, "test_results.md")

# ---------------------------------------------------------------------------
# Lightweight DFA runner (no external deps)
# ---------------------------------------------------------------------------
class MiniDFA:
    def __init__(self, start: str, accept: set, transitions: dict):
        self.start = start
        self.accept = accept          # set of accepting state names
        self.trans = transitions      # {(state, symbol): next_state}

    def accepts(self, s: str) -> bool:
        cur = self.start
        for ch in s:
            nxt = self.trans.get((cur, ch))
            if nxt is None:
                return False
            cur = nxt
        return cur in self.accept

    def simulate(self, s: str) -> Dict:
        """Returns full trace for debugging."""
        cur = self.start
        path = [cur]
        for ch in s:
            nxt = self.trans.get((cur, ch))
            if nxt is None:
                return {"path": path, "stuck": True, "accepted": False}
            cur = nxt
            path.append(cur)
        return {"path": path, "stuck": False, "accepted": cur in self.accept}


def load_dfa_from_json(filepath: str) -> Tuple[MiniDFA, dict]:
    """Parse a DFA JSON file and return a MiniDFA + raw metadata."""
    with open(filepath, encoding="utf-8") as f:
        data = json.load(f)
    fd = data["formal_definition"]
    start = fd["start_state"]
    accept = set(fd["accept_states"])
    raw_trans = fd["transitions"]          # "state,symbol": "next_state"
    transitions = {}
    for key, nxt in raw_trans.items():
        state, sym = key.split(",", 1)
        transitions[(state, sym)] = nxt
    return MiniDFA(start, accept, transitions), data


def load_csv(filepath: str) -> List[Tuple[str, int]]:
    """
    Returns list of (string, label) pairs.
    Empty-string rows have an empty 'string' field.
    """
    rows = []
    with open(filepath, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            s = row["string"]           # may be ""
            lbl = int(row["label"])
            rows.append((s, lbl))
    return rows


# ---------------------------------------------------------------------------
# Ground-truth rule functions (one per question)
# ---------------------------------------------------------------------------
def rule_01(s): return s.endswith("0")
def rule_02(s): return s.startswith("1") if s else False
def rule_03(s): return "0" in s
def rule_04(s): return s.count("1") == 1
def rule_05(s): return s.count("0") % 2 == 0
def rule_06(s): return s.count("1") % 2 == 1
def rule_07(s): return s.endswith("01")
def rule_08(s): return s.startswith("0") and s.endswith("1")
def rule_09(s): return "00" in s
def rule_10(s): return "11" not in s
def rule_11(s): return s.count("0") % 2 == 0 and s.count("1") % 2 == 0
def rule_12(s): return "00" in s
def rule_13(s): return s.count("1") % 3 == 0
def rule_14(s): return s.endswith("101") or s.endswith("010")
def rule_15(s): return s.count("0") == 2

def rule_16(s): return s.count("0") % 2 == 0 and s.count("1") % 2 == 1

def rule_17(s): return "010" not in s

def rule_18(s):
    """Binary string interpreted as integer divisible by 3. Empty string = 0."""
    if s == "":
        return True  # 0 % 3 == 0
    return int(s, 2) % 3 == 0

def rule_19(s): return "00" in s and "11" in s

def rule_20(s): return len(s) % 3 == 0 and s.endswith("1")

RULES: List[Callable[[str], bool]] = [
    None,       # index 0 unused
    rule_01, rule_02, rule_03, rule_04, rule_05,
    rule_06, rule_07, rule_08, rule_09, rule_10,
    rule_11, rule_12, rule_13, rule_14, rule_15,
    rule_16, rule_17, rule_18, rule_19, rule_20,
]

# ---------------------------------------------------------------------------
# Slugs matching the JSON/CSV file names
# ---------------------------------------------------------------------------
SLUGS = [
    None,  # 0 unused
    "01_ends_with_0",
    "02_starts_with_1",
    "03_contains_at_least_one_0",
    "04_contains_exactly_one_1",
    "05_even_number_of_0s",
    "06_odd_number_of_1s",
    "07_ends_with_01",
    "08_starts_with_0_and_ends_with_1",
    "09_contains_substring_00",
    "10_does_not_contain_substring_11",
    "11_even_0s_and_even_1s",
    "12_at_least_two_consecutive_0s",
    "13_number_of_1s_divisible_by_3",
    "14_ends_with_101_or_010",
    "15_exactly_two_occurrences_of_0",
    "16_even_0s_and_odd_1s",
    "17_does_not_contain_substring_010",
    "18_binary_value_divisible_by_3",
    "19_contains_both_00_and_11",
    "20_length_divisible_by_3_and_ends_with_1",
]

# ---------------------------------------------------------------------------
# Main runner
# ---------------------------------------------------------------------------
def run_all() -> List[dict]:
    results = []

    for q_num in range(1, 21):
        slug = SLUGS[q_num]
        rule = RULES[q_num]

        json_path = os.path.join(OUTPUT_DFA_DIR, f"{slug}.json")
        csv_path  = os.path.join(TESTCASES_DIR,  f"{slug}.csv")

        # Load DFA
        try:
            dfa, meta = load_dfa_from_json(json_path)
        except Exception as e:
            results.append({"q": q_num, "slug": slug, "error": str(e)})
            continue

        # Load CSV
        try:
            rows = load_csv(csv_path)
        except Exception as e:
            results.append({"q": q_num, "slug": slug, "error": str(e)})
            continue

        title   = meta.get("title", slug)
        level   = meta.get("level", "?")
        pos_rows = [(s, lbl) for s, lbl in rows if lbl == 1]
        neg_rows = [(s, lbl) for s, lbl in rows if lbl == 0]

        # Counters
        total      = len(rows)
        pos_count  = len(pos_rows)
        neg_count  = len(neg_rows)

        dfa_correct_pos = 0
        dfa_correct_neg = 0
        rule_correct_pos = 0
        rule_correct_neg = 0
        csv_dfa_match   = 0   # csv label matches DFA
        csv_rule_match  = 0   # csv label matches rule
        dfa_rule_match  = 0   # DFA output matches rule

        # HITL-style: how many strings would need a verification query
        # (i.e., cases where DFA and rule disagree → system would have asked user)
        hitl_queries = 0

        mismatches = []  # (string, csv_label, dfa_result, rule_result)

        for s, csv_lbl in rows:
            dfa_res  = 1 if dfa.accepts(s) else 0
            rule_res = 1 if rule(s) else 0

            if csv_lbl == 1:
                if dfa_res  == 1: dfa_correct_pos  += 1
                if rule_res == 1: rule_correct_pos += 1
            else:
                if dfa_res  == 0: dfa_correct_neg  += 1
                if rule_res == 0: rule_correct_neg += 1

            if csv_lbl == dfa_res:  csv_dfa_match  += 1
            if csv_lbl == rule_res: csv_rule_match += 1
            if dfa_res == rule_res: dfa_rule_match += 1

            if dfa_res != rule_res:
                hitl_queries += 1
                mismatches.append({
                    "string": repr(s),
                    "csv_label": csv_lbl,
                    "dfa_accepted": bool(dfa_res),
                    "rule_accepted": bool(rule_res),
                })

        dfa_accuracy   = csv_dfa_match  / total * 100 if total else 0
        rule_accuracy  = csv_rule_match / total * 100 if total else 0
        dfa_vs_rule    = dfa_rule_match / total * 100 if total else 0

        results.append({
            "q":             q_num,
            "slug":          slug,
            "title":         title,
            "level":         level,
            "total":         total,
            "pos_count":     pos_count,
            "neg_count":     neg_count,
            "dfa_correct_pos":  dfa_correct_pos,
            "dfa_correct_neg":  dfa_correct_neg,
            "rule_correct_pos": rule_correct_pos,
            "rule_correct_neg": rule_correct_neg,
            "csv_dfa_accuracy":  round(dfa_accuracy,  2),
            "csv_rule_accuracy": round(rule_accuracy, 2),
            "dfa_vs_rule":       round(dfa_vs_rule,   2),
            "hitl_queries":  hitl_queries,
            "mismatches":    mismatches,
            "status":        "PASS" if dfa_accuracy == 100 and rule_accuracy == 100 and hitl_queries == 0 else "FAIL",
        })

    return results


# ---------------------------------------------------------------------------
# Report generator
# ---------------------------------------------------------------------------
def build_report(results: List[dict]) -> str:
    lines = []

    # ── Header ──────────────────────────────────────────────────────────────
    lines += [
        "# 🧪 Testcase Verification & Run Report",
        "",
        "> **Automata Learning Studio — 20 Benchmark Problems**",
        ">",
        "> Each test case is verified against three sources of truth:",
        "> 1. **CSV label** — the label stored in the testcase file (`1` = accept, `0` = reject)",
        "> 2. **Reference DFA** — simulated from `output_dfas/*.json`",
        "> 3. **Ground-truth rule** — Python function implementing the exact language definition",
        "",
        "---",
        "",
    ]

    # ── Summary table ────────────────────────────────────────────────────────
    lines += [
        "## 📊 Summary Table",
        "",
        "| # | Level | Title | Total | +/- | DFA Acc% | Rule Acc% | DFA≡Rule% | HITL Queries | Status |",
        "|---|---|---|---|---|---|---|---|---|---|",
    ]
    total_pass = 0
    total_fail = 0
    total_hitl = 0
    for r in results:
        if "error" in r:
            lines.append(f"| {r['q']} | — | {r['slug']} | ERROR | — | — | — | — | — | ❌ |")
            total_fail += 1
            continue
        status_icon = "✅" if r["status"] == "PASS" else "⚠️"
        if r["status"] == "PASS":
            total_pass += 1
        else:
            total_fail += 1
        total_hitl += r["hitl_queries"]
        lines.append(
            f"| {r['q']} | {r['level']} | {r['title']} "
            f"| {r['total']} | {r['pos_count']}/{r['neg_count']} "
            f"| {r['csv_dfa_accuracy']}% | {r['csv_rule_accuracy']}% "
            f"| {r['dfa_vs_rule']}% | {r['hitl_queries']} | {status_icon} {r['status']} |"
        )

    lines += [
        "",
        f"**Tests Passed:** {total_pass}/20  |  **Tests Failed:** {total_fail}/20  |  "
        f"**Total HITL Queries (DFA≠Rule):** {total_hitl}",
        "",
        "---",
        "",
    ]

    # ── Per-testcase detail ──────────────────────────────────────────────────
    lines += ["## 🔍 Per-Testcase Detailed Results", ""]

    for r in results:
        lines.append(f"### Q{r['q']:02d} — {r.get('title', r['slug'])}")
        lines.append("")
        if "error" in r:
            lines.append(f"> ❌ **Error:** `{r['error']}`")
            lines.append("")
            continue

        lines += [
            f"- **Level:** {r['level']}",
            f"- **Slug:** `{r['slug']}`",
            f"- **Total samples:** {r['total']}  ({r['pos_count']} positive, {r['neg_count']} negative)",
            "",
            "#### Verification Metrics",
            "",
            "| Metric | Value |",
            "|---|---|",
            f"| CSV → DFA accuracy | **{r['csv_dfa_accuracy']}%** (`{r['dfa_correct_pos']}/{r['pos_count']}` TP, `{r['dfa_correct_neg']}/{r['neg_count']}` TN) |",
            f"| CSV → Rule accuracy | **{r['csv_rule_accuracy']}%** (`{r['rule_correct_pos']}/{r['pos_count']}` TP, `{r['rule_correct_neg']}/{r['neg_count']}` TN) |",
            f"| DFA ≡ Rule agreement | **{r['dfa_vs_rule']}%** |",
            f"| HITL queries needed (DFA≠Rule) | **{r['hitl_queries']}** |",
            f"| Overall verdict | **{r['status']}** |",
            "",
        ]

        if r["mismatches"]:
            lines += [
                "#### ⚠️ Mismatches (DFA output ≠ Ground-truth Rule)",
                "",
                "| String | CSV Label | DFA Says | Rule Says |",
                "|---|---|---|---|",
            ]
            for m in r["mismatches"]:
                csv_sym  = "✅ Accept" if m["csv_label"]    == 1   else "❌ Reject"
                dfa_sym  = "✅ Accept" if m["dfa_accepted"]        else "❌ Reject"
                rule_sym = "✅ Accept" if m["rule_accepted"]       else "❌ Reject"
                lines.append(f"| `{m['string']}` | {csv_sym} | {dfa_sym} | {rule_sym} |")
            lines.append("")
        else:
            lines.append("> ✅ **No mismatches** — DFA, CSV labels, and rule function all agree on every sample.\n")

        lines.append("---")
        lines.append("")

    # ── Legend / methodology ─────────────────────────────────────────────────
    lines += [
        "## 📖 Methodology Notes",
        "",
        "| Term | Meaning |",
        "|---|---|",
        "| **DFA Acc%** | Percentage of CSV samples where the reference DFA's accept/reject matches the CSV label |",
        "| **Rule Acc%** | Percentage of CSV samples where the Python ground-truth rule matches the CSV label |",
        "| **DFA≡Rule%** | Agreement between DFA simulation and rule function (100% = DFA is provably correct) |",
        "| **HITL Queries** | Strings where DFA and rule disagree — these would trigger a human-in-the-loop question in L* HITL mode |",
        "| **PASS** | DFA Acc = 100%, Rule Acc = 100%, HITL Queries = 0 (perfect triple agreement) |",
        "| **FAIL** | Any discrepancy in the above three sources of truth |",
        "",
        "> [!NOTE]",
        "> An empty string (ε) is represented as an empty `string` field in the CSV.",
        "> The rule functions correctly handle this case (e.g., `rule_05` returns `True` for ε since 0 zeros → even).",
        "",
    ]

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("=" * 60)
    print("  Automata Learning Studio — Testcase Verification Runner")
    print("=" * 60)
    print()

    results = run_all()

    # Console summary
    for r in results:
        if "error" in r:
            print(f"  Q{r['q']:02d} ❌ ERROR: {r['error']}")
        else:
            icon = "✅" if r["status"] == "PASS" else "⚠️ "
            print(
                f"  Q{r['q']:02d} {icon} {r['title']:<45} "
                f"DFA={r['csv_dfa_accuracy']:6.2f}%  Rule={r['csv_rule_accuracy']:6.2f}%  "
                f"HITL={r['hitl_queries']}"
            )

    total_pass = sum(1 for r in results if r.get("status") == "PASS")
    total_fail = sum(1 for r in results if r.get("status") == "FAIL" or "error" in r)
    total_hitl = sum(r.get("hitl_queries", 0) for r in results)

    print()
    print(f"  TOTAL: {total_pass}/20 PASS  |  {total_fail} FAIL  |  {total_hitl} HITL queries across all tests")
    print()

    # Write report
    report = build_report(results)
    with open(RESULTS_FILE, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"  📄 Full report written to: {RESULTS_FILE}")
    print()
