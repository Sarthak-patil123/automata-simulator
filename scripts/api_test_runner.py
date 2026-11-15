"""
Direct In-Process API Test Runner — Automata Learning Studio
=============================================================
Calls the AutomataMLService directly (no HTTP) to avoid network
restrictions, while following the exact same API contract as
the server endpoints. Records all HITL questions and results.
"""

import os, sys, json, csv, time, uuid
from typing import List, Tuple

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from backend.api import AutomataMLService

TESTCASES_DIR = os.path.join(PROJECT_ROOT, "testcases")
REPORT_MD     = os.path.join(PROJECT_ROOT, "api_test_report.md")
REPORT_JSON   = os.path.join(PROJECT_ROOT, "api_test_report.json")

# ---------------------------------------------------------------------------
# Ground-truth rule functions
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
def rule_18(s): return True if s == "" else int(s, 2) % 3 == 0
def rule_19(s): return "00" in s and "11" in s
def rule_20(s): return len(s) % 3 == 0 and s.endswith("1")

RULES = [None, rule_01, rule_02, rule_03, rule_04, rule_05, rule_06,
         rule_07, rule_08, rule_09, rule_10, rule_11, rule_12, rule_13,
         rule_14, rule_15, rule_16, rule_17, rule_18, rule_19, rule_20]

SLUGS = [None,
    "01_ends_with_0", "02_starts_with_1", "03_contains_at_least_one_0",
    "04_contains_exactly_one_1", "05_even_number_of_0s", "06_odd_number_of_1s",
    "07_ends_with_01", "08_starts_with_0_and_ends_with_1", "09_contains_substring_00",
    "10_does_not_contain_substring_11", "11_even_0s_and_even_1s",
    "12_at_least_two_consecutive_0s", "13_number_of_1s_divisible_by_3",
    "14_ends_with_101_or_010", "15_exactly_two_occurrences_of_0",
    "16_even_0s_and_odd_1s", "17_does_not_contain_substring_010",
    "18_binary_value_divisible_by_3", "19_contains_both_00_and_11",
    "20_length_divisible_by_3_and_ends_with_1",
]

TITLES = [None,
    "End with 0", "Start with 1", "Contain at least one 0",
    "Contain exactly one 1", "Even number of 0s", "Odd number of 1s",
    "End with 01", "Start with 0 and end with 1", "Contain substring 00",
    "Do not contain substring 11", "Even 0s and even 1s",
    "At least two consecutive 0s", "Number of 1s divisible by 3",
    "End with 101 or 010", "Exactly two occurrences of 0",
    "Even 0s and odd 1s", "Do not contain substring 010",
    "Binary value divisible by 3", "Contain both 00 and 11",
    "Length divisible by 3 and end with 1",
]

LEVELS = [None,
    "Level 1 – Easy", "Level 1 – Easy", "Level 1 – Easy",
    "Level 1 – Easy", "Level 1 – Easy",
    "Level 2 – Easy to Moderate", "Level 2 – Easy to Moderate",
    "Level 2 – Easy to Moderate", "Level 2 – Easy to Moderate", "Level 2 – Easy to Moderate",
    "Level 3 – Moderate", "Level 3 – Moderate", "Level 3 – Moderate",
    "Level 3 – Moderate", "Level 3 – Moderate",
    "Level 4 – Medium", "Level 4 – Medium", "Level 4 – Medium",
    "Level 4 – Medium", "Level 4 – Medium",
]


def load_csv(slug):
    pos, neg = [], []
    with open(os.path.join(TESTCASES_DIR, f"{slug}.csv"), encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            if int(row["label"]) == 1:
                pos.append(row["string"])
            else:
                neg.append(row["string"])
    return pos, neg


def format_dur(s):
    return f"{s*1000:.0f}ms" if s < 1 else f"{s:.2f}s"


def test_question(service: AutomataMLService, q_num: int):
    slug  = SLUGS[q_num]
    rule  = RULES[q_num]
    title = TITLES[q_num]
    level = LEVELS[q_num]

    sid = str(uuid.uuid4())
    pos, neg = load_csv(slug)
    all_rows  = [(s, 1) for s in pos] + [(s, 0) for s in neg]

    result = {
        "q": q_num, "slug": slug, "title": title, "level": level,
        "session_id": sid, "pos_count": len(pos), "neg_count": len(neg),
        "total": len(all_rows),
        "timings": {}, "hitl_questions": [], "hitl_count": 0,
        "inference_engine": "", "first_pass_metrics": None, "final_metrics": None,
        "api_errors": [], "simulation_results": [],
        "final_accuracy_csv": 0.0, "final_accuracy_rule": 0.0,
        "dfa_states": None, "dfa_transitions": None,
        "initial_state": None, "accept_states": [],
        "data_quality_warning": None,
    }

    # ── 1. Preprocess CSV ────────────────────────────────────────────────
    with open(os.path.join(TESTCASES_DIR, f"{slug}.csv"), encoding="utf-8") as f:
        csv_text = f.read()
    t0 = time.time()
    try:
        pre = service.preprocess_csv(csv_text)
    except Exception as e:
        result["api_errors"].append(f"preprocess: {e}")
        result["status"] = "ERROR"
        return result
    result["timings"]["preprocess_csv"] = round(time.time() - t0, 4)
    alphabet = pre.get("alphabet", ["0", "1"])
    result["data_quality_warning"] = pre.get("data_quality_warning")

    # ── 2. Train model ───────────────────────────────────────────────────
    t0 = time.time()
    try:
        train_res = service.train_model(
            session_id=sid,
            model_type="dfa",
            positive_strings=pos,
            negative_strings=neg,
            alphabet=alphabet,
        )
    except Exception as e:
        result["api_errors"].append(f"train_model: {e}")
        result["status"] = "ERROR"
        return result
    result["timings"]["train_model"] = round(time.time() - t0, 4)
    result["inference_engine"]   = train_res.get("inference_engine", "?")
    result["first_pass_metrics"] = train_res.get("first_pass_metrics") or train_res.get("metrics")

    # ── 3. HITL loop ─────────────────────────────────────────────────────
    current_res  = train_res
    hitl_asked   = 0
    t_hitl_start = time.time()

    while current_res.get("hitl_status") == "NEED_MEMBERSHIP_QUERY" or \
          (current_res.get("needs_hitl") and "query_string" in current_res):
        query_str   = current_res.get("query_string", "")
        rule_answer = bool(rule(query_str))

        result["hitl_questions"].append({
            "question_number": hitl_asked + 1,
            "query_string":    repr(query_str) if query_str != "" else "ε (empty string)",
            "query_index":     current_res.get("query_index", hitl_asked + 1),
            "total_queries":   current_res.get("total_queries", "?"),
            "rule_answer":     rule_answer,
            "answered_as":     "ACCEPT" if rule_answer else "REJECT",
        })
        hitl_asked += 1

        t0 = time.time()
        try:
            current_res = service.answer_hitl_query(session_id=sid, is_accepted=rule_answer)
        except Exception as e:
            result["api_errors"].append(f"hitl_answer_{hitl_asked}: {e}")
            break
        result["timings"][f"hitl_answer_{hitl_asked}"] = round(time.time() - t0, 4)

    result["timings"]["hitl_total"] = round(time.time() - t_hitl_start, 4)
    result["hitl_count"] = hitl_asked

    # Extract final graph
    final_graph = (
        current_res.get("final_graph") or current_res.get("graph")
        or train_res.get("first_pass_graph")
    )
    result["final_metrics"] = current_res.get("metrics") or train_res.get("metrics") or train_res.get("first_pass_metrics")

    if final_graph:
        nodes = final_graph.get("nodes", [])
        edges = final_graph.get("edges", [])
        result["dfa_states"]      = len(nodes)
        result["dfa_transitions"] = len(edges)
        result["initial_state"]   = next((n["id"] for n in nodes if n.get("is_initial")), None)
        result["accept_states"]   = [n["id"] for n in nodes if n.get("is_accepting")]

    # ── 4. Simulate every string ─────────────────────────────────────────
    sim_csv_correct  = 0
    sim_rule_correct = 0
    simulation_log   = []

    t0 = time.time()
    for s, csv_lbl in all_rows:
        try:
            sim = service.simulate(session_id=sid, test_string=s)
        except Exception as e:
            simulation_log.append({
                "string": repr(s) if s else "ε",
                "csv_label": csv_lbl, "api_accepted": None,
                "rule_accepted": bool(rule(s)),
                "csv_match": False, "rule_match": False,
                "error": str(e),
            })
            continue

        api_acc  = sim.get("accepted", False)
        rule_acc = bool(rule(s))
        csv_match  = (1 if api_acc else 0) == csv_lbl
        rule_match = api_acc == rule_acc

        if csv_match:  sim_csv_correct  += 1
        if rule_match: sim_rule_correct += 1

        simulation_log.append({
            "string":       repr(s) if s else "ε",
            "csv_label":    csv_lbl,
            "api_accepted": api_acc,
            "rule_accepted":rule_acc,
            "csv_match":    csv_match,
            "rule_match":   rule_match,
        })

    result["timings"]["simulate_all"] = round(time.time() - t0, 4)
    result["simulation_results"]   = simulation_log
    result["final_accuracy_csv"]   = round(sim_csv_correct  / len(all_rows) * 100, 2) if all_rows else 0
    result["final_accuracy_rule"]  = round(sim_rule_correct / len(all_rows) * 100, 2) if all_rows else 0

    if result["api_errors"]:
        result["status"] = "ERROR"
    elif result["final_accuracy_csv"] == 100 and result["final_accuracy_rule"] == 100:
        result["status"] = "PASS"
    else:
        result["status"] = "FAIL"

    return result


# ---------------------------------------------------------------------------
# Markdown report builder
# ---------------------------------------------------------------------------
def build_report(results, total_time):
    total_pass  = sum(1 for r in results if r.get("status") == "PASS")
    total_fail  = sum(1 for r in results if r.get("status") == "FAIL")
    total_error = sum(1 for r in results if r.get("status") == "ERROR")
    total_hitl  = sum(r.get("hitl_count", 0) for r in results)

    lines = [
        "# 🌐 Live API End-to-End Test Report — Automata Learning Studio",
        "",
        f"> **Test Mode:** Direct `AutomataMLService` API (identical contract to HTTP server)",
        f">",
        f"> **Total runtime:** {format_dur(total_time)}  |  **Questions tested:** 20",
        ">",
        "> ### API Pipeline (per question)",
        "> ```",
        "> 1. service.preprocess_csv(csv_text)         → parse CSV, detect alphabet",
        "> 2. service.train_model(pos, neg, alphabet)   → SAT / RPNI warm-start → DFA",
        "> 3. service.answer_hitl_query(is_accepted)    → active-learning loop (if needed)",
        "> 4. service.simulate(session_id, string)×N   → test every sample string",
        "> ```",
        "> Active-learning questions are answered by the **ground-truth rule function**.",
        "",
        "---",
        "",
        "## 📊 Summary Table",
        "",
        "| # | Level | Title | +/− | HITL Qs | Engine | States | DFA Acc% | Rule Acc% | Time | Status |",
        "|---|---|---|---|---|---|---|---|---|---|---|",
    ]

    for r in results:
        if r.get("status") == "ERROR":
            lines.append(f"| {r['q']:02d} | {r.get('level','?')} | {r.get('title',r['slug'])} | — | — | — | — | — | — | — | ❌ ERROR |")
            continue
        st = "✅" if r["status"] == "PASS" else "⚠️"
        total_q_time = sum(v for v in r["timings"].values() if isinstance(v, (int, float)))
        engine = r.get("inference_engine", "?").split("(")[0].strip()
        lines.append(
            f"| {r['q']:02d} | {r['level']} | {r['title']} "
            f"| {r['pos_count']}/{r['neg_count']} "
            f"| {r['hitl_count']} "
            f"| {engine} "
            f"| {r.get('dfa_states','?')} "
            f"| {r['final_accuracy_csv']}% "
            f"| {r['final_accuracy_rule']}% "
            f"| {format_dur(total_q_time)} "
            f"| {st} {r['status']} |"
        )

    lines += [
        "",
        f"**Tests:** {total_pass} ✅ PASS  |  {total_fail} ⚠️ FAIL  |  {total_error} ❌ ERROR  |  "
        f"**Total HITL questions:** {total_hitl}  |  **Wall time:** {format_dur(total_time)}",
        "",
        "---",
        "",
        "## 🤖 Active Learning Summary (all HITL questions across all tests)",
        "",
    ]

    # Global HITL log
    any_hitl = False
    for r in results:
        if r.get("hitl_count", 0) > 0:
            any_hitl = True
            lines.append(f"### Q{r['q']:02d} — {r['title']}  ({r['hitl_count']} questions)")
            lines.append("")
            lines += [
                "| Q# | Query String | Answered As | Correct (rule) |",
                "|---|---|---|---|",
            ]
            for hq in r["hitl_questions"]:
                ans_sym = "✅ ACCEPT" if hq["rule_answer"] else "❌ REJECT"
                lines.append(
                    f"| {hq['question_number']} of {hq['total_queries']} "
                    f"| `{hq['query_string']}` "
                    f"| **{hq['answered_as']}** "
                    f"| {ans_sym} |"
                )
            lines.append("")

    if not any_hitl:
        lines.append("> ✅ **Zero HITL questions** were needed across all 20 tests — all models converged with 0 queries.\n")

    lines += [
        "---",
        "",
        "## 🔍 Per-Question Detailed Results",
        "",
    ]

    for r in results:
        q = r["q"]
        lines.append(f"### Q{q:02d} — {r['title']}")
        lines.append("")

        if r.get("status") == "ERROR":
            lines.append(f"> ❌ **Errors:** {'; '.join(r.get('api_errors', ['unknown']))}")
            lines += ["", "---", ""]
            continue

        total_q_time = sum(v for v in r["timings"].values() if isinstance(v, (int, float)))
        lines += [
            f"| Field | Value |",
            f"|---|---|",
            f"| **Status** | {'✅ PASS' if r['status'] == 'PASS' else '⚠️ FAIL'} |",
            f"| **Level** | {r['level']} |",
            f"| **Session ID** | `{r['session_id']}` |",
            f"| **Dataset** | {r['pos_count']} positive, {r['neg_count']} negative ({r['total']} total) |",
            f"| **Inference Engine** | {r.get('inference_engine', '?')} |",
            f"| **DFA States** | {r.get('dfa_states', '?')} |",
            f"| **DFA Transitions** | {r.get('dfa_transitions', '?')} |",
            f"| **Initial State** | `{r.get('initial_state', '?')}` |",
            f"| **Accept States** | `{r.get('accept_states', '?')}` |",
            f"| **Data Quality Warning** | {r.get('data_quality_warning') or '—'} |",
            f"| **Total time** | {format_dur(total_q_time)} |",
            "",
        ]

        # Timing
        lines += [
            "#### ⏱ API Call Timing",
            "",
            "| API Call | Time |",
            "|---|---|",
            f"| `preprocess_csv` | {format_dur(r['timings'].get('preprocess_csv', 0))} |",
            f"| `train_model` | {format_dur(r['timings'].get('train_model', 0))} |",
        ]
        for i in range(1, r["hitl_count"] + 1):
            k = f"hitl_answer_{i}"
            lines.append(f"| `answer_hitl_query` #{i} | {format_dur(r['timings'].get(k, 0))} |")
        if r["hitl_count"] > 0:
            lines.append(f"| HITL loop total | {format_dur(r['timings'].get('hitl_total', 0))} |")
        lines += [
            f"| `simulate` ×{r['total']} strings | {format_dur(r['timings'].get('simulate_all', 0))} |",
            f"| **Total** | **{format_dur(total_q_time)}** |",
            "",
        ]

        # Accuracy metrics
        fp = r.get("first_pass_metrics") or {}
        fn = r.get("final_metrics") or {}

        def fmt(v):
            if v is None or v == "?":
                return "—"
            if isinstance(v, float):
                return f"{v:.4f}"
            return str(v)

        lines += [
            "#### 📈 Accuracy Metrics",
            "",
            "| Metric | First Pass | After HITL |",
            "|---|---|---|",
            f"| Training accuracy | {fmt(fp.get('accuracy'))} | {fmt(fn.get('accuracy'))} |",
            f"| Precision | {fmt(fp.get('precision'))} | {fmt(fn.get('precision'))} |",
            f"| Recall | {fmt(fp.get('recall'))} | {fmt(fn.get('recall'))} |",
            f"| F1-Score | {fmt(fp.get('f1_score', fp.get('f1')))} | {fmt(fn.get('f1_score', fn.get('f1')))} |",
            f"| **Sim. vs CSV label** | — | **{r['final_accuracy_csv']}%** |",
            f"| **Sim. vs Rule fn** | — | **{r['final_accuracy_rule']}%** |",
            "",
        ]

        # HITL
        if r["hitl_count"] == 0:
            lines.append(f"> ✅ **No HITL questions** — model converged with 0 queries.\n")
        else:
            lines += [
                f"#### 🤖 Active Learning Questions ({r['hitl_count']} questions asked)",
                "",
                "| Q# | Query String | Answered As | Rule Answer |",
                "|---|---|---|---|",
            ]
            for hq in r["hitl_questions"]:
                ans_sym  = "✅ ACCEPT" if hq["rule_answer"] else "❌ REJECT"
                lines.append(
                    f"| {hq['question_number']} / {hq['total_queries']} "
                    f"| `{hq['query_string']}` "
                    f"| **{hq['answered_as']}** "
                    f"| {ans_sym} |"
                )
            lines.append("")

        # Mismatches
        mismatches = [s for s in r["simulation_results"] if not s.get("rule_match")]
        if mismatches:
            lines += [
                f"#### ⚠️ Simulation Mismatches ({len(mismatches)} strings where DFA ≠ Rule)",
                "",
                "| String | CSV Label | DFA Says | Rule Says |",
                "|---|---|---|---|",
            ]
            for m in mismatches:
                csv_sym  = "Accept" if m["csv_label"] == 1 else "Reject"
                dfa_sym  = "✅ Accept" if m.get("api_accepted") else "❌ Reject"
                rule_sym = "✅ Accept" if m["rule_accepted"] else "❌ Reject"
                lines.append(f"| `{m['string']}` | {csv_sym} | {dfa_sym} | {rule_sym} |")
            lines.append("")
        else:
            lines.append("> ✅ **All simulations match rule** — DFA correct on every test string.\n")

        lines += ["---", ""]

    # Methodology
    lines += [
        "## 📖 Methodology Notes",
        "",
        "| Term | Meaning |",
        "|---|---|",
        "| **HITL Qs** | Active-learning membership queries the model asked during training (max 4 per design) |",
        "| **Engine** | Inference algorithm: `SAT` = exact synthesis, `RPNI` = state-merging |",
        "| **DFA Acc%** | % of test strings where `simulate()` matches the CSV label |",
        "| **Rule Acc%** | % of test strings where `simulate()` matches the Python ground-truth rule |",
        "| **HITL oracle** | Rule function answers queries (simulates a perfect human expert) |",
        "| **PASS** | DFA Acc = 100% AND Rule Acc = 100% |",
        "",
        "> [!NOTE]",
        "> Each question runs in its own isolated session (`session_id = UUID4`).",
        "",
        "> [!TIP]",
        "> HITL questions are answered by calling the Python rule function — identical to what a",
        "> perfect human domain expert would answer.",
        "",
    ]

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=" * 65)
    print("  Automata Learning Studio — Direct API End-to-End Test Suite")
    print("=" * 65)
    print()
    print("  Initializing AutomataMLService...", end=" ", flush=True)
    t0 = time.time()
    service = AutomataMLService()
    print(f"✅ ({format_dur(time.time()-t0)})")
    print()

    overall_start = time.time()
    all_results   = []

    for q_num in range(1, 21):
        slug  = SLUGS[q_num]
        title = TITLES[q_num]
        print(f"  Q{q_num:02d} {title:<45}", end=" ", flush=True)
        r = test_question(service, q_num)
        all_results.append(r)
        st  = "✅" if r.get("status") == "PASS" else ("❌" if r.get("status") == "ERROR" else "⚠️ ")
        hq  = f"HITL={r.get('hitl_count',0)}" if r.get("hitl_count",0) > 0 else "HITL=0"
        print(f"{st} {r.get('status','?')}  DFA={r.get('final_accuracy_csv','?'):>6}%  Rule={r.get('final_accuracy_rule','?'):>6}%  {hq}")

        if r.get("api_errors"):
            for e in r["api_errors"]:
                print(f"       ⚠  {e}")

    total_time  = time.time() - overall_start
    total_pass  = sum(1 for r in all_results if r.get("status") == "PASS")
    total_fail  = sum(1 for r in all_results if r.get("status") == "FAIL")
    total_error = sum(1 for r in all_results if r.get("status") == "ERROR")
    total_hitl  = sum(r.get("hitl_count", 0) for r in all_results)

    print()
    print(f"  {'─'*61}")
    print(f"  TOTAL: {total_pass}/20 ✅ PASS  |  {total_fail} ⚠ FAIL  |  {total_error} ❌ ERROR")
    print(f"  HITL queries asked: {total_hitl} total across all 20 tests")
    print(f"  Wall time: {format_dur(total_time)}")
    print()

    # Save JSON
    with open(REPORT_JSON, "w", encoding="utf-8") as f:
        json.dump({
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "total_time_sec": round(total_time, 2),
            "summary": {"pass": total_pass, "fail": total_fail,
                        "error": total_error, "total_hitl": total_hitl},
            "results": all_results,
        }, f, indent=2, default=str)
    print(f"  📦 JSON data: {REPORT_JSON}")

    # Save MD
    md = build_report(all_results, total_time)
    with open(REPORT_MD, "w", encoding="utf-8") as f:
        f.write(md)
    print(f"  📄 Report:    {REPORT_MD}")
    print()


if __name__ == "__main__":
    main()
