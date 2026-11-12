# Automata Learning Studio — Benchmark Testcases CSVs

This directory contains balanced, verified testcase CSV files for all 20 benchmark questions across 4 difficulty levels.

| No. | Level | Question Name | Positive | Negative | Total | CSV File |
|:---:|:---|:---|:---:|:---:|:---:|:---|
| 1 | Level 1 – Easy | End with 0 | 8 | 8 | 16 | [`01_ends_with_0.csv`](./01_ends_with_0.csv) |
| 2 | Level 1 – Easy | Start with 1 | 8 | 8 | 16 | [`02_starts_with_1.csv`](./02_starts_with_1.csv) |
| 3 | Level 1 – Easy | Contain at least one 0 | 8 | 7 | 15 | [`03_contains_at_least_one_0.csv`](./03_contains_at_least_one_0.csv) |
| 4 | Level 1 – Easy | Contain exactly one 1 | 9 | 9 | 18 | [`04_contains_exactly_one_1.csv`](./04_contains_exactly_one_1.csv) |
| 5 | Level 1 – Easy | Have an even number of 0s | 9 | 9 | 18 | [`05_even_number_of_0s.csv`](./05_even_number_of_0s.csv) |
| 6 | Level 2 – Easy to Moderate | Have an odd number of 1s | 10 | 10 | 20 | [`06_odd_number_of_1s.csv`](./06_odd_number_of_1s.csv) |
| 7 | Level 2 – Easy to Moderate | End with 01 | 11 | 11 | 22 | [`07_ends_with_01.csv`](./07_ends_with_01.csv) |
| 8 | Level 2 – Easy to Moderate | Start with 0 and end with 1 | 12 | 12 | 24 | [`08_starts_with_0_and_ends_with_1.csv`](./08_starts_with_0_and_ends_with_1.csv) |
| 9 | Level 2 – Easy to Moderate | Contain substring 00 | 11 | 11 | 22 | [`09_contains_substring_00.csv`](./09_contains_substring_00.csv) |
| 10 | Level 2 – Easy to Moderate | Do not contain substring 11 | 11 | 11 | 22 | [`10_does_not_contain_substring_11.csv`](./10_does_not_contain_substring_11.csv) |
| 11 | Level 3 – Moderate | Even number of 0s and even number of 1s | 14 | 14 | 28 | [`11_even_0s_and_even_1s.csv`](./11_even_0s_and_even_1s.csv) |
| 12 | Level 3 – Moderate | Contain at least two consecutive 0s | 12 | 12 | 24 | [`12_at_least_two_consecutive_0s.csv`](./12_at_least_two_consecutive_0s.csv) |
| 13 | Level 3 – Moderate | Number of 1s divisible by 3 | 13 | 13 | 26 | [`13_number_of_1s_divisible_by_3.csv`](./13_number_of_1s_divisible_by_3.csv) |
| 14 | Level 3 – Moderate | End with 101 or 010 | 16 | 16 | 32 | [`14_ends_with_101_or_010.csv`](./14_ends_with_101_or_010.csv) |
| 15 | Level 3 – Moderate | Contain exactly two occurrences of 0 | 13 | 13 | 26 | [`15_exactly_two_occurrences_of_0.csv`](./15_exactly_two_occurrences_of_0.csv) |
| 16 | Level 4 – Medium | Even number of 0s and odd number of 1s | 14 | 14 | 28 | [`16_even_0s_and_odd_1s.csv`](./16_even_0s_and_odd_1s.csv) |
| 17 | Level 4 – Medium | Do not contain substring 010 | 14 | 14 | 28 | [`17_does_not_contain_substring_010.csv`](./17_does_not_contain_substring_010.csv) |
| 18 | Level 4 – Medium | Binary value divisible by 3 | 15 | 15 | 30 | [`18_binary_value_divisible_by_3.csv`](./18_binary_value_divisible_by_3.csv) |
| 19 | Level 4 – Medium | Contain both substrings 00 and 11 | 18 | 18 | 36 | [`19_contains_both_00_and_11.csv`](./19_contains_both_00_and_11.csv) |
| 20 | Level 4 – Medium | Length divisible by 3 and end with 1 | 16 | 16 | 32 | [`20_length_divisible_by_3_and_ends_with_1.csv`](./20_length_divisible_by_3_and_ends_with_1.csv) |

All CSV files follow the standard `string,label` format compatible with the Automata Learning Studio frontend and backend preprocessor.
