# Mathematically Minimal Ground-Truth DFAs

This directory contains the ground-truth minimal Deterministic Finite Automata (DFAs) for all 20 benchmark problems.
Each question includes formal 5-tuple definitions $(Q, \Sigma, \delta, q_0, F)$, state semantics, and transition tables.

| No. | Level | Problem Name | States | Start | Accept States | JSON Specification |
|:---:|:---|:---|:---:|:---:|:---:|:---|
| 1 | Level 1 – Easy | End with 0 | 2 | `q0` | `q1` | [`01_ends_with_0.json`](./01_ends_with_0.json) |
| 2 | Level 1 – Easy | Start with 1 | 3 | `q0` | `q1` | [`02_starts_with_1.json`](./02_starts_with_1.json) |
| 3 | Level 1 – Easy | Contain at least one 0 | 2 | `q0` | `q1` | [`03_contains_at_least_one_0.json`](./03_contains_at_least_one_0.json) |
| 4 | Level 1 – Easy | Contain exactly one 1 | 3 | `q0` | `q1` | [`04_contains_exactly_one_1.json`](./04_contains_exactly_one_1.json) |
| 5 | Level 1 – Easy | Have an even number of 0s | 2 | `q0` | `q0` | [`05_even_number_of_0s.json`](./05_even_number_of_0s.json) |
| 6 | Level 2 – Easy to Moderate | Have an odd number of 1s | 2 | `q0` | `q1` | [`06_odd_number_of_1s.json`](./06_odd_number_of_1s.json) |
| 7 | Level 2 – Easy to Moderate | End with 01 | 3 | `q0` | `q2` | [`07_ends_with_01.json`](./07_ends_with_01.json) |
| 8 | Level 2 – Easy to Moderate | Start with 0 and end with 1 | 4 | `q0` | `q2` | [`08_starts_with_0_and_ends_with_1.json`](./08_starts_with_0_and_ends_with_1.json) |
| 9 | Level 2 – Easy to Moderate | Contain substring 00 | 3 | `q0` | `q2` | [`09_contains_substring_00.json`](./09_contains_substring_00.json) |
| 10 | Level 2 – Easy to Moderate | Do not contain substring 11 | 3 | `q0` | `q0, q1` | [`10_does_not_contain_substring_11.json`](./10_does_not_contain_substring_11.json) |
| 11 | Level 3 – Moderate | Even number of 0s and even number of 1s | 4 | `q_ee` | `q_ee` | [`11_even_0s_and_even_1s.json`](./11_even_0s_and_even_1s.json) |
| 12 | Level 3 – Moderate | Contain at least two consecutive 0s | 3 | `q0` | `q2` | [`12_at_least_two_consecutive_0s.json`](./12_at_least_two_consecutive_0s.json) |
| 13 | Level 3 – Moderate | Number of 1s divisible by 3 | 3 | `q0` | `q0` | [`13_number_of_1s_divisible_by_3.json`](./13_number_of_1s_divisible_by_3.json) |
| 14 | Level 3 – Moderate | End with 101 or 010 | 7 | `q_eps` | `q_010, q_101` | [`14_ends_with_101_or_010.json`](./14_ends_with_101_or_010.json) |
| 15 | Level 3 – Moderate | Contain exactly two occurrences of 0 | 4 | `q0` | `q2` | [`15_exactly_two_occurrences_of_0.json`](./15_exactly_two_occurrences_of_0.json) |
| 16 | Level 4 – Medium | Even number of 0s and odd number of 1s | 4 | `q_ee` | `q_eo` | [`16_even_0s_and_odd_1s.json`](./16_even_0s_and_odd_1s.json) |
| 17 | Level 4 – Medium | Do not contain substring 010 | 4 | `q0` | `q0, q1, q01` | [`17_does_not_contain_substring_010.json`](./17_does_not_contain_substring_010.json) |
| 18 | Level 4 – Medium | Binary value divisible by 3 | 3 | `q0` | `q0` | [`18_binary_value_divisible_by_3.json`](./18_binary_value_divisible_by_3.json) |
| 19 | Level 4 – Medium | Contain both substrings 00 and 11 | 8 | `q0` | `q4` | [`19_contains_both_00_and_11.json`](./19_contains_both_00_and_11.json) |
| 20 | Level 4 – Medium | Length divisible by 3 and end with 1 | 4 | `q0` | `qa` | [`20_length_divisible_by_3_and_ends_with_1.json`](./20_length_divisible_by_3_and_ends_with_1.json) |
