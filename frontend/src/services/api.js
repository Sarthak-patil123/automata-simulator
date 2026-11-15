/**
 * API Service for Automata Learning Studio
 * Seamless communication with server.py / FastAPI backend.
 */

const BASE_URL = '';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  /**
   * Preprocess and validate raw CSV string
   */
  preprocessCsv: (csvText) =>
    request('/api/dataset/preprocess-csv', {
      method: 'POST',
      body: JSON.stringify({ csv_text: csvText }),
    }),

  /**
   * Train/Infer Automaton Model (DFA via L* active learning / NFA via state merging)
   */
  trainModel: ({ sessionId, modelType = 'dfa', positiveStrings = [], negativeStrings = [], alphabet = null }) =>
    request('/api/model/train', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        model_type: modelType,
        positive_strings: positiveStrings,
        negative_strings: negativeStrings,
        alphabet,
      }),
    }),

  /**
   * Answer a membership query from the AI active learner
   */
  answerHitlQuery: (sessionId, isAccepted) =>
    request('/api/hitl/answer', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        is_accepted: isAccepted,
      }),
    }),

  /**
   * Skip remaining active learning queries and finalize model
   */
  skipHitl: (sessionId) =>
    request('/api/hitl/skip', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
      }),
    }),

  /**
   * Confirm current conjecture or supply a counterexample string
   */
  confirmHitlConjecture: (sessionId, counterexample = null, expectedLabel = null) =>
    request('/api/hitl/confirm', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        counterexample: counterexample || null,
        expected_label: expectedLabel,
      }),
    }),

  /**
   * Simulate a test string step-by-step through the inferred automaton
   */
  simulateString: (sessionId, testString) =>
    request('/api/model/simulate', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        test_string: testString,
      }),
    }),

  /**
   * Fetch Tomita regular language benchmark presets
   */
  getPresets: () => request('/api/presets', { method: 'GET' }),
};
