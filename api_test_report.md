# 🌐 Live API End-to-End Test Report — Automata Learning Studio

> **Test Mode:** Direct `AutomataMLService` API (identical contract to HTTP server)
>
> **Total runtime:** 7.62s  |  **Questions tested:** 20
>
> ### API Pipeline (per question)
> ```
> 1. service.preprocess_csv(csv_text)         → parse CSV, detect alphabet
> 2. service.train_model(pos, neg, alphabet)   → SAT / RPNI warm-start → DFA
> 3. service.answer_hitl_query(is_accepted)    → active-learning loop (if needed)
> 4. service.simulate(session_id, string)×N   → test every sample string
> ```
> Active-learning questions are answered by the **ground-truth rule function**.

---

## 📊 Summary Table

| # | Level | Title | +/− | HITL Qs | Engine | States | DFA Acc% | Rule Acc% | Time | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| 01 | Level 1 – Easy | End with 0 | 8/8 | 0 | Exact SAT | 2 | 100.0% | 100.0% | 4ms | ✅ PASS |
| 02 | Level 1 – Easy | Start with 1 | 8/8 | 0 | Exact SAT | 3 | 100.0% | 100.0% | 7ms | ✅ PASS |
| 03 | Level 1 – Easy | Contain at least one 0 | 8/7 | 0 | Exact SAT | 2 | 100.0% | 100.0% | 3ms | ✅ PASS |
| 04 | Level 1 – Easy | Contain exactly one 1 | 9/9 | 2 | Exact SAT | 3 | 100.0% | 100.0% | 33ms | ✅ PASS |
| 05 | Level 1 – Easy | Even number of 0s | 9/9 | 0 | Exact SAT | 2 | 100.0% | 100.0% | 5ms | ✅ PASS |
| 06 | Level 2 – Easy to Moderate | Odd number of 1s | 10/10 | 0 | Exact SAT | 2 | 100.0% | 100.0% | 4ms | ✅ PASS |
| 07 | Level 2 – Easy to Moderate | End with 01 | 11/11 | 1 | Exact SAT | 3 | 100.0% | 100.0% | 85ms | ✅ PASS |
| 08 | Level 2 – Easy to Moderate | Start with 0 and end with 1 | 12/12 | 2 | Exact SAT | 4 | 100.0% | 100.0% | 673ms | ✅ PASS |
| 09 | Level 2 – Easy to Moderate | Contain substring 00 | 11/11 | 0 | Exact SAT | 3 | 100.0% | 100.0% | 10ms | ✅ PASS |
| 10 | Level 2 – Easy to Moderate | Do not contain substring 11 | 11/11 | 0 | Exact SAT | 3 | 100.0% | 100.0% | 10ms | ✅ PASS |
| 11 | Level 3 – Moderate | Even 0s and even 1s | 14/14 | 0 | RPNI | 4 | 100.0% | 100.0% | 5ms | ✅ PASS |
| 12 | Level 3 – Moderate | At least two consecutive 0s | 12/12 | 0 | Exact SAT | 3 | 100.0% | 100.0% | 13ms | ✅ PASS |
| 13 | Level 3 – Moderate | Number of 1s divisible by 3 | 13/13 | 0 | RPNI | 3 | 100.0% | 100.0% | 2ms | ✅ PASS |
| 14 | Level 3 – Moderate | End with 101 or 010 | 16/16 | 1 | RPNI | 7 | 100.0% | 100.0% | 13.31s | ✅ PASS |
| 15 | Level 3 – Moderate | Exactly two occurrences of 0 | 13/13 | 1 | RPNI | 4 | 100.0% | 100.0% | 343ms | ✅ PASS |
| 16 | Level 4 – Medium | Even 0s and odd 1s | 14/14 | 0 | RPNI | 4 | 100.0% | 100.0% | 6ms | ✅ PASS |
| 17 | Level 4 – Medium | Do not contain substring 010 | 14/14 | 0 | RPNI | 4 | 100.0% | 100.0% | 3ms | ✅ PASS |
| 18 | Level 4 – Medium | Binary value divisible by 3 | 15/15 | 1 | RPNI | 3 | 100.0% | 100.0% | 123ms | ✅ PASS |
| 19 | Level 4 – Medium | Contain both 00 and 11 | 18/18 | 4 | RPNI | 8 | 100.0% | 100.0% | 37ms | ✅ PASS |
| 20 | Level 4 – Medium | Length divisible by 3 and end with 1 | 16/16 | 0 | RPNI | 4 | 100.0% | 100.0% | 7ms | ✅ PASS |

**Tests:** 20 ✅ PASS  |  0 ⚠️ FAIL  |  0 ❌ ERROR  |  **Total HITL questions:** 12  |  **Wall time:** 7.62s

---

## 🤖 Active Learning Summary (all HITL questions across all tests)

### Q04 — Contain exactly one 1  (2 questions)

| Q# | Query String | Answered As | Correct (rule) |
|---|---|---|---|
| 1 of 2 | `'1101'` | **REJECT** | ❌ REJECT |
| 2 of 2 | `'1111'` | **REJECT** | ❌ REJECT |

### Q07 — End with 01  (1 questions)

| Q# | Query String | Answered As | Correct (rule) |
|---|---|---|---|
| 1 of 1 | `'0111'` | **REJECT** | ❌ REJECT |

### Q08 — Start with 0 and end with 1  (2 questions)

| Q# | Query String | Answered As | Correct (rule) |
|---|---|---|---|
| 1 of 2 | `'1001'` | **REJECT** | ❌ REJECT |
| 2 of 2 | `'11001'` | **REJECT** | ❌ REJECT |

### Q14 — End with 101 or 010  (1 questions)

| Q# | Query String | Answered As | Correct (rule) |
|---|---|---|---|
| 1 of 1 | `'0100'` | **REJECT** | ❌ REJECT |

### Q15 — Exactly two occurrences of 0  (1 questions)

| Q# | Query String | Answered As | Correct (rule) |
|---|---|---|---|
| 1 of 1 | `'00000'` | **REJECT** | ❌ REJECT |

### Q18 — Binary value divisible by 3  (1 questions)

| Q# | Query String | Answered As | Correct (rule) |
|---|---|---|---|
| 1 of 1 | `'10101'` | **ACCEPT** | ✅ ACCEPT |

### Q19 — Contain both 00 and 11  (4 questions)

| Q# | Query String | Answered As | Correct (rule) |
|---|---|---|---|
| 1 of 4 | `'01010011'` | **ACCEPT** | ✅ ACCEPT |
| 2 of 4 | `'0101'` | **REJECT** | ❌ REJECT |
| 3 of 4 | `'0100'` | **REJECT** | ❌ REJECT |
| 4 of 4 | `'1011'` | **REJECT** | ❌ REJECT |

---

## 🔍 Per-Question Detailed Results

### Q01 — End with 0

| Field | Value |
|---|---|
| **Status** | ✅ PASS |
| **Level** | Level 1 – Easy |
| **Session ID** | `d29e607e-a629-4bac-98f7-51b4e353c8ac` |
| **Dataset** | 8 positive, 8 negative (16 total) |
| **Inference Engine** | Exact SAT (Biermann-Feldman, k=2) |
| **DFA States** | 2 |
| **DFA Transitions** | 4 |
| **Initial State** | `None` |
| **Accept States** | `[]` |
| **Data Quality Warning** | — |
| **Total time** | 4ms |

#### ⏱ API Call Timing

| API Call | Time |
|---|---|
| `preprocess_csv` | 2ms |
| `train_model` | 3ms |
| `simulate` ×16 strings | 0ms |
| **Total** | **4ms** |

#### 📈 Accuracy Metrics

| Metric | First Pass | After HITL |
|---|---|---|
| Training accuracy | 1.0000 | 1.0000 |
| Precision | 1.0000 | 1.0000 |
| Recall | 1.0000 | 1.0000 |
| F1-Score | 1.0000 | 1.0000 |
| **Sim. vs CSV label** | — | **100.0%** |
| **Sim. vs Rule fn** | — | **100.0%** |

> ✅ **No HITL questions** — model converged with 0 queries.

> ✅ **All simulations match rule** — DFA correct on every test string.

---

### Q02 — Start with 1

| Field | Value |
|---|---|
| **Status** | ✅ PASS |
| **Level** | Level 1 – Easy |
| **Session ID** | `b0e12de5-05a8-4d40-bfae-c3be6e23bc55` |
| **Dataset** | 8 positive, 8 negative (16 total) |
| **Inference Engine** | Exact SAT (Biermann-Feldman, k=3) |
| **DFA States** | 3 |
| **DFA Transitions** | 4 |
| **Initial State** | `None` |
| **Accept States** | `[]` |
| **Data Quality Warning** | — |
| **Total time** | 7ms |

#### ⏱ API Call Timing

| API Call | Time |
|---|---|
| `preprocess_csv` | 1ms |
| `train_model` | 6ms |
| `simulate` ×16 strings | 0ms |
| **Total** | **7ms** |

#### 📈 Accuracy Metrics

| Metric | First Pass | After HITL |
|---|---|---|
| Training accuracy | 1.0000 | 1.0000 |
| Precision | 1.0000 | 1.0000 |
| Recall | 1.0000 | 1.0000 |
| F1-Score | 1.0000 | 1.0000 |
| **Sim. vs CSV label** | — | **100.0%** |
| **Sim. vs Rule fn** | — | **100.0%** |

> ✅ **No HITL questions** — model converged with 0 queries.

> ✅ **All simulations match rule** — DFA correct on every test string.

---

### Q03 — Contain at least one 0

| Field | Value |
|---|---|
| **Status** | ✅ PASS |
| **Level** | Level 1 – Easy |
| **Session ID** | `b7d9db97-b80f-4358-9d08-b0d636528e5b` |
| **Dataset** | 8 positive, 7 negative (15 total) |
| **Inference Engine** | Exact SAT (Biermann-Feldman, k=2) |
| **DFA States** | 2 |
| **DFA Transitions** | 3 |
| **Initial State** | `None` |
| **Accept States** | `[]` |
| **Data Quality Warning** | Dataset may be too sparse (15 samples for alphabet size 2). Consider providing at least 16 samples for reliable DFA inference. |
| **Total time** | 3ms |

#### ⏱ API Call Timing

| API Call | Time |
|---|---|
| `preprocess_csv` | 1ms |
| `train_model` | 3ms |
| `simulate` ×15 strings | 0ms |
| **Total** | **3ms** |

#### 📈 Accuracy Metrics

| Metric | First Pass | After HITL |
|---|---|---|
| Training accuracy | 1.0000 | 1.0000 |
| Precision | 1.0000 | 1.0000 |
| Recall | 1.0000 | 1.0000 |
| F1-Score | 1.0000 | 1.0000 |
| **Sim. vs CSV label** | — | **100.0%** |
| **Sim. vs Rule fn** | — | **100.0%** |

> ✅ **No HITL questions** — model converged with 0 queries.

> ✅ **All simulations match rule** — DFA correct on every test string.

---

### Q04 — Contain exactly one 1

| Field | Value |
|---|---|
| **Status** | ✅ PASS |
| **Level** | Level 1 – Easy |
| **Session ID** | `098431aa-a9da-42d7-abe7-298cdf51e888` |
| **Dataset** | 9 positive, 9 negative (18 total) |
| **Inference Engine** | Exact SAT (Biermann-Feldman, k=3) |
| **DFA States** | 3 |
| **DFA Transitions** | 5 |
| **Initial State** | `None` |
| **Accept States** | `[]` |
| **Data Quality Warning** | — |
| **Total time** | 33ms |

#### ⏱ API Call Timing

| API Call | Time |
|---|---|
| `preprocess_csv` | 0ms |
| `train_model` | 10ms |
| `answer_hitl_query` #1 | 0ms |
| `answer_hitl_query` #2 | 11ms |
| HITL loop total | 11ms |
| `simulate` ×18 strings | 0ms |
| **Total** | **33ms** |

#### 📈 Accuracy Metrics

| Metric | First Pass | After HITL |
|---|---|---|
| Training accuracy | 1.0000 | 1.0000 |
| Precision | 1.0000 | 1.0000 |
| Recall | 1.0000 | 1.0000 |
| F1-Score | 1.0000 | 1.0000 |
| **Sim. vs CSV label** | — | **100.0%** |
| **Sim. vs Rule fn** | — | **100.0%** |

#### 🤖 Active Learning Questions (2 questions asked)

| Q# | Query String | Answered As | Rule Answer |
|---|---|---|---|
| 1 / 2 | `'1101'` | **REJECT** | ❌ REJECT |
| 2 / 2 | `'1111'` | **REJECT** | ❌ REJECT |

> ✅ **All simulations match rule** — DFA correct on every test string.

---

### Q05 — Even number of 0s

| Field | Value |
|---|---|
| **Status** | ✅ PASS |
| **Level** | Level 1 – Easy |
| **Session ID** | `b50074a9-980f-4caf-b0d9-74f3e11a1fb8` |
| **Dataset** | 9 positive, 9 negative (18 total) |
| **Inference Engine** | Exact SAT (Biermann-Feldman, k=2) |
| **DFA States** | 2 |
| **DFA Transitions** | 4 |
| **Initial State** | `None` |
| **Accept States** | `[]` |
| **Data Quality Warning** | — |
| **Total time** | 5ms |

#### ⏱ API Call Timing

| API Call | Time |
|---|---|
| `preprocess_csv` | 1ms |
| `train_model` | 4ms |
| `simulate` ×18 strings | 0ms |
| **Total** | **5ms** |

#### 📈 Accuracy Metrics

| Metric | First Pass | After HITL |
|---|---|---|
| Training accuracy | 1.0000 | 1.0000 |
| Precision | 1.0000 | 1.0000 |
| Recall | 1.0000 | 1.0000 |
| F1-Score | 1.0000 | 1.0000 |
| **Sim. vs CSV label** | — | **100.0%** |
| **Sim. vs Rule fn** | — | **100.0%** |

> ✅ **No HITL questions** — model converged with 0 queries.

> ✅ **All simulations match rule** — DFA correct on every test string.

---

### Q06 — Odd number of 1s

| Field | Value |
|---|---|
| **Status** | ✅ PASS |
| **Level** | Level 2 – Easy to Moderate |
| **Session ID** | `74b42ed7-23b1-4508-a5b4-c91d668b6bf1` |
| **Dataset** | 10 positive, 10 negative (20 total) |
| **Inference Engine** | Exact SAT (Biermann-Feldman, k=2) |
| **DFA States** | 2 |
| **DFA Transitions** | 4 |
| **Initial State** | `None` |
| **Accept States** | `[]` |
| **Data Quality Warning** | — |
| **Total time** | 4ms |

#### ⏱ API Call Timing

| API Call | Time |
|---|---|
| `preprocess_csv` | 1ms |
| `train_model` | 3ms |
| `simulate` ×20 strings | 0ms |
| **Total** | **4ms** |

#### 📈 Accuracy Metrics

| Metric | First Pass | After HITL |
|---|---|---|
| Training accuracy | 1.0000 | 1.0000 |
| Precision | 1.0000 | 1.0000 |
| Recall | 1.0000 | 1.0000 |
| F1-Score | 1.0000 | 1.0000 |
| **Sim. vs CSV label** | — | **100.0%** |
| **Sim. vs Rule fn** | — | **100.0%** |

> ✅ **No HITL questions** — model converged with 0 queries.

> ✅ **All simulations match rule** — DFA correct on every test string.

---

### Q07 — End with 01

| Field | Value |
|---|---|
| **Status** | ✅ PASS |
| **Level** | Level 2 – Easy to Moderate |
| **Session ID** | `da5e4f16-acc7-45e0-b457-13532cbcfdb0` |
| **Dataset** | 11 positive, 11 negative (22 total) |
| **Inference Engine** | Exact SAT (Biermann-Feldman, k=3) |
| **DFA States** | 3 |
| **DFA Transitions** | 6 |
| **Initial State** | `None` |
| **Accept States** | `[]` |
| **Data Quality Warning** | — |
| **Total time** | 85ms |

#### ⏱ API Call Timing

| API Call | Time |
|---|---|
| `preprocess_csv` | 1ms |
| `train_model` | 45ms |
| `answer_hitl_query` #1 | 20ms |
| HITL loop total | 20ms |
| `simulate` ×22 strings | 0ms |
| **Total** | **85ms** |

#### 📈 Accuracy Metrics

| Metric | First Pass | After HITL |
|---|---|---|
| Training accuracy | 1.0000 | 1.0000 |
| Precision | 1.0000 | 1.0000 |
| Recall | 1.0000 | 1.0000 |
| F1-Score | 1.0000 | 1.0000 |
| **Sim. vs CSV label** | — | **100.0%** |
| **Sim. vs Rule fn** | — | **100.0%** |

#### 🤖 Active Learning Questions (1 questions asked)

| Q# | Query String | Answered As | Rule Answer |
|---|---|---|---|
| 1 / 1 | `'0111'` | **REJECT** | ❌ REJECT |

> ✅ **All simulations match rule** — DFA correct on every test string.

---

### Q08 — Start with 0 and end with 1

| Field | Value |
|---|---|
| **Status** | ✅ PASS |
| **Level** | Level 2 – Easy to Moderate |
| **Session ID** | `4079f779-5218-412f-bafc-204c9f9c3e76` |
| **Dataset** | 12 positive, 12 negative (24 total) |
| **Inference Engine** | Exact SAT (Biermann-Feldman, k=4) |
| **DFA States** | 4 |
| **DFA Transitions** | 7 |
| **Initial State** | `None` |
| **Accept States** | `[]` |
| **Data Quality Warning** | — |
| **Total time** | 673ms |

#### ⏱ API Call Timing

| API Call | Time |
|---|---|
| `preprocess_csv` | 1ms |
| `train_model` | 338ms |
| `answer_hitl_query` #1 | 0ms |
| `answer_hitl_query` #2 | 167ms |
| HITL loop total | 167ms |
| `simulate` ×24 strings | 0ms |
| **Total** | **673ms** |

#### 📈 Accuracy Metrics

| Metric | First Pass | After HITL |
|---|---|---|
| Training accuracy | 1.0000 | 1.0000 |
| Precision | 1.0000 | 1.0000 |
| Recall | 1.0000 | 1.0000 |
| F1-Score | 1.0000 | 1.0000 |
| **Sim. vs CSV label** | — | **100.0%** |
| **Sim. vs Rule fn** | — | **100.0%** |

#### 🤖 Active Learning Questions (2 questions asked)

| Q# | Query String | Answered As | Rule Answer |
|---|---|---|---|
| 1 / 2 | `'1001'` | **REJECT** | ❌ REJECT |
| 2 / 2 | `'11001'` | **REJECT** | ❌ REJECT |

> ✅ **All simulations match rule** — DFA correct on every test string.

---

### Q09 — Contain substring 00

| Field | Value |
|---|---|
| **Status** | ✅ PASS |
| **Level** | Level 2 – Easy to Moderate |
| **Session ID** | `bd4422df-9c8f-4688-b894-91ee75361024` |
| **Dataset** | 11 positive, 11 negative (22 total) |
| **Inference Engine** | Exact SAT (Biermann-Feldman, k=3) |
| **DFA States** | 3 |
| **DFA Transitions** | 5 |
| **Initial State** | `None` |
| **Accept States** | `[]` |
| **Data Quality Warning** | — |
| **Total time** | 10ms |

#### ⏱ API Call Timing

| API Call | Time |
|---|---|
| `preprocess_csv` | 1ms |
| `train_model` | 10ms |
| `simulate` ×22 strings | 0ms |
| **Total** | **10ms** |

#### 📈 Accuracy Metrics

| Metric | First Pass | After HITL |
|---|---|---|
| Training accuracy | 1.0000 | 1.0000 |
| Precision | 1.0000 | 1.0000 |
| Recall | 1.0000 | 1.0000 |
| F1-Score | 1.0000 | 1.0000 |
| **Sim. vs CSV label** | — | **100.0%** |
| **Sim. vs Rule fn** | — | **100.0%** |

> ✅ **No HITL questions** — model converged with 0 queries.

> ✅ **All simulations match rule** — DFA correct on every test string.

---

### Q10 — Do not contain substring 11

| Field | Value |
|---|---|
| **Status** | ✅ PASS |
| **Level** | Level 2 – Easy to Moderate |
| **Session ID** | `958c63cf-397c-4ecd-b1a5-655729102f20` |
| **Dataset** | 11 positive, 11 negative (22 total) |
| **Inference Engine** | Exact SAT (Biermann-Feldman, k=3) |
| **DFA States** | 3 |
| **DFA Transitions** | 5 |
| **Initial State** | `None` |
| **Accept States** | `[]` |
| **Data Quality Warning** | — |
| **Total time** | 10ms |

#### ⏱ API Call Timing

| API Call | Time |
|---|---|
| `preprocess_csv` | 1ms |
| `train_model` | 9ms |
| `simulate` ×22 strings | 0ms |
| **Total** | **10ms** |

#### 📈 Accuracy Metrics

| Metric | First Pass | After HITL |
|---|---|---|
| Training accuracy | 1.0000 | 1.0000 |
| Precision | 1.0000 | 1.0000 |
| Recall | 1.0000 | 1.0000 |
| F1-Score | 1.0000 | 1.0000 |
| **Sim. vs CSV label** | — | **100.0%** |
| **Sim. vs Rule fn** | — | **100.0%** |

> ✅ **No HITL questions** — model converged with 0 queries.

> ✅ **All simulations match rule** — DFA correct on every test string.

---

### Q11 — Even 0s and even 1s

| Field | Value |
|---|---|
| **Status** | ✅ PASS |
| **Level** | Level 3 – Moderate |
| **Session ID** | `9494a4ca-4cf3-498d-b247-1bab12a7d865` |
| **Dataset** | 14 positive, 14 negative (28 total) |
| **Inference Engine** | RPNI (State-Merging) |
| **DFA States** | 4 |
| **DFA Transitions** | 8 |
| **Initial State** | `None` |
| **Accept States** | `[]` |
| **Data Quality Warning** | — |
| **Total time** | 5ms |

#### ⏱ API Call Timing

| API Call | Time |
|---|---|
| `preprocess_csv` | 1ms |
| `train_model` | 4ms |
| `simulate` ×28 strings | 0ms |
| **Total** | **5ms** |

#### 📈 Accuracy Metrics

| Metric | First Pass | After HITL |
|---|---|---|
| Training accuracy | 1.0000 | 1.0000 |
| Precision | 1.0000 | 1.0000 |
| Recall | 1.0000 | 1.0000 |
| F1-Score | 1.0000 | 1.0000 |
| **Sim. vs CSV label** | — | **100.0%** |
| **Sim. vs Rule fn** | — | **100.0%** |

> ✅ **No HITL questions** — model converged with 0 queries.

> ✅ **All simulations match rule** — DFA correct on every test string.

---

### Q12 — At least two consecutive 0s

| Field | Value |
|---|---|
| **Status** | ✅ PASS |
| **Level** | Level 3 – Moderate |
| **Session ID** | `bea23243-a2ec-4bc5-823d-629cb46fd50c` |
| **Dataset** | 12 positive, 12 negative (24 total) |
| **Inference Engine** | Exact SAT (Biermann-Feldman, k=3) |
| **DFA States** | 3 |
| **DFA Transitions** | 5 |
| **Initial State** | `None` |
| **Accept States** | `[]` |
| **Data Quality Warning** | — |
| **Total time** | 13ms |

#### ⏱ API Call Timing

| API Call | Time |
|---|---|
| `preprocess_csv` | 1ms |
| `train_model` | 12ms |
| `simulate` ×24 strings | 0ms |
| **Total** | **13ms** |

#### 📈 Accuracy Metrics

| Metric | First Pass | After HITL |
|---|---|---|
| Training accuracy | 1.0000 | 1.0000 |
| Precision | 1.0000 | 1.0000 |
| Recall | 1.0000 | 1.0000 |
| F1-Score | 1.0000 | 1.0000 |
| **Sim. vs CSV label** | — | **100.0%** |
| **Sim. vs Rule fn** | — | **100.0%** |

> ✅ **No HITL questions** — model converged with 0 queries.

> ✅ **All simulations match rule** — DFA correct on every test string.

---

### Q13 — Number of 1s divisible by 3

| Field | Value |
|---|---|
| **Status** | ✅ PASS |
| **Level** | Level 3 – Moderate |
| **Session ID** | `8bf0c585-ff3a-45ef-8dbd-2da4b6ace15a` |
| **Dataset** | 13 positive, 13 negative (26 total) |
| **Inference Engine** | RPNI (State-Merging) |
| **DFA States** | 3 |
| **DFA Transitions** | 6 |
| **Initial State** | `None` |
| **Accept States** | `[]` |
| **Data Quality Warning** | — |
| **Total time** | 2ms |

#### ⏱ API Call Timing

| API Call | Time |
|---|---|
| `preprocess_csv` | 1ms |
| `train_model` | 2ms |
| `simulate` ×26 strings | 0ms |
| **Total** | **2ms** |

#### 📈 Accuracy Metrics

| Metric | First Pass | After HITL |
|---|---|---|
| Training accuracy | 1.0000 | 1.0000 |
| Precision | 1.0000 | 1.0000 |
| Recall | 1.0000 | 1.0000 |
| F1-Score | 1.0000 | 1.0000 |
| **Sim. vs CSV label** | — | **100.0%** |
| **Sim. vs Rule fn** | — | **100.0%** |

> ✅ **No HITL questions** — model converged with 0 queries.

> ✅ **All simulations match rule** — DFA correct on every test string.

---

### Q14 — End with 101 or 010

| Field | Value |
|---|---|
| **Status** | ✅ PASS |
| **Level** | Level 3 – Moderate |
| **Session ID** | `cccdffd2-dc1f-48da-a984-6ae3fae12e41` |
| **Dataset** | 16 positive, 16 negative (32 total) |
| **Inference Engine** | RPNI (State-Merging) |
| **DFA States** | 7 |
| **DFA Transitions** | 14 |
| **Initial State** | `None` |
| **Accept States** | `[]` |
| **Data Quality Warning** | — |
| **Total time** | 13.31s |

#### ⏱ API Call Timing

| API Call | Time |
|---|---|
| `preprocess_csv` | 1ms |
| `train_model` | 8ms |
| `answer_hitl_query` #1 | 6.65s |
| HITL loop total | 6.65s |
| `simulate` ×32 strings | 0ms |
| **Total** | **13.31s** |

#### 📈 Accuracy Metrics

| Metric | First Pass | After HITL |
|---|---|---|
| Training accuracy | 1.0000 | 1.0000 |
| Precision | 1.0000 | 1.0000 |
| Recall | 1.0000 | 1.0000 |
| F1-Score | 1.0000 | 1.0000 |
| **Sim. vs CSV label** | — | **100.0%** |
| **Sim. vs Rule fn** | — | **100.0%** |

#### 🤖 Active Learning Questions (1 questions asked)

| Q# | Query String | Answered As | Rule Answer |
|---|---|---|---|
| 1 / 1 | `'0100'` | **REJECT** | ❌ REJECT |

> ✅ **All simulations match rule** — DFA correct on every test string.

---

### Q15 — Exactly two occurrences of 0

| Field | Value |
|---|---|
| **Status** | ✅ PASS |
| **Level** | Level 3 – Moderate |
| **Session ID** | `6ec01e4d-291c-4429-a20d-77e486152a48` |
| **Dataset** | 13 positive, 13 negative (26 total) |
| **Inference Engine** | RPNI (State-Merging) |
| **DFA States** | 4 |
| **DFA Transitions** | 8 |
| **Initial State** | `None` |
| **Accept States** | `[]` |
| **Data Quality Warning** | — |
| **Total time** | 343ms |

#### ⏱ API Call Timing

| API Call | Time |
|---|---|
| `preprocess_csv` | 0ms |
| `train_model` | 2ms |
| `answer_hitl_query` #1 | 170ms |
| HITL loop total | 170ms |
| `simulate` ×26 strings | 0ms |
| **Total** | **343ms** |

#### 📈 Accuracy Metrics

| Metric | First Pass | After HITL |
|---|---|---|
| Training accuracy | 1.0000 | 1.0000 |
| Precision | 1.0000 | 1.0000 |
| Recall | 1.0000 | 1.0000 |
| F1-Score | 1.0000 | 1.0000 |
| **Sim. vs CSV label** | — | **100.0%** |
| **Sim. vs Rule fn** | — | **100.0%** |

#### 🤖 Active Learning Questions (1 questions asked)

| Q# | Query String | Answered As | Rule Answer |
|---|---|---|---|
| 1 / 1 | `'00000'` | **REJECT** | ❌ REJECT |

> ✅ **All simulations match rule** — DFA correct on every test string.

---

### Q16 — Even 0s and odd 1s

| Field | Value |
|---|---|
| **Status** | ✅ PASS |
| **Level** | Level 4 – Medium |
| **Session ID** | `c4a3772e-9d99-4aa7-aa58-1bd9a392c400` |
| **Dataset** | 14 positive, 14 negative (28 total) |
| **Inference Engine** | RPNI (State-Merging) |
| **DFA States** | 4 |
| **DFA Transitions** | 8 |
| **Initial State** | `None` |
| **Accept States** | `[]` |
| **Data Quality Warning** | — |
| **Total time** | 6ms |

#### ⏱ API Call Timing

| API Call | Time |
|---|---|
| `preprocess_csv` | 1ms |
| `train_model` | 5ms |
| `simulate` ×28 strings | 0ms |
| **Total** | **6ms** |

#### 📈 Accuracy Metrics

| Metric | First Pass | After HITL |
|---|---|---|
| Training accuracy | 1.0000 | 1.0000 |
| Precision | 1.0000 | 1.0000 |
| Recall | 1.0000 | 1.0000 |
| F1-Score | 1.0000 | 1.0000 |
| **Sim. vs CSV label** | — | **100.0%** |
| **Sim. vs Rule fn** | — | **100.0%** |

> ✅ **No HITL questions** — model converged with 0 queries.

> ✅ **All simulations match rule** — DFA correct on every test string.

---

### Q17 — Do not contain substring 010

| Field | Value |
|---|---|
| **Status** | ✅ PASS |
| **Level** | Level 4 – Medium |
| **Session ID** | `bf7e643c-2237-45d6-9a79-435cc904e250` |
| **Dataset** | 14 positive, 14 negative (28 total) |
| **Inference Engine** | RPNI (State-Merging) |
| **DFA States** | 4 |
| **DFA Transitions** | 7 |
| **Initial State** | `None` |
| **Accept States** | `[]` |
| **Data Quality Warning** | — |
| **Total time** | 3ms |

#### ⏱ API Call Timing

| API Call | Time |
|---|---|
| `preprocess_csv` | 2ms |
| `train_model` | 1ms |
| `simulate` ×28 strings | 0ms |
| **Total** | **3ms** |

#### 📈 Accuracy Metrics

| Metric | First Pass | After HITL |
|---|---|---|
| Training accuracy | 1.0000 | 1.0000 |
| Precision | 1.0000 | 1.0000 |
| Recall | 1.0000 | 1.0000 |
| F1-Score | 1.0000 | 1.0000 |
| **Sim. vs CSV label** | — | **100.0%** |
| **Sim. vs Rule fn** | — | **100.0%** |

> ✅ **No HITL questions** — model converged with 0 queries.

> ✅ **All simulations match rule** — DFA correct on every test string.

---

### Q18 — Binary value divisible by 3

| Field | Value |
|---|---|
| **Status** | ✅ PASS |
| **Level** | Level 4 – Medium |
| **Session ID** | `c236dd5e-b817-4264-8447-6b6c4d899d06` |
| **Dataset** | 15 positive, 15 negative (30 total) |
| **Inference Engine** | RPNI (State-Merging) |
| **DFA States** | 3 |
| **DFA Transitions** | 6 |
| **Initial State** | `None` |
| **Accept States** | `[]` |
| **Data Quality Warning** | — |
| **Total time** | 123ms |

#### ⏱ API Call Timing

| API Call | Time |
|---|---|
| `preprocess_csv` | 0ms |
| `train_model` | 1ms |
| `answer_hitl_query` #1 | 60ms |
| HITL loop total | 60ms |
| `simulate` ×30 strings | 0ms |
| **Total** | **123ms** |

#### 📈 Accuracy Metrics

| Metric | First Pass | After HITL |
|---|---|---|
| Training accuracy | 1.0000 | 1.0000 |
| Precision | 1.0000 | 1.0000 |
| Recall | 1.0000 | 1.0000 |
| F1-Score | 1.0000 | 1.0000 |
| **Sim. vs CSV label** | — | **100.0%** |
| **Sim. vs Rule fn** | — | **100.0%** |

#### 🤖 Active Learning Questions (1 questions asked)

| Q# | Query String | Answered As | Rule Answer |
|---|---|---|---|
| 1 / 1 | `'10101'` | **ACCEPT** | ✅ ACCEPT |

> ✅ **All simulations match rule** — DFA correct on every test string.

---

### Q19 — Contain both 00 and 11

| Field | Value |
|---|---|
| **Status** | ✅ PASS |
| **Level** | Level 4 – Medium |
| **Session ID** | `751e1221-0941-40da-beb8-244db34fb53a` |
| **Dataset** | 18 positive, 18 negative (36 total) |
| **Inference Engine** | RPNI (State-Merging) |
| **DFA States** | 8 |
| **DFA Transitions** | 15 |
| **Initial State** | `None` |
| **Accept States** | `[]` |
| **Data Quality Warning** | — |
| **Total time** | 37ms |

#### ⏱ API Call Timing

| API Call | Time |
|---|---|
| `preprocess_csv` | 0ms |
| `train_model` | 9ms |
| `answer_hitl_query` #1 | 0ms |
| `answer_hitl_query` #2 | 0ms |
| `answer_hitl_query` #3 | 0ms |
| `answer_hitl_query` #4 | 13ms |
| HITL loop total | 13ms |
| `simulate` ×36 strings | 0ms |
| **Total** | **37ms** |

#### 📈 Accuracy Metrics

| Metric | First Pass | After HITL |
|---|---|---|
| Training accuracy | 1.0000 | 1.0000 |
| Precision | 1.0000 | 1.0000 |
| Recall | 1.0000 | 1.0000 |
| F1-Score | 1.0000 | 1.0000 |
| **Sim. vs CSV label** | — | **100.0%** |
| **Sim. vs Rule fn** | — | **100.0%** |

#### 🤖 Active Learning Questions (4 questions asked)

| Q# | Query String | Answered As | Rule Answer |
|---|---|---|---|
| 1 / 4 | `'01010011'` | **ACCEPT** | ✅ ACCEPT |
| 2 / 4 | `'0101'` | **REJECT** | ❌ REJECT |
| 3 / 4 | `'0100'` | **REJECT** | ❌ REJECT |
| 4 / 4 | `'1011'` | **REJECT** | ❌ REJECT |

> ✅ **All simulations match rule** — DFA correct on every test string.

---

### Q20 — Length divisible by 3 and end with 1

| Field | Value |
|---|---|
| **Status** | ✅ PASS |
| **Level** | Level 4 – Medium |
| **Session ID** | `66024b2b-d779-400b-a8e9-d03e181fc16a` |
| **Dataset** | 16 positive, 16 negative (32 total) |
| **Inference Engine** | RPNI (State-Merging) |
| **DFA States** | 4 |
| **DFA Transitions** | 5 |
| **Initial State** | `None` |
| **Accept States** | `[]` |
| **Data Quality Warning** | — |
| **Total time** | 7ms |

#### ⏱ API Call Timing

| API Call | Time |
|---|---|
| `preprocess_csv` | 1ms |
| `train_model` | 6ms |
| `simulate` ×32 strings | 0ms |
| **Total** | **7ms** |

#### 📈 Accuracy Metrics

| Metric | First Pass | After HITL |
|---|---|---|
| Training accuracy | 1.0000 | 1.0000 |
| Precision | 1.0000 | 1.0000 |
| Recall | 1.0000 | 1.0000 |
| F1-Score | 1.0000 | 1.0000 |
| **Sim. vs CSV label** | — | **100.0%** |
| **Sim. vs Rule fn** | — | **100.0%** |

> ✅ **No HITL questions** — model converged with 0 queries.

> ✅ **All simulations match rule** — DFA correct on every test string.

---

## 📖 Methodology Notes

| Term | Meaning |
|---|---|
| **HITL Qs** | Active-learning membership queries the model asked during training (max 4 per design) |
| **Engine** | Inference algorithm: `SAT` = exact synthesis, `RPNI` = state-merging |
| **DFA Acc%** | % of test strings where `simulate()` matches the CSV label |
| **Rule Acc%** | % of test strings where `simulate()` matches the Python ground-truth rule |
| **HITL oracle** | Rule function answers queries (simulates a perfect human expert) |
| **PASS** | DFA Acc = 100% AND Rule Acc = 100% |

> [!NOTE]
> Each question runs in its own isolated session (`session_id = UUID4`).

> [!TIP]
> HITL questions are answered by calling the Python rule function — identical to what a
> perfect human domain expert would answer.
