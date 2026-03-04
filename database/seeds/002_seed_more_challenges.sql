-- Seeds: Additional 45 Challenges

WITH ch_0 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Contains Duplicate', 'contains-duplicate', 'easy', 'Description for Contains Duplicate. Please solve optimally.', 'Arrays', 5000, 256)
  RETURNING id
),
ch_0_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_0 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_0
),
ch_0_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_0 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_0
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Arrays', 2 FROM ch_0;

WITH ch_1 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Climbing Stairs', 'climbing-stairs', 'medium', 'Description for Climbing Stairs. Please solve optimally.', 'Strings', 5000, 256)
  RETURNING id
),
ch_1_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_1 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_1
),
ch_1_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_1 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_1
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Strings', 3 FROM ch_1;

WITH ch_2 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Best Time to Buy and Sell Stock', 'best-time-to-buy-and-sell-stock', 'hard', 'Description for Best Time to Buy and Sell Stock. Please solve optimally.', 'Dynamic Programming', 5000, 256)
  RETURNING id
),
ch_2_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_2 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_2
),
ch_2_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_2 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_2
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Dynamic Programming', 5 FROM ch_2;

WITH ch_3 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Linked List Cycle', 'linked-list-cycle', 'easy', 'Description for Linked List Cycle. Please solve optimally.', 'Trees', 5000, 256)
  RETURNING id
),
ch_3_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_3 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_3
),
ch_3_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_3 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_3
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Trees', 2 FROM ch_3;

WITH ch_4 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Merge Two Sorted Lists', 'merge-two-sorted-lists', 'medium', 'Description for Merge Two Sorted Lists. Please solve optimally.', 'Graphs', 5000, 256)
  RETURNING id
),
ch_4_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_4 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_4
),
ch_4_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_4 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_4
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Graphs', 3 FROM ch_4;

WITH ch_5 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Middle of the Linked List', 'middle-of-the-linked-list', 'hard', 'Description for Middle of the Linked List. Please solve optimally.', 'Linked Lists', 5000, 256)
  RETURNING id
),
ch_5_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_5 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_5
),
ch_5_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_5 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_5
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Linked Lists', 5 FROM ch_5;

WITH ch_6 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Move Zeroes', 'move-zeroes', 'easy', 'Description for Move Zeroes. Please solve optimally.', 'Math', 5000, 256)
  RETURNING id
),
ch_6_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_6 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_6
),
ch_6_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_6 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_6
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Math', 2 FROM ch_6;

WITH ch_7 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Remove Duplicates from Sorted Array', 'remove-duplicates-from-sorted-array', 'medium', 'Description for Remove Duplicates from Sorted Array. Please solve optimally.', 'Arrays', 5000, 256)
  RETURNING id
),
ch_7_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_7 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_7
),
ch_7_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_7 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_7
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Arrays', 3 FROM ch_7;

WITH ch_8 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Remove Element', 'remove-element', 'hard', 'Description for Remove Element. Please solve optimally.', 'Strings', 5000, 256)
  RETURNING id
),
ch_8_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_8 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_8
),
ch_8_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_8 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_8
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Strings', 5 FROM ch_8;

WITH ch_9 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Search Insert Position', 'search-insert-position', 'easy', 'Description for Search Insert Position. Please solve optimally.', 'Dynamic Programming', 5000, 256)
  RETURNING id
),
ch_9_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_9 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_9
),
ch_9_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_9 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_9
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Dynamic Programming', 2 FROM ch_9;

WITH ch_10 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Find First and Last Position', 'find-first-and-last-position', 'medium', 'Description for Find First and Last Position. Please solve optimally.', 'Trees', 5000, 256)
  RETURNING id
),
ch_10_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_10 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_10
),
ch_10_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_10 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_10
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Trees', 3 FROM ch_10;

WITH ch_11 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Symmetric Tree', 'symmetric-tree', 'hard', 'Description for Symmetric Tree. Please solve optimally.', 'Graphs', 5000, 256)
  RETURNING id
),
ch_11_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_11 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_11
),
ch_11_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_11 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_11
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Graphs', 5 FROM ch_11;

WITH ch_12 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Valid Anagram', 'valid-anagram', 'easy', 'Description for Valid Anagram. Please solve optimally.', 'Linked Lists', 5000, 256)
  RETURNING id
),
ch_12_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_12 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_12
),
ch_12_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_12 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_12
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Linked Lists', 2 FROM ch_12;

WITH ch_13 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Invert Binary Tree', 'invert-binary-tree', 'medium', 'Description for Invert Binary Tree. Please solve optimally.', 'Math', 5000, 256)
  RETURNING id
),
ch_13_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_13 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_13
),
ch_13_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_13 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_13
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Math', 3 FROM ch_13;

WITH ch_14 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Merge Sorted Array', 'merge-sorted-array', 'hard', 'Description for Merge Sorted Array. Please solve optimally.', 'Arrays', 5000, 256)
  RETURNING id
),
ch_14_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_14 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_14
),
ch_14_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_14 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_14
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Arrays', 5 FROM ch_14;

WITH ch_15 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Pascal''s Triangle', 'pascals-triangle', 'easy', 'Description for Pascal''s Triangle. Please solve optimally.', 'Strings', 5000, 256)
  RETURNING id
),
ch_15_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_15 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_15
),
ch_15_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_15 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_15
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Strings', 2 FROM ch_15;

WITH ch_16 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Majority Element', 'majority-element', 'medium', 'Description for Majority Element. Please solve optimally.', 'Dynamic Programming', 5000, 256)
  RETURNING id
),
ch_16_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_16 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_16
),
ch_16_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_16 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_16
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Dynamic Programming', 3 FROM ch_16;

WITH ch_17 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Missing Number', 'missing-number', 'hard', 'Description for Missing Number. Please solve optimally.', 'Trees', 5000, 256)
  RETURNING id
),
ch_17_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_17 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_17
),
ch_17_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_17 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_17
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Trees', 5 FROM ch_17;

WITH ch_18 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Intersection of Two Arrays', 'intersection-of-two-arrays', 'easy', 'Description for Intersection of Two Arrays. Please solve optimally.', 'Graphs', 5000, 256)
  RETURNING id
),
ch_18_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_18 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_18
),
ch_18_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_18 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_18
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Graphs', 2 FROM ch_18;

WITH ch_19 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('First Unique Character in a String', 'first-unique-character-in-a-string', 'medium', 'Description for First Unique Character in a String. Please solve optimally.', 'Linked Lists', 5000, 256)
  RETURNING id
),
ch_19_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_19 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_19
),
ch_19_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_19 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_19
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Linked Lists', 3 FROM ch_19;

WITH ch_20 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Find the Difference', 'find-the-difference', 'hard', 'Description for Find the Difference. Please solve optimally.', 'Math', 5000, 256)
  RETURNING id
),
ch_20_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_20 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_20
),
ch_20_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_20 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_20
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Math', 5 FROM ch_20;

WITH ch_21 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Is Subsequence', 'is-subsequence', 'easy', 'Description for Is Subsequence. Please solve optimally.', 'Arrays', 5000, 256)
  RETURNING id
),
ch_21_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_21 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_21
),
ch_21_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_21 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_21
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Arrays', 2 FROM ch_21;

WITH ch_22 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Add Strings', 'add-strings', 'medium', 'Description for Add Strings. Please solve optimally.', 'Strings', 5000, 256)
  RETURNING id
),
ch_22_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_22 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_22
),
ch_22_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_22 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_22
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Strings', 3 FROM ch_22;

WITH ch_23 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Merge Intervals', 'merge-intervals', 'hard', 'Description for Merge Intervals. Please solve optimally.', 'Dynamic Programming', 5000, 256)
  RETURNING id
),
ch_23_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_23 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_23
),
ch_23_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_23 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_23
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Dynamic Programming', 5 FROM ch_23;

WITH ch_24 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Insert Interval', 'insert-interval', 'easy', 'Description for Insert Interval. Please solve optimally.', 'Trees', 5000, 256)
  RETURNING id
),
ch_24_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_24 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_24
),
ch_24_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_24 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_24
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Trees', 2 FROM ch_24;

WITH ch_25 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Set Matrix Zeroes', 'set-matrix-zeroes', 'medium', 'Description for Set Matrix Zeroes. Please solve optimally.', 'Graphs', 5000, 256)
  RETURNING id
),
ch_25_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_25 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_25
),
ch_25_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_25 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_25
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Graphs', 3 FROM ch_25;

WITH ch_26 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Spiral Matrix', 'spiral-matrix', 'hard', 'Description for Spiral Matrix. Please solve optimally.', 'Linked Lists', 5000, 256)
  RETURNING id
),
ch_26_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_26 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_26
),
ch_26_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_26 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_26
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Linked Lists', 5 FROM ch_26;

WITH ch_27 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Rotate Image', 'rotate-image', 'easy', 'Description for Rotate Image. Please solve optimally.', 'Math', 5000, 256)
  RETURNING id
),
ch_27_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_27 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_27
),
ch_27_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_27 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_27
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Math', 2 FROM ch_27;

WITH ch_28 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Word Search', 'word-search', 'medium', 'Description for Word Search. Please solve optimally.', 'Arrays', 5000, 256)
  RETURNING id
),
ch_28_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_28 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_28
),
ch_28_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_28 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_28
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Arrays', 3 FROM ch_28;

WITH ch_29 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Longest Substring Without Repeating Characters', 'longest-substring-without-repeating-characters', 'hard', 'Description for Longest Substring Without Repeating Characters. Please solve optimally.', 'Strings', 5000, 256)
  RETURNING id
),
ch_29_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_29 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_29
),
ch_29_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_29 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_29
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Strings', 5 FROM ch_29;

WITH ch_30 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Longest Palindromic Substring', 'longest-palindromic-substring', 'easy', 'Description for Longest Palindromic Substring. Please solve optimally.', 'Dynamic Programming', 5000, 256)
  RETURNING id
),
ch_30_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_30 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_30
),
ch_30_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_30 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_30
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Dynamic Programming', 2 FROM ch_30;

WITH ch_31 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Container With Most Water', 'container-with-most-water', 'medium', 'Description for Container With Most Water. Please solve optimally.', 'Trees', 5000, 256)
  RETURNING id
),
ch_31_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_31 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_31
),
ch_31_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_31 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_31
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Trees', 3 FROM ch_31;

WITH ch_32 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('3Sum', '3sum', 'hard', 'Description for 3Sum. Please solve optimally.', 'Graphs', 5000, 256)
  RETURNING id
),
ch_32_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_32 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_32
),
ch_32_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_32 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_32
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Graphs', 5 FROM ch_32;

WITH ch_33 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Letter Combinations of a Phone Number', 'letter-combinations-of-a-phone-number', 'easy', 'Description for Letter Combinations of a Phone Number. Please solve optimally.', 'Linked Lists', 5000, 256)
  RETURNING id
),
ch_33_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_33 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_33
),
ch_33_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_33 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_33
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Linked Lists', 2 FROM ch_33;

WITH ch_34 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Remove Nth Node From End of List', 'remove-nth-node-from-end-of-list', 'medium', 'Description for Remove Nth Node From End of List. Please solve optimally.', 'Math', 5000, 256)
  RETURNING id
),
ch_34_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_34 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_34
),
ch_34_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_34 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_34
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Math', 3 FROM ch_34;

WITH ch_35 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Generate Parentheses', 'generate-parentheses', 'hard', 'Description for Generate Parentheses. Please solve optimally.', 'Arrays', 5000, 256)
  RETURNING id
),
ch_35_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_35 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_35
),
ch_35_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_35 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_35
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Arrays', 5 FROM ch_35;

WITH ch_36 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Swap Nodes in Pairs', 'swap-nodes-in-pairs', 'easy', 'Description for Swap Nodes in Pairs. Please solve optimally.', 'Strings', 5000, 256)
  RETURNING id
),
ch_36_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_36 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_36
),
ch_36_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_36 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_36
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Strings', 2 FROM ch_36;

WITH ch_37 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Next Permutation', 'next-permutation', 'medium', 'Description for Next Permutation. Please solve optimally.', 'Dynamic Programming', 5000, 256)
  RETURNING id
),
ch_37_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_37 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_37
),
ch_37_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_37 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_37
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Dynamic Programming', 3 FROM ch_37;

WITH ch_38 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Search in Rotated Sorted Array', 'search-in-rotated-sorted-array', 'hard', 'Description for Search in Rotated Sorted Array. Please solve optimally.', 'Trees', 5000, 256)
  RETURNING id
),
ch_38_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_38 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_38
),
ch_38_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_38 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_38
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Trees', 5 FROM ch_38;

WITH ch_39 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Find Minimum in Rotated Sorted Array', 'find-minimum-in-rotated-sorted-array', 'easy', 'Description for Find Minimum in Rotated Sorted Array. Please solve optimally.', 'Graphs', 5000, 256)
  RETURNING id
),
ch_39_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_39 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_39
),
ch_39_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_39 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_39
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Graphs', 2 FROM ch_39;

WITH ch_40 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Combination Sum', 'combination-sum', 'medium', 'Description for Combination Sum. Please solve optimally.', 'Linked Lists', 5000, 256)
  RETURNING id
),
ch_40_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_40 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_40
),
ch_40_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_40 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_40
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Linked Lists', 3 FROM ch_40;

WITH ch_41 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Permutations', 'permutations', 'hard', 'Description for Permutations. Please solve optimally.', 'Math', 5000, 256)
  RETURNING id
),
ch_41_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_41 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_41
),
ch_41_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_41 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_41
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Math', 5 FROM ch_41;

WITH ch_42 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Rotate List', 'rotate-list', 'easy', 'Description for Rotate List. Please solve optimally.', 'Arrays', 5000, 256)
  RETURNING id
),
ch_42_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_42 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_42
),
ch_42_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_42 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_42
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Arrays', 2 FROM ch_42;

WITH ch_43 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Unique Paths', 'unique-paths', 'medium', 'Description for Unique Paths. Please solve optimally.', 'Strings', 5000, 256)
  RETURNING id
),
ch_43_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_43 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_43
),
ch_43_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_43 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_43
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Strings', 3 FROM ch_43;

WITH ch_44 AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES ('Minimum Path Sum', 'minimum-path-sum', 'hard', 'Description for Minimum Path Sum. Please solve optimally.', 'Dynamic Programming', 5000, 256)
  RETURNING id
),
ch_44_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"input": []}', '"output"', 1 FROM ch_44 UNION ALL
  SELECT id, '{"input": [1]}', '"output"', 2 FROM ch_44
),
ch_44_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', 'function solve() {\n  // TODO\n}' FROM ch_44 UNION ALL
  SELECT id, 'python', 'def solve():\n    pass' FROM ch_44
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Dynamic Programming', 5 FROM ch_44;

