# 🧪 Testcase Verification & Run Report

> **Automata Learning Studio — 20 Benchmark Problems**
>
> Each test case is verified against three sources of truth:
> 1. **CSV label** — the label stored in the testcase file (`1` = accept, `0` = reject)
> 2. **Reference DFA** — simulated from `output_dfas/*.json`
> 3. **Ground-truth rule** — Python function implementing the exact language definition

---

## 📊 Summary Table

| # | Level | Title | Total | +/- | DFA Acc% | Rule Acc% | DFA≡Rule% | HITL Queries | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Level 1 – Easy | End with 0 | 16 | 8/8 | 100.0% | 100.0% | 100.0% | 0 | ✅ PASS |
| 2 | Level 1 – Easy | Start with 1 | 16 | 8/8 | 100.0% | 100.0% | 100.0% | 0 | ✅ PASS |
| 3 | Level 1 – Easy | Contain at least one 0 | 15 | 8/7 | 100.0% | 100.0% | 100.0% | 0 | ✅ PASS |
| 4 | Level 1 – Easy | Contain exactly one 1 | 18 | 9/9 | 100.0% | 100.0% | 100.0% | 0 | ✅ PASS |
| 5 | Level 1 – Easy | Have an even number of 0s | 18 | 9/9 | 100.0% | 100.0% | 100.0% | 0 | ✅ PASS |
| 6 | Level 2 – Easy to Moderate | Have an odd number of 1s | 20 | 10/10 | 100.0% | 100.0% | 100.0% | 0 | ✅ PASS |
| 7 | Level 2 – Easy to Moderate | End with 01 | 22 | 11/11 | 100.0% | 100.0% | 100.0% | 0 | ✅ PASS |
| 8 | Level 2 – Easy to Moderate | Start with 0 and end with 1 | 24 | 12/12 | 100.0% | 100.0% | 100.0% | 0 | ✅ PASS |
| 9 | Level 2 – Easy to Moderate | Contain substring 00 | 22 | 11/11 | 100.0% | 100.0% | 100.0% | 0 | ✅ PASS |
| 10 | Level 2 – Easy to Moderate | Do not contain substring 11 | 22 | 11/11 | 100.0% | 100.0% | 100.0% | 0 | ✅ PASS |
| 11 | Level 3 – Moderate | Even number of 0s and even number of 1s | 28 | 14/14 | 100.0% | 100.0% | 100.0% | 0 | ✅ PASS |
| 12 | Level 3 – Moderate | Contain at least two consecutive 0s | 24 | 12/12 | 100.0% | 100.0% | 100.0% | 0 | ✅ PASS |
| 13 | Level 3 – Moderate | Number of 1s divisible by 3 | 26 | 13/13 | 100.0% | 100.0% | 100.0% | 0 | ✅ PASS |
| 14 | Level 3 – Moderate | End with 101 or 010 | 32 | 16/16 | 100.0% | 100.0% | 100.0% | 0 | ✅ PASS |
| 15 | Level 3 – Moderate | Contain exactly two occurrences of 0 | 26 | 13/13 | 100.0% | 100.0% | 100.0% | 0 | ✅ PASS |
| 16 | Level 4 – Medium | Even number of 0s and odd number of 1s | 28 | 14/14 | 100.0% | 100.0% | 100.0% | 0 | ✅ PASS |
| 17 | Level 4 – Medium | Do not contain substring 010 | 28 | 14/14 | 100.0% | 100.0% | 100.0% | 0 | ✅ PASS |
| 18 | Level 4 – Medium | Binary value divisible by 3 | 30 | 15/15 | 100.0% | 100.0% | 100.0% | 0 | ✅ PASS |
| 19 | Level 4 – Medium | Contain both substrings 00 and 11 | 36 | 18/18 | 100.0% | 100.0% | 100.0% | 0 | ✅ PASS |
| 20 | Level 4 – Medium | Length divisible by 3 and end with 1 | 32 | 16/16 | 100.0% | 100.0% | 100.0% | 0 | ✅ PASS |

**Tests Passed:** 20/20  |  **Tests Failed:** 0/20  |  **Total HITL Queries (DFA≠Rule):** 0

---

## 🔍 Per-Testcase Detailed Results

### Q01 — End with 0

- **Level:** Level 1 – Easy
- **Slug:** `01_ends_with_0`
- **Total samples:** 16  (8 positive, 8 negative)

#### Verification Metrics

| Metric | Value |
|---|---|
| CSV → DFA accuracy | **100.0%** (`8/8` TP, `8/8` TN) |
| CSV → Rule accuracy | **100.0%** (`8/8` TP, `8/8` TN) |
| DFA ≡ Rule agreement | **100.0%** |
| HITL queries needed (DFA≠Rule) | **0** |
| Overall verdict | **PASS** |

> ✅ **No mismatches** — DFA, CSV labels, and rule function all agree on every sample.

---

### Q02 — Start with 1

- **Level:** Level 1 – Easy
- **Slug:** `02_starts_with_1`
- **Total samples:** 16  (8 positive, 8 negative)

#### Verification Metrics

| Metric | Value |
|---|---|
| CSV → DFA accuracy | **100.0%** (`8/8` TP, `8/8` TN) |
| CSV → Rule accuracy | **100.0%** (`8/8` TP, `8/8` TN) |
| DFA ≡ Rule agreement | **100.0%** |
| HITL queries needed (DFA≠Rule) | **0** |
| Overall verdict | **PASS** |

> ✅ **No mismatches** — DFA, CSV labels, and rule function all agree on every sample.

---

### Q03 — Contain at least one 0

- **Level:** Level 1 – Easy
- **Slug:** `03_contains_at_least_one_0`
- **Total samples:** 15  (8 positive, 7 negative)

#### Verification Metrics

| Metric | Value |
|---|---|
| CSV → DFA accuracy | **100.0%** (`8/8` TP, `7/7` TN) |
| CSV → Rule accuracy | **100.0%** (`8/8` TP, `7/7` TN) |
| DFA ≡ Rule agreement | **100.0%** |
| HITL queries needed (DFA≠Rule) | **0** |
| Overall verdict | **PASS** |

> ✅ **No mismatches** — DFA, CSV labels, and rule function all agree on every sample.

---

### Q04 — Contain exactly one 1

- **Level:** Level 1 – Easy
- **Slug:** `04_contains_exactly_one_1`
- **Total samples:** 18  (9 positive, 9 negative)

#### Verification Metrics

| Metric | Value |
|---|---|
| CSV → DFA accuracy | **100.0%** (`9/9` TP, `9/9` TN) |
| CSV → Rule accuracy | **100.0%** (`9/9` TP, `9/9` TN) |
| DFA ≡ Rule agreement | **100.0%** |
| HITL queries needed (DFA≠Rule) | **0** |
| Overall verdict | **PASS** |

> ✅ **No mismatches** — DFA, CSV labels, and rule function all agree on every sample.

---

### Q05 — Have an even number of 0s

- **Level:** Level 1 – Easy
- **Slug:** `05_even_number_of_0s`
- **Total samples:** 18  (9 positive, 9 negative)

#### Verification Metrics

| Metric | Value |
|---|---|
| CSV → DFA accuracy | **100.0%** (`9/9` TP, `9/9` TN) |
| CSV → Rule accuracy | **100.0%** (`9/9` TP, `9/9` TN) |
| DFA ≡ Rule agreement | **100.0%** |
| HITL queries needed (DFA≠Rule) | **0** |
| Overall verdict | **PASS** |

> ✅ **No mismatches** — DFA, CSV labels, and rule function all agree on every sample.

---

### Q06 — Have an odd number of 1s

- **Level:** Level 2 – Easy to Moderate
- **Slug:** `06_odd_number_of_1s`
- **Total samples:** 20  (10 positive, 10 negative)

#### Verification Metrics

| Metric | Value |
|---|---|
| CSV → DFA accuracy | **100.0%** (`10/10` TP, `10/10` TN) |
| CSV → Rule accuracy | **100.0%** (`10/10` TP, `10/10` TN) |
| DFA ≡ Rule agreement | **100.0%** |
| HITL queries needed (DFA≠Rule) | **0** |
| Overall verdict | **PASS** |

> ✅ **No mismatches** — DFA, CSV labels, and rule function all agree on every sample.

---

### Q07 — End with 01

- **Level:** Level 2 – Easy to Moderate
- **Slug:** `07_ends_with_01`
- **Total samples:** 22  (11 positive, 11 negative)

#### Verification Metrics

| Metric | Value |
|---|---|
| CSV → DFA accuracy | **100.0%** (`11/11` TP, `11/11` TN) |
| CSV → Rule accuracy | **100.0%** (`11/11` TP, `11/11` TN) |
| DFA ≡ Rule agreement | **100.0%** |
| HITL queries needed (DFA≠Rule) | **0** |
| Overall verdict | **PASS** |

> ✅ **No mismatches** — DFA, CSV labels, and rule function all agree on every sample.

---

### Q08 — Start with 0 and end with 1

- **Level:** Level 2 – Easy to Moderate
- **Slug:** `08_starts_with_0_and_ends_with_1`
- **Total samples:** 24  (12 positive, 12 negative)

#### Verification Metrics

| Metric | Value |
|---|---|
| CSV → DFA accuracy | **100.0%** (`12/12` TP, `12/12` TN) |
| CSV → Rule accuracy | **100.0%** (`12/12` TP, `12/12` TN) |
| DFA ≡ Rule agreement | **100.0%** |
| HITL queries needed (DFA≠Rule) | **0** |
| Overall verdict | **PASS** |

> ✅ **No mismatches** — DFA, CSV labels, and rule function all agree on every sample.

---

### Q09 — Contain substring 00

- **Level:** Level 2 – Easy to Moderate
- **Slug:** `09_contains_substring_00`
- **Total samples:** 22  (11 positive, 11 negative)

#### Verification Metrics

| Metric | Value |
|---|---|
| CSV → DFA accuracy | **100.0%** (`11/11` TP, `11/11` TN) |
| CSV → Rule accuracy | **100.0%** (`11/11` TP, `11/11` TN) |
| DFA ≡ Rule agreement | **100.0%** |
| HITL queries needed (DFA≠Rule) | **0** |
| Overall verdict | **PASS** |

> ✅ **No mismatches** — DFA, CSV labels, and rule function all agree on every sample.

---

### Q10 — Do not contain substring 11

- **Level:** Level 2 – Easy to Moderate
- **Slug:** `10_does_not_contain_substring_11`
- **Total samples:** 22  (11 positive, 11 negative)

#### Verification Metrics

| Metric | Value |
|---|---|
| CSV → DFA accuracy | **100.0%** (`11/11` TP, `11/11` TN) |
| CSV → Rule accuracy | **100.0%** (`11/11` TP, `11/11` TN) |
| DFA ≡ Rule agreement | **100.0%** |
| HITL queries needed (DFA≠Rule) | **0** |
| Overall verdict | **PASS** |

> ✅ **No mismatches** — DFA, CSV labels, and rule function all agree on every sample.

---

### Q11 — Even number of 0s and even number of 1s

- **Level:** Level 3 – Moderate
- **Slug:** `11_even_0s_and_even_1s`
- **Total samples:** 28  (14 positive, 14 negative)

#### Verification Metrics

| Metric | Value |
|---|---|
| CSV → DFA accuracy | **100.0%** (`14/14` TP, `14/14` TN) |
| CSV → Rule accuracy | **100.0%** (`14/14` TP, `14/14` TN) |
| DFA ≡ Rule agreement | **100.0%** |
| HITL queries needed (DFA≠Rule) | **0** |
| Overall verdict | **PASS** |

> ✅ **No mismatches** — DFA, CSV labels, and rule function all agree on every sample.

---

### Q12 — Contain at least two consecutive 0s

- **Level:** Level 3 – Moderate
- **Slug:** `12_at_least_two_consecutive_0s`
- **Total samples:** 24  (12 positive, 12 negative)

#### Verification Metrics

| Metric | Value |
|---|---|
| CSV → DFA accuracy | **100.0%** (`12/12` TP, `12/12` TN) |
| CSV → Rule accuracy | **100.0%** (`12/12` TP, `12/12` TN) |
| DFA ≡ Rule agreement | **100.0%** |
| HITL queries needed (DFA≠Rule) | **0** |
| Overall verdict | **PASS** |

> ✅ **No mismatches** — DFA, CSV labels, and rule function all agree on every sample.

---

### Q13 — Number of 1s divisible by 3

- **Level:** Level 3 – Moderate
- **Slug:** `13_number_of_1s_divisible_by_3`
- **Total samples:** 26  (13 positive, 13 negative)

#### Verification Metrics

| Metric | Value |
|---|---|
| CSV → DFA accuracy | **100.0%** (`13/13` TP, `13/13` TN) |
| CSV → Rule accuracy | **100.0%** (`13/13` TP, `13/13` TN) |
| DFA ≡ Rule agreement | **100.0%** |
| HITL queries needed (DFA≠Rule) | **0** |
| Overall verdict | **PASS** |

> ✅ **No mismatches** — DFA, CSV labels, and rule function all agree on every sample.

---

### Q14 — End with 101 or 010

- **Level:** Level 3 – Moderate
- **Slug:** `14_ends_with_101_or_010`
- **Total samples:** 32  (16 positive, 16 negative)

#### Verification Metrics

| Metric | Value |
|---|---|
| CSV → DFA accuracy | **100.0%** (`16/16` TP, `16/16` TN) |
| CSV → Rule accuracy | **100.0%** (`16/16` TP, `16/16` TN) |
| DFA ≡ Rule agreement | **100.0%** |
| HITL queries needed (DFA≠Rule) | **0** |
| Overall verdict | **PASS** |

> ✅ **No mismatches** — DFA, CSV labels, and rule function all agree on every sample.

---

### Q15 — Contain exactly two occurrences of 0

- **Level:** Level 3 – Moderate
- **Slug:** `15_exactly_two_occurrences_of_0`
- **Total samples:** 26  (13 positive, 13 negative)

#### Verification Metrics

| Metric | Value |
|---|---|
| CSV → DFA accuracy | **100.0%** (`13/13` TP, `13/13` TN) |
| CSV → Rule accuracy | **100.0%** (`13/13` TP, `13/13` TN) |
| DFA ≡ Rule agreement | **100.0%** |
| HITL queries needed (DFA≠Rule) | **0** |
| Overall verdict | **PASS** |

> ✅ **No mismatches** — DFA, CSV labels, and rule function all agree on every sample.

---

### Q16 — Even number of 0s and odd number of 1s

- **Level:** Level 4 – Medium
- **Slug:** `16_even_0s_and_odd_1s`
- **Total samples:** 28  (14 positive, 14 negative)

#### Verification Metrics

| Metric | Value |
|---|---|
| CSV → DFA accuracy | **100.0%** (`14/14` TP, `14/14` TN) |
| CSV → Rule accuracy | **100.0%** (`14/14` TP, `14/14` TN) |
| DFA ≡ Rule agreement | **100.0%** |
| HITL queries needed (DFA≠Rule) | **0** |
| Overall verdict | **PASS** |

> ✅ **No mismatches** — DFA, CSV labels, and rule function all agree on every sample.

---

### Q17 — Do not contain substring 010

- **Level:** Level 4 – Medium
- **Slug:** `17_does_not_contain_substring_010`
- **Total samples:** 28  (14 positive, 14 negative)

#### Verification Metrics

| Metric | Value |
|---|---|
| CSV → DFA accuracy | **100.0%** (`14/14` TP, `14/14` TN) |
| CSV → Rule accuracy | **100.0%** (`14/14` TP, `14/14` TN) |
| DFA ≡ Rule agreement | **100.0%** |
| HITL queries needed (DFA≠Rule) | **0** |
| Overall verdict | **PASS** |

> ✅ **No mismatches** — DFA, CSV labels, and rule function all agree on every sample.

---

### Q18 — Binary value divisible by 3

- **Level:** Level 4 – Medium
- **Slug:** `18_binary_value_divisible_by_3`
- **Total samples:** 30  (15 positive, 15 negative)

#### Verification Metrics

| Metric | Value |
|---|---|
| CSV → DFA accuracy | **100.0%** (`15/15` TP, `15/15` TN) |
| CSV → Rule accuracy | **100.0%** (`15/15` TP, `15/15` TN) |
| DFA ≡ Rule agreement | **100.0%** |
| HITL queries needed (DFA≠Rule) | **0** |
| Overall verdict | **PASS** |

> ✅ **No mismatches** — DFA, CSV labels, and rule function all agree on every sample.

---

### Q19 — Contain both substrings 00 and 11

- **Level:** Level 4 – Medium
- **Slug:** `19_contains_both_00_and_11`
- **Total samples:** 36  (18 positive, 18 negative)

#### Verification Metrics

| Metric | Value |
|---|---|
| CSV → DFA accuracy | **100.0%** (`18/18` TP, `18/18` TN) |
| CSV → Rule accuracy | **100.0%** (`18/18` TP, `18/18` TN) |
| DFA ≡ Rule agreement | **100.0%** |
| HITL queries needed (DFA≠Rule) | **0** |
| Overall verdict | **PASS** |

> ✅ **No mismatches** — DFA, CSV labels, and rule function all agree on every sample.

---

### Q20 — Length divisible by 3 and end with 1

- **Level:** Level 4 – Medium
- **Slug:** `20_length_divisible_by_3_and_ends_with_1`
- **Total samples:** 32  (16 positive, 16 negative)

#### Verification Metrics

| Metric | Value |
|---|---|
| CSV → DFA accuracy | **100.0%** (`16/16` TP, `16/16` TN) |
| CSV → Rule accuracy | **100.0%** (`16/16` TP, `16/16` TN) |
| DFA ≡ Rule agreement | **100.0%** |
| HITL queries needed (DFA≠Rule) | **0** |
| Overall verdict | **PASS** |

> ✅ **No mismatches** — DFA, CSV labels, and rule function all agree on every sample.

---

## 📖 Methodology Notes

| Term | Meaning |
|---|---|
| **DFA Acc%** | Percentage of CSV samples where the reference DFA's accept/reject matches the CSV label |
| **Rule Acc%** | Percentage of CSV samples where the Python ground-truth rule matches the CSV label |
| **DFA≡Rule%** | Agreement between DFA simulation and rule function (100% = DFA is provably correct) |
| **HITL Queries** | Strings where DFA and rule disagree — these would trigger a human-in-the-loop question in L* HITL mode |
| **PASS** | DFA Acc = 100%, Rule Acc = 100%, HITL Queries = 0 (perfect triple agreement) |
| **FAIL** | Any discrepancy in the above three sources of truth |

> [!NOTE]
> An empty string (ε) is represented as an empty `string` field in the CSV.
> The rule functions correctly handle this case (e.g., `rule_05` returns `True` for ε since 0 zeros → even).
