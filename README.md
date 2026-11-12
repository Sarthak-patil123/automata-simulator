# Learn and Test DFA / NFA from Training Samples
**Finite Automata Inference and Interactive Verification from CSV Samples**

A clean, functional, and reliable educational tool for inferring and testing Deterministic and Nondeterministic Finite Automata (DFA & NFA) from user-provided training strings.

---

## 🌟 Key Functionality

1. **CSV Preprocessor Layer**:
   - Ingests any standard `.csv` file.
   - Auto-detects columns: `string` (or word/text) and `label` (accepted/rejected).
   - Normalizes all label variations: `1/0`, `true/false`, `accept/reject`, `+/-`.
   - Handles empty strings ($\epsilon$), extracts the alphabet $\Sigma$, and validates balanced sample requirements.
   - Includes 4 built-in one-click sample CSV presets:
     - `Ends with '01'`
     - `Binary Divisible by 3`
     - `Even 0s and Even 1s`
     - `Does Not Contain '000'`

2. **Dual Machine Generation**:
   - **Generate DFA**: Runs RPNI / EDSM state merging with recursive determinization.
   - **Generate NFA**: Runs non-deterministic state merging producing compact NFAs.

3. **Interactive Graph Visualizer**:
   - Renders states as clean circles ($q_0, q_1, \dots$).
   - Initial state marked with prominent `► START` arrow pointer.
   - Accepting states marked with standard **double concentric circle (`◎`)**.
   - Transitions marked with directed curved arrows and symbol labels.
   - **Interactive Node Dragging**: Freely rearrange state positions by clicking and dragging.
   - Zoom in, Zoom out, and Reset view controls.

4. **Traveling Node Animation & String Walkthrough**:
   - Test any input string on the generated automaton.
   - **Traveling Node Glow**: As each character is read, the active state illuminates and edges pulse.
   - **Step-by-Step Walkthrough**:
     - `▶ Play`: Automatic animation across the tape.
     - `⏭ Step Next`: Advances one character at a time (ideal for faculty demonstration).
     - Live status line: `"Read symbol '0' ──► Active State: q1"`.
   - **Output Verdict**: Clear **ACCEPTED (Green ✅)** or **REJECTED (Red ❌)** banner with plain-English explanation.

---

## 🚀 How to Run the Application

### Method 1: Double-Click Launcher (Windows)
Double-click `run_app.bat`. It starts the local server on port 8000 and automatically opens `http://localhost:8000` in your default browser.

### Method 2: Command Line
```powershell
python server.py 8000
```
Then open: **`http://localhost:8000`**

*(Requires standard Python only — zero external pip packages needed!)*

### Method 3: Run Automated Test Suite (37 Tests)
```powershell
python -m unittest discover -s backend/tests
```
```text
Ran 37 tests in 0.398s
OK (All unit tests passing)
```

---

## 📁 Project Structure

```
c:\Users\sarth\Desktop\web project\toc\
├── backend/
│   ├── automata/
│   │   ├── core/
│   │   │   ├── dfa.py           # DFA data structure, simulation tracer, canonicalization
│   │   │   ├── nfa.py           # NFA data structure, ε-closures, subset construction
│   │   │   └── operations.py    # Hopcroft minimization, product automata, equivalence
│   │   ├── dataset/
│   │   │   ├── preprocessor.py  # CSV Preprocessor Layer (parser & validator)
│   │   │   ├── tomita.py        # 7 Tomita benchmark grammars
│   │   │   └── generator.py     # Chow's W-Method characteristic sampler
│   │   ├── learning/
│   │   │   ├── rpni.py          # RPNI state merging algorithm
│   │   │   ├── edsm.py          # Evidence-Driven State Merging
│   │   │   ├── lstar.py         # Angluin's L* Active Learning
│   │   │   └── nfa_learning.py  # Non-deterministic state merging
│   │   └── evaluation/
│   │       ├── metrics.py       # Confusion matrix, Precision, Recall, F1
│   │       └── ablation.py      # Sample size & noise sweeps
│   ├── tests/                   # 37 Automated Unit Tests (100% passing)
│   ├── api.py                   # Unified backend service
│   └── main.py                  # FastAPI REST API
├── frontend/
│   ├── index.html               # React 18 Single-Page Application
│   └── src/utils/
│       └── csvPreprocessor.js   # Client-side CSV preprocessor
├── sample_csvs/                 # Ready-to-use CSV datasets
│   ├── ends_with_01.csv
│   ├── divisible_by_3.csv
│   ├── even_zeros_and_ones.csv
│   └── no_three_zeros.csv
├── server.py                    # Lightweight zero-dependency HTTP server
├── run_app.bat                  # One-click Windows runner
└── README.md
```

---

## 🎓 Faculty Presentation Guide (Quick Demo)

1. **Upload CSV**:
   - Click the preset button **`Binary Divisible by 3`** (or drag & drop your own CSV).
   - Point out the **Preprocessor Summary**: shows Total Rows, Positive count, Negative count, and inferred Alphabet $\Sigma = \{0, 1\}$.
2. **Generate Model**:
   - Click **`Generate DFA`** $\to$ the 3-state minimal DFA appears immediately.
   - Show how you can click and drag states to arrange them on the canvas.
3. **Run Traveling Node Animation**:
   - Enter `110` (decimal 6, divisible by 3) in the test box.
   - Click **`Step Next ⏭`** to step through:
     - Step 1: Consumes `'1'` $\to$ state `q1` pulses blue.
     - Step 2: Consumes `'1'` $\to$ state `q0` pulses blue.
     - Step 3: Consumes `'0'` $\to$ state `q0` pulses blue.
   - The banner turns green: **`ACCEPTED ✅`** (Finished in accepting state `q0`).
4. **Test Rejection**:
   - Enter `101` (decimal 5, not divisible by 3) and click **`Play ▶`**.
   - Watch the active state travel to `q2` and the banner turn red: **`REJECTED ❌`**.
5. **NFA Comparison**:
   - Switch to preset **`Ends with '01'`** and click **`Generate NFA`** to demonstrate non-deterministic state generation.
