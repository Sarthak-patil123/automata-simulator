# Detailed Implementation Plan & Architecture Report
*Automata Learning Studio with Active Learning (L\* + HITL)*

---

## 1. Executive Summary & New Architecture

The objective was to re-architect the application so that rather than exposing an overwhelming array of competing passive algorithms (RPNI, EDSM, NFA Learner, etc.), the application uses **one primary, theoretically sound active learning architecture**:

```
                       ┌───────────────────────────────────────────────┐
                       │          User Uploads CSV Dataset             │
                       └───────────────────────┬───────────────────────┘
                                               │
                                               ▼
                       ┌───────────────────────────────────────────────┐
                       │       POST /api/dataset/preprocess-csv        │
                       │   - Validates positive/negative strings       │
                       │   - Extracts Alphabet (Σ)                     │
                       │   - Checks sample density vs. state space     │
                       └───────────────────────┬───────────────────────┘
                                               │
                                               ▼
                       ┌───────────────────────────────────────────────┐
                       │             POST /api/model/train             │
                       └───────┬───────────────────────────────┬───────┘
                               │                               │
                      [DFA]    ▼                      [NFA]    ▼
          ┌───────────────────────────────────┐    ┌──────────────────────────┐
          │ Step 1: Internal RPNI Warm-Start  │    │ Direct NFA State Merging │
          │ - Instant 1st-pass DFA generated  │    │ - Compact representation │
          │ - Evaluated on initial dataset    │    │ - Non-deterministic model│
          └─────────────────┬─────────────────┘    └─────────────┬────────────┘
                            │                                    │
                            ▼                                    │
          ┌───────────────────────────────────┐                  │
          │ Step 2: Angluin's L* Engine Init  │                  │
          │ - Observation Table (S, E, T)     │                  │
          │ - Seeded with known CSV labels    │                  │
          └─────────────────┬─────────────────┘                  │
                            │                                    │
                            ▼                                    │
          ┌───────────────────────────────────┐                  │
          │ Step 3: Human-in-the-Loop (HITL)  │                  │
          │ - AI identifies ambiguous strings │                  │
          │ - Asks user targeted Yes/No       │                  │
          │   membership queries              │                  │
          │ - User reviews conjectures & gives│                  │
          │   counterexamples if needed       │                  │
          └─────────────────┬─────────────────┘                  │
                            │                                    │
                            ▼                                    │
          ┌───────────────────────────────────┐                  │
          │ Step 4: Provable Minimal DFA      │                  │
          │ - Guaranteed exact equivalence    │                  │
          │ - 100% accuracy on 8-10+ nodes    │                  │
          └─────────────────┬─────────────────┘                  │
                            │                                    │
                            └─────────────────┬──────────────────┘
                                              │
                                              ▼
                       ┌───────────────────────────────────────────────┐
                       │         Interactive Graph Simulation          │
                       │ - BFS Hierarchical Layout                     │
                       │ - Anti-overlapping bidirectional edges        │
                       │ - Step-by-step tape execution & playback      │
                       └───────────────────────────────────────────────┘
```

---

## 2. Status of Components & Completed Work

### A. Backend Layer (`backend/api.py`, `server.py`, `schema.py`)
- **Session-Isolated Engine**: `_sessions` storage dictionary keyed by client `session_id` (UUID generated per browser tab). This eliminates race conditions and state corruption across multiple browser tabs.
- **Unified 2-Phase Training**:
  - Automatically runs RPNI warm-start so the user gets an instant visualization and baseline metrics.
  - Initializes `InteractiveActiveLearner` (Angluin's $L^*$).
  - If ambiguous strings exist outside the provided sample set, returns `needs_hitl: True` and prompts the user.
- **HITL Endpoints**:
  - `POST /api/hitl/answer`: Submits user's Yes/No answer to membership query $w \in L$.
  - `POST /api/hitl/confirm`: Submits conjecture confirmation or counterexample.
- **Edge Deduplication**: `schema.py` deduplicates multiple transitions between the same source and target state, combining symbols (e.g. `0,1`) into a single legible transition edge.
- **Legacy & Unit Test Backward Compatibility**: Method signatures in `AutomataMLService` support both the new REST JSON contracts and the legacy unit test suite (`37/37 passing`).

### B. Frontend UI & Graph Visualization (`frontend/index.html`)
- **BFS Hierarchical Layout**: Replaced the naive circular arrangement with a layered breadth-first traversal layout. Start state is positioned at Layer 0 (left), succeeding reachable states are ordered column by column. This cleanly scales to 8–10+ states without overlapping.
- **Parallel Edge Curvature**: Bidirectional edge pairs ($u \to v$ and $v \to u$) dynamically invert curvature directions ($+50$ vs $-50$) and adjust endpoints to the state circle radius ($r=22\text{px}$), preventing arrowheads from being swallowed inside nodes.
- **Dedicated HITL Refinement Panel**:
  - Live query card showing string under test (with empty string rendered as $\varepsilon$).
  - One-click **YES / NO** response buttons.
  - Conjecture review dialog allowing counterexample submission.
  - Celebration banner displaying exact convergence upon completion.
- **Full Simulation Controls**:
  - Input field with Enter-key trigger.
  - Controls: **Play / Pause**, **Step Next (⏭)**, **Step Back (⏮)**, **Reset**.
  - Color-coded character tape highlighting past, active, and upcoming symbols.
  - Pulsing glow ring on active states and highlight on traversed transitions.
- **Cleaned Dead Code**: Removed orphaned `frontend/src/utils/csvPreprocessor.js`. All parsing routes to backend preprocessor.

---

## 3. Detailed Verification Matrix

| Area | Component | Verification Result |
|---|---|---|
| **Data Parsing** | `POST /api/dataset/preprocess-csv` | ✅ Validated; handles multi-delimiter, header detection, label normalization, data quality warning |
| **Model Inference (DFA)** | `POST /api/model/train` | ✅ RPNI baseline instant return; $L^*$ active queries initialized |
| **Model Inference (NFA)** | `POST /api/model/train` | ✅ Non-deterministic state merging, outputs compact NFA |
| **Active Learning (HITL)** | `POST /api/hitl/answer` | ✅ Progresses observation table cells; formulates conjectures |
| **Conjecture Confirmation** | `POST /api/hitl/confirm` | ✅ Processes counterexamples; converges to exact minimal DFA |
| **String Simulation** | `POST /api/model/simulate` | ✅ Returns step-by-step execution traces with consumed tape and state history |
| **Edge & Node Rendering** | `schema.py` + SVG Canvas | ✅ Merged labels (`0,1`), curved opposing arcs, arrowheads offset to circumference |
| **Unit Test Suite** | `python -m unittest discover backend/tests` | ✅ **37 / 37 passed** |

---

## 4. How to Run the Completed Application

To run the application locally:

```powershell
# From the project root:
python server.py 8000
```

Then open `http://localhost:8000` in your web browser.

