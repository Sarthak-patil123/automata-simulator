import unittest
from backend.automata.dataset.preprocessor import preprocess_csv_content, normalize_label, normalize_string


class TestCSVPreprocessor(unittest.TestCase):

    def test_standard_csv_with_headers(self):
        csv_text = """string,label
101,1
100,0
01,1
00,0
111,1
"""
        res = preprocess_csv_content(csv_text)
        self.assertTrue(res["is_valid"])
        self.assertEqual(res["positive_count"], 3)
        self.assertEqual(res["negative_count"], 2)
        self.assertEqual(res["alphabet"], ["0", "1"])
        self.assertIn("101", res["positive_strings"])
        self.assertIn("100", res["negative_strings"])

    def test_text_boolean_labels_and_empty_string(self):
        csv_text = """word,accepted
"",true
0,false
10,accept
01,reject
110,yes
000,no
"""
        res = preprocess_csv_content(csv_text)
        self.assertTrue(res["is_valid"])
        self.assertIn("", res["positive_strings"])  # Empty string (epsilon)
        self.assertIn("0", res["negative_strings"])
        self.assertIn("10", res["positive_strings"])
        self.assertIn("01", res["negative_strings"])
        self.assertIn("110", res["positive_strings"])
        self.assertIn("000", res["negative_strings"])

    def test_custom_alphabet(self):
        csv_text = """sample,class
ab,1
ba,0
aab,1
bba,0
"""
        res = preprocess_csv_content(csv_text)
        self.assertTrue(res["is_valid"])
        self.assertEqual(res["alphabet"], ["a", "b"])

    def test_invalid_label_skipping(self):
        csv_text = """string,label
101,1
100,unknown_label
01,0
"""
        res = preprocess_csv_content(csv_text)
        self.assertTrue(res["is_valid"])
        self.assertEqual(res["positive_count"], 1)
        self.assertEqual(res["negative_count"], 1)
        self.assertEqual(res["skipped_rows_count"], 1)
        self.assertEqual(res["skipped_rows"][0]["raw_label"], "unknown_label")


if __name__ == "__main__":
    unittest.main()

