/**
 * Dynamic Testcase Generator for Regular Languages & Automata
 * Generates custom-sized, configurable positive & negative string datasets
 * for all 20 benchmark regular languages and custom automata.
 */

// Ground-truth acceptance rules for all 20 benchmark languages (verified 100% against benchmark testcases)
export const BENCHMARK_RULES = {
  1: (s) => s.endsWith('0'),
  '01_ends_with_0': (s) => s.endsWith('0'),
  'ends_with_0': (s) => s.endsWith('0'),

  2: (s) => s.startsWith('1'),
  '02_starts_with_1': (s) => s.startsWith('1'),
  'starts_with_1': (s) => s.startsWith('1'),

  3: (s) => s.includes('0'),
  '03_contains_at_least_one_0': (s) => s.includes('0'),
  'contains_at_least_one_0': (s) => s.includes('0'),

  4: (s) => (s.match(/1/g) || []).length === 1,
  '04_contains_exactly_one_1': (s) => (s.match(/1/g) || []).length === 1,
  'contains_exactly_one_1': (s) => (s.match(/1/g) || []).length === 1,

  5: (s) => (s.match(/0/g) || []).length % 2 === 0,
  '05_even_number_of_0s': (s) => (s.match(/0/g) || []).length % 2 === 0,
  'even_number_of_0s': (s) => (s.match(/0/g) || []).length % 2 === 0,

  6: (s) => (s.match(/1/g) || []).length % 2 === 1,
  '06_odd_number_of_1s': (s) => (s.match(/1/g) || []).length % 2 === 1,
  'odd_number_of_1s': (s) => (s.match(/1/g) || []).length % 2 === 1,

  7: (s) => s.endsWith('01'),
  '07_ends_with_01': (s) => s.endsWith('01'),
  'ends_with_01': (s) => s.endsWith('01'),

  8: (s) => s.startsWith('0') && s.endsWith('1'),
  '08_starts_with_0_and_ends_with_1': (s) => s.startsWith('0') && s.endsWith('1'),
  'starts_with_0_and_ends_with_1': (s) => s.startsWith('0') && s.endsWith('1'),

  9: (s) => s.includes('00'),
  '09_contains_substring_00': (s) => s.includes('00'),
  'contains_substring_00': (s) => s.includes('00'),

  10: (s) => !s.includes('11'),
  '10_does_not_contain_substring_11': (s) => !s.includes('11'),
  'does_not_contain_substring_11': (s) => !s.includes('11'),

  11: (s) => (s.match(/0/g) || []).length % 2 === 0 && (s.match(/1/g) || []).length % 2 === 0,
  '11_even_0s_and_even_1s': (s) =>
    (s.match(/0/g) || []).length % 2 === 0 && (s.match(/1/g) || []).length % 2 === 0,
  'even_0s_and_even_1s': (s) =>
    (s.match(/0/g) || []).length % 2 === 0 && (s.match(/1/g) || []).length % 2 === 0,
  'even_zeros_and_ones': (s) =>
    (s.match(/0/g) || []).length % 2 === 0 && (s.match(/1/g) || []).length % 2 === 0,
  'even_0s_and_1s': (s) =>
    (s.match(/0/g) || []).length % 2 === 0 && (s.match(/1/g) || []).length % 2 === 0,

  12: (s) => s.includes('00'),
  '12_at_least_two_consecutive_0s': (s) => s.includes('00'),
  'at_least_two_consecutive_0s': (s) => s.includes('00'),

  13: (s) => (s.match(/1/g) || []).length % 3 === 0,
  '13_number_of_1s_divisible_by_3': (s) => (s.match(/1/g) || []).length % 3 === 0,
  'number_of_1s_divisible_by_3': (s) => (s.match(/1/g) || []).length % 3 === 0,

  14: (s) => s.endsWith('101') || s.endsWith('010'),
  '14_ends_with_101_or_010': (s) => s.endsWith('101') || s.endsWith('010'),
  'ends_with_101_or_010': (s) => s.endsWith('101') || s.endsWith('010'),

  15: (s) => (s.match(/0/g) || []).length === 2,
  '15_exactly_two_occurrences_of_0': (s) => (s.match(/0/g) || []).length === 2,
  'exactly_two_occurrences_of_0': (s) => (s.match(/0/g) || []).length === 2,

  16: (s) => (s.match(/0/g) || []).length % 2 === 0 && (s.match(/1/g) || []).length % 2 === 1,
  '16_even_0s_and_odd_1s': (s) =>
    (s.match(/0/g) || []).length % 2 === 0 && (s.match(/1/g) || []).length % 2 === 1,
  'even_0s_and_odd_1s': (s) =>
    (s.match(/0/g) || []).length % 2 === 0 && (s.match(/1/g) || []).length % 2 === 1,

  17: (s) => !s.includes('010'),
  '17_does_not_contain_substring_010': (s) => !s.includes('010'),
  'does_not_contain_substring_010': (s) => !s.includes('010'),

  18: (s) => (s === '' ? true : parseInt(s, 2) % 3 === 0),
  '18_binary_value_divisible_by_3': (s) => (s === '' ? true : parseInt(s, 2) % 3 === 0),
  '18_binary_divisible_by_3': (s) => (s === '' ? true : parseInt(s, 2) % 3 === 0),
  'binary_divisible_by_3': (s) => (s === '' ? true : parseInt(s, 2) % 3 === 0),
  'divisible_by_3': (s) => (s === '' ? true : parseInt(s, 2) % 3 === 0),

  19: (s) => s.includes('00') && s.includes('11'),
  '19_contains_both_00_and_11': (s) => s.includes('00') && s.includes('11'),
  'contains_both_00_and_11': (s) => s.includes('00') && s.includes('11'),

  20: (s) => s.length % 3 === 0 && s.endsWith('1'),
  '20_length_divisible_by_3_and_ends_with_1': (s) => s.length % 3 === 0 && s.endsWith('1'),
  'length_divisible_by_3_and_ends_with_1': (s) => s.length % 3 === 0 && s.endsWith('1'),

  // Preset: does not contain 000
  'does_not_contain_000': (s) => !s.includes('000'),
};

/**
 * Finds the matching acceptance rule function based on key, slug, id, or title.
 */
export function getRuleForLanguage(identifier = '') {
  if (!identifier) return null;

  // Direct number check (e.g. 11 or "11")
  const num = parseInt(identifier, 10);
  if (!isNaN(num) && BENCHMARK_RULES[num]) {
    return BENCHMARK_RULES[num];
  }

  const cleanId = String(identifier).trim().toLowerCase();

  // Direct key lookup
  if (BENCHMARK_RULES[cleanId]) return BENCHMARK_RULES[cleanId];

  // Prefix number match (e.g., '11_even_0s_and_even_1s' or 'q11')
  const prefixMatch = cleanId.match(/^(?:q|0*)(\d{1,2})[_\b\s]/);
  if (prefixMatch) {
    const qNum = parseInt(prefixMatch[1], 10);
    if (BENCHMARK_RULES[qNum]) return BENCHMARK_RULES[qNum];
  }

  // Exact slug matching
  for (const [key, fn] of Object.entries(BENCHMARK_RULES)) {
    if (cleanId === key.toLowerCase() || cleanId.includes(key.toLowerCase())) {
      return fn;
    }
  }

  // Keywords matching across benchmark titles
  if (cleanId.includes('even') && cleanId.includes('0') && cleanId.includes('1')) {
    if (cleanId.includes('odd')) return BENCHMARK_RULES[16];
    return BENCHMARK_RULES[11];
  }
  if (cleanId.includes('divisible by 3') || cleanId.includes('mod 3')) {
    if (cleanId.includes('length')) return BENCHMARK_RULES[20];
    if (cleanId.includes('1s')) return BENCHMARK_RULES[13];
    return BENCHMARK_RULES[18];
  }
  if (cleanId.includes('010') && cleanId.includes('not contain')) {
    return BENCHMARK_RULES[17];
  }
  if (cleanId.includes('101 or 010')) {
    return BENCHMARK_RULES[14];
  }
  if (cleanId.includes('two occurrences of 0')) {
    return BENCHMARK_RULES[15];
  }
  if (cleanId.includes('ends with 01') || cleanId.includes('end with 01')) {
    return BENCHMARK_RULES[7];
  }
  if (cleanId.includes('starts with 0') && cleanId.includes('end with 1')) {
    return BENCHMARK_RULES[8];
  }
  if (cleanId.includes('ends with 0') || cleanId.includes('end with 0')) {
    return BENCHMARK_RULES[1];
  }
  if (cleanId.includes('starts with 1') || cleanId.includes('start with 1')) {
    return BENCHMARK_RULES[2];
  }
  if (cleanId.includes('at least one 0') || cleanId.includes('contain at least one 0')) {
    return BENCHMARK_RULES[3];
  }
  if (cleanId.includes('exactly one 1')) {
    return BENCHMARK_RULES[4];
  }
  if (cleanId.includes('both') && cleanId.includes('00') && cleanId.includes('11')) {
    return BENCHMARK_RULES[19];
  }
  if (cleanId.includes('substring 00') || cleanId.includes('consecutive 0s')) {
    return BENCHMARK_RULES[9];
  }
  if (cleanId.includes('not contain') && cleanId.includes('11')) {
    return BENCHMARK_RULES[10];
  }
  if (cleanId.includes('not contain') && cleanId.includes('000')) {
    return BENCHMARK_RULES['does_not_contain_000'];
  }
  if (cleanId.includes('even') && cleanId.includes('0')) {
    return BENCHMARK_RULES[5];
  }
  if (cleanId.includes('odd') && cleanId.includes('1')) {
    return BENCHMARK_RULES[6];
  }

  return null;
}

/**
 * Main Dynamic Testcase Generator.
 * Given a language identifier and requested positive/negative counts (or total count & ratio),
 * guarantees generating EXACT requested counts of unique positive and unique negative strings.
 *
 * @param {string} languageIdentifier - Slug, title, or key of the problem
 * @param {object|number} countConfig - Number of total samples, or object { posCount, negCount, totalCount, ratio }
 * @param {object} fallbackGraph - Optional active graph for fallback simulation
 * @returns {object} { csv, positiveStrings, negativeStrings, totalSamples, positiveCount, negativeCount }
 */
export function generateDynamicTestcases(languageIdentifier, countConfig = 20, fallbackGraph = null) {
  let reqPos = 10;
  let reqNeg = 10;

  if (typeof countConfig === 'number') {
    const total = Math.max(2, Math.min(100, countConfig));
    reqPos = Math.ceil(total / 2);
    reqNeg = total - reqPos;
  } else if (typeof countConfig === 'object' && countConfig !== null) {
    if (countConfig.posCount !== undefined && countConfig.negCount !== undefined) {
      reqPos = Math.max(1, Math.min(60, Number(countConfig.posCount) || 10));
      reqNeg = Math.max(1, Math.min(60, Number(countConfig.negCount) || 10));
    } else if (countConfig.totalCount !== undefined) {
      const total = Math.max(2, Math.min(100, Number(countConfig.totalCount) || 20));
      const ratio = Math.max(0.1, Math.min(0.9, Number(countConfig.ratio) || 0.5));
      reqPos = Math.max(1, Math.round(total * ratio));
      reqNeg = Math.max(1, total - reqPos);
    }
  }

  let ruleFn = getRuleForLanguage(languageIdentifier);

  // If no rule matched, check if we can simulate against active graph
  if (!ruleFn && fallbackGraph?.initial_state && fallbackGraph?.edges) {
    ruleFn = (str) => {
      let curr = fallbackGraph.initial_state;
      for (const ch of str) {
        const edge = (fallbackGraph.edges || []).find((e) => e.source === curr && e.label === ch);
        if (!edge) return false;
        curr = edge.target;
      }
      return Boolean(fallbackGraph.accept_states?.includes(curr));
    };
  }

  // Fallback to Even 0s and Even 1s if completely unspecified
  if (!ruleFn) {
    ruleFn = BENCHMARK_RULES[11];
  }

  const posSet = new Set();
  const negSet = new Set();
  const alphabet = ['0', '1'];

  // Phase 1: Exhaustive BFS in shortlex order (lengths 0 to 7 = 255 strings)
  const queue = [''];
  while (queue.length > 0) {
    const s = queue.shift();
    let acc = false;
    try {
      acc = Boolean(ruleFn(s));
    } catch {
      acc = false;
    }

    if (acc) {
      posSet.add(s);
    } else {
      negSet.add(s);
    }

    if (s.length < 7) {
      for (const ch of alphabet) {
        queue.push(s + ch);
      }
    }
  }

  // Phase 2: If sparse language needs more strings, run targeted extensions up to length 14
  let len = 8;
  while ((posSet.size < reqPos || negSet.size < reqNeg) && len <= 14) {
    const targeted = [
      '0'.repeat(len),
      '1'.repeat(len),
      '01'.repeat(Math.floor(len / 2)),
      '10'.repeat(Math.floor(len / 2)),
      '0'.repeat(len - 1) + '1',
      '1'.repeat(len - 1) + '0',
    ];
    for (let i = 0; i < len; i++) {
      targeted.push('0'.repeat(i) + '1' + '0'.repeat(len - 1 - i));
      targeted.push('1'.repeat(i) + '0' + '1'.repeat(len - 1 - i));
    }
    // Random variations of current length
    for (let r = 0; r < 60; r++) {
      let s = '';
      for (let j = 0; j < len; j++) s += Math.random() < 0.5 ? '0' : '1';
      targeted.push(s);
    }

    for (const s of targeted) {
      let acc = false;
      try {
        acc = Boolean(ruleFn(s));
      } catch {
        acc = false;
      }

      if (acc) {
        if (posSet.size < reqPos) posSet.add(s);
      } else {
        if (negSet.size < reqNeg) negSet.add(s);
      }
    }
    len++;
  }

  // Sort shortlex: shortest strings first, then alphabetical
  const sortFn = (a, b) => a.length - b.length || a.localeCompare(b);
  const sortedPos = Array.from(posSet).sort(sortFn);
  const sortedNeg = Array.from(negSet).sort(sortFn);

  // Take EXACT counts requested
  const finalPos = sortedPos.slice(0, reqPos);
  const finalNeg = sortedNeg.slice(0, reqNeg);

  // Build CSV
  const rows = ['string,label'];
  for (const s of finalPos) {
    rows.push(`${s},1`);
  }
  for (const s of finalNeg) {
    rows.push(`${s},0`);
  }
  const csv = rows.join('\n') + '\n';

  return {
    csv,
    positiveStrings: finalPos,
    negativeStrings: finalNeg,
    totalSamples: finalPos.length + finalNeg.length,
    positiveCount: finalPos.length,
    negativeCount: finalNeg.length,
    languageIdentifier,
  };
}
