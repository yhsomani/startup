-- Seeds: Initial Challenges (5 Algorithms)

-- 1. Insert "Two Sum"
WITH two_sum AS (
  INSERT INTO challenges (title, slug, difficulty, description, category, time_limit_ms, memory_limit_mb)
  VALUES (
    'Two Sum',
    'two-sum',
    'easy',
    E'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have *exactly* one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    'Arrays',
    5000,
    256
  )
  RETURNING id
),
two_sum_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"nums": [2,7,11,15], "target": 9}', '[0, 1]', 1 FROM two_sum UNION ALL
  SELECT id, '{"nums": [3,2,4], "target": 6}', '[1, 2]', 2 FROM two_sum UNION ALL
  SELECT id, '{"nums": [3,3], "target": 6}', '[0, 1]', 3 FROM two_sum
),
two_sum_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', E'/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n  \n}' FROM two_sum UNION ALL
  SELECT id, 'python', E'def two_sum(nums, target):\n    pass' FROM two_sum
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Arrays', 2 FROM two_sum UNION ALL
SELECT id, 'Hash Tables', 2 FROM two_sum;

-- 2. Insert "Reverse String"
WITH reverse_string AS (
  INSERT INTO challenges (title, slug, difficulty, description, category)
  VALUES (
    'Reverse String',
    'reverse-string',
    'easy',
    E'Write a function that reverses a string. The input string is given as an array of characters `s`.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.',
    'Strings'
  )
  RETURNING id
),
reverse_string_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"s": ["h","e","l","l","o"]}', '["o","l","l","e","h"]', 1 FROM reverse_string UNION ALL
  SELECT id, '{"s": ["H","a","n","n","a","h"]}', '["h","a","n","n","a","H"]', 2 FROM reverse_string
),
reverse_string_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', E'/**\n * @param {character[]} s\n * @return {void} Do not return anything, modify s in-place instead.\n */\nfunction reverseString(s) {\n  \n}' FROM reverse_string UNION ALL
  SELECT id, 'python', E'def reverse_string(s):\n    """\n    Do not return anything, modify s in-place instead.\n    """\n    pass' FROM reverse_string
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Strings', 1 FROM reverse_string;

-- 3. Insert "Valid Palindrome"
WITH valid_palindrome AS (
  INSERT INTO challenges (title, slug, difficulty, description, category)
  VALUES (
    'Valid Palindrome',
    'valid-palindrome',
    'easy',
    E'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.\n\nGiven a string `s`, return `true` if it is a palindrome, or `false` otherwise.',
    'Strings'
  )
  RETURNING id
),
valid_palindrome_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"s": "A man, a plan, a canal: Panama"}', 'true', 1 FROM valid_palindrome UNION ALL
  SELECT id, '{"s": "race a car"}', 'false', 2 FROM valid_palindrome UNION ALL
  SELECT id, '{"s": " "}', 'true', 3 FROM valid_palindrome
),
valid_palindrome_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', E'/**\n * @param {string} s\n * @return {boolean}\n */\nfunction isPalindrome(s) {\n  \n}' FROM valid_palindrome UNION ALL
  SELECT id, 'python', E'def is_palindrome(s):\n    pass' FROM valid_palindrome
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Strings', 2 FROM valid_palindrome;

-- 4. Insert "Maximum Subarray"
WITH max_subarray AS (
  INSERT INTO challenges (title, slug, difficulty, description, category)
  VALUES (
    'Maximum Subarray',
    'maximum-subarray',
    'medium',
    E'Given an integer array `nums`, find the subarray with the largest sum, and return its sum.',
    'Arrays'
  )
  RETURNING id
),
max_subarray_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"nums": [-2,1,-3,4,-1,2,1,-5,4]}', '6', 1 FROM max_subarray UNION ALL
  SELECT id, '{"nums": [1]}', '1', 2 FROM max_subarray UNION ALL
  SELECT id, '{"nums": [5,4,-1,7,8]}', '23', 3 FROM max_subarray
),
max_subarray_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', E'/**\n * @param {number[]} nums\n * @return {number}\n */\nfunction maxSubArray(nums) {\n  \n}' FROM max_subarray UNION ALL
  SELECT id, 'python', E'def max_sub_array(nums):\n    pass' FROM max_subarray
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Arrays', 3 FROM max_subarray UNION ALL
SELECT id, 'Dynamic Programming', 2 FROM max_subarray;

-- 5. Insert "Valid Parentheses"
WITH valid_parentheses AS (
  INSERT INTO challenges (title, slug, difficulty, description, category)
  VALUES (
    'Valid Parentheses',
    'valid-parentheses',
    'easy',
    E'Given a string `s` containing just the characters `''('', '')'', ''{'', ''}'', ''['' and '']''`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
    'Stacks'
  )
  RETURNING id
),
valid_parentheses_tests AS (
  INSERT INTO challenge_test_cases (challenge_id, input_data, expected_output, sort_order)
  SELECT id, '{"s": "()"}', 'true', 1 FROM valid_parentheses UNION ALL
  SELECT id, '{"s": "()[]{}"}', 'true', 2 FROM valid_parentheses UNION ALL
  SELECT id, '{"s": "(]"}', 'false', 3 FROM valid_parentheses
),
valid_parentheses_templates AS (
  INSERT INTO challenge_templates (challenge_id, language, starter_code)
  SELECT id, 'javascript', E'/**\n * @param {string} s\n * @return {boolean}\n */\nfunction isValid(s) {\n  \n}' FROM valid_parentheses UNION ALL
  SELECT id, 'python', E'def is_valid(s):\n    pass' FROM valid_parentheses
)
INSERT INTO challenge_skills (challenge_id, skill_name, points)
SELECT id, 'Stacks', 2 FROM valid_parentheses UNION ALL
SELECT id, 'Strings', 1 FROM valid_parentheses;
