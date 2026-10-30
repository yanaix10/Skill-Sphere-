export interface DsaSprintQuestionData {
  id: string;
  title: string;
  statement: string;
  tags: string[];
  refLines: number;
  estMinutes: number;
  challengeCategory: 'dsa';
  subCategory: 'algo' | 'bugfix';
  difficultyLevel: 1 | 2 | 3;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  source: string;
  executionEngine: 'judge0';
  variants: {
    python: { starterCode: string; harness: string; example: string };
    cpp: { starterCode: string; harness: string; example: string };
    javascript: { starterCode: string; harness: string; example: string };
    java: { starterCode: string; harness: string; example: string };
  };
}

export const freshDsaSprintQuestions: DsaSprintQuestionData[] = [
  {
    id: 'dsa_sprint_1',
    title: 'Two Sum Target',
    statement: 'Given an array of integers nums and an integer target, return true if any two distinct elements add up to target, or false otherwise.',
    tags: ['algorithms', 'arrays', 'hashmap'],
    refLines: 6,
    estMinutes: 2,
    challengeCategory: 'dsa',
    subCategory: 'algo',
    difficultyLevel: 1,
    difficulty: 'EASY',
    source: 'mbpp',
    executionEngine: 'judge0',
    variants: {
      python: {
        starterCode: 'def two_sum(nums, target):\n    # Return True if two numbers sum to target, else False\n    pass\n',
        harness: 'assert two_sum([2, 7, 11, 15], 9) == True\nassert two_sum([3, 2, 4], 6) == True\nassert two_sum([3, 3], 6) == True\nassert two_sum([1, 2, 3], 7) == False\n',
        example: 'assert two_sum([2, 7, 11, 15], 9) == True'
      },
      cpp: {
        starterCode: '#include <iostream>\n#include <vector>\n#include <unordered_set>\n#include <cassert>\n\nbool two_sum(std::vector<int> nums, int target) {\n    // Return true if two numbers sum to target, else false\n    return false;\n}\n',
        harness: 'int main() {\n    assert(two_sum({2, 7, 11, 15}, 9) == true);\n    assert(two_sum({3, 2, 4}, 6) == true);\n    assert(two_sum({3, 3}, 6) == true);\n    assert(two_sum({1, 2, 3}, 7) == false);\n    return 0;\n}\n',
        example: 'assert(two_sum({2, 7, 11, 15}, 9) == true);'
      },
      javascript: {
        starterCode: 'function twoSum(nums, target) {\n  // Return true if two numbers sum to target, else false\n  return false;\n}\n',
        harness: 'const assert = require("assert");\nassert.strictEqual(twoSum([2, 7, 11, 15], 9), true);\nassert.strictEqual(twoSum([3, 2, 4], 6), true);\nassert.strictEqual(twoSum([3, 3], 6), true);\nassert.strictEqual(twoSum([1, 2, 3], 7), false);\nconsole.log("Passed");\n',
        example: 'assert.strictEqual(twoSum([2, 7, 11, 15], 9), true);'
      },
      java: {
        starterCode: 'import java.util.*;\n\npublic class Solution {\n    public static boolean twoSum(int[] nums, int target) {\n        // Return true if two numbers sum to target, else false\n        return false;\n    }\n',
        harness: '    public static void main(String[] args) {\n        if (!twoSum(new int[]{2, 7, 11, 15}, 9)) throw new RuntimeException("Test 1 failed");\n        if (!twoSum(new int[]{3, 2, 4}, 6)) throw new RuntimeException("Test 2 failed");\n        if (!twoSum(new int[]{3, 3}, 6)) throw new RuntimeException("Test 3 failed");\n        if (twoSum(new int[]{1, 2, 3}, 7)) throw new RuntimeException("Test 4 failed");\n        System.out.println("Passed");\n    }\n}\n',
        example: 'if (!twoSum(new int[]{2, 7, 11, 15}, 9)) throw new RuntimeException("Test 1 failed");'
      }
    }
  },
  {
    id: 'dsa_sprint_2',
    title: 'Valid Palindrome',
    statement: 'Given a string s, return true if it is a palindrome, considering only alphanumeric characters and ignoring cases, or false otherwise.',
    tags: ['algorithms', 'strings', 'two-pointers'],
    refLines: 6,
    estMinutes: 2,
    challengeCategory: 'dsa',
    subCategory: 'algo',
    difficultyLevel: 1,
    difficulty: 'EASY',
    source: 'mbpp',
    executionEngine: 'judge0',
    variants: {
      python: {
        starterCode: 'def is_palindrome(s: str) -> bool:\n    # Check if string is palindrome ignoring non-alphanumeric and case\n    pass\n',
        harness: 'assert is_palindrome("A man, a plan, a canal: Panama") == True\nassert is_palindrome("race a car") == False\nassert is_palindrome(" ") == True\nassert is_palindrome("0P") == False\n',
        example: 'assert is_palindrome("A man, a plan, a canal: Panama") == True'
      },
      cpp: {
        starterCode: '#include <iostream>\n#include <string>\n#include <cctype>\n#include <cassert>\n\nbool is_palindrome(std::string s) {\n    // Check if string is palindrome ignoring non-alphanumeric and case\n    return false;\n}\n',
        harness: 'int main() {\n    assert(is_palindrome("A man, a plan, a canal: Panama") == true);\n    assert(is_palindrome("race a car") == false);\n    assert(is_palindrome(" ") == true);\n    assert(is_palindrome("0P") == false);\n    return 0;\n}\n',
        example: 'assert(is_palindrome("A man, a plan, a canal: Panama") == true);'
      },
      javascript: {
        starterCode: 'function isPalindrome(s) {\n  // Check if string is palindrome ignoring non-alphanumeric and case\n  return false;\n}\n',
        harness: 'const assert = require("assert");\nassert.strictEqual(isPalindrome("A man, a plan, a canal: Panama"), true);\nassert.strictEqual(isPalindrome("race a car"), false);\nassert.strictEqual(isPalindrome(" "), true);\nassert.strictEqual(isPalindrome("0P"), false);\nconsole.log("Passed");\n',
        example: 'assert.strictEqual(isPalindrome("A man, a plan, a canal: Panama"), true);'
      },
      java: {
        starterCode: 'import java.util.*;\n\npublic class Solution {\n    public static boolean isPalindrome(String s) {\n        // Check if string is palindrome ignoring non-alphanumeric and case\n        return false;\n    }\n',
        harness: '    public static void main(String[] args) {\n        if (!isPalindrome("A man, a plan, a canal: Panama")) throw new RuntimeException("Test 1 failed");\n        if (isPalindrome("race a car")) throw new RuntimeException("Test 2 failed");\n        if (!isPalindrome(" ")) throw new RuntimeException("Test 3 failed");\n        if (isPalindrome("0P")) throw new RuntimeException("Test 4 failed");\n        System.out.println("Passed");\n    }\n}\n',
        example: 'if (!isPalindrome("A man, a plan, a canal: Panama")) throw new RuntimeException("Test 1 failed");'
      }
    }
  },
  {
    id: 'dsa_sprint_3',
    title: 'Bug Fix: Off-By-One Binary Search',
    statement: 'The following binary search code fails to check the rightmost element or terminates early due to an off-by-one boundary bug. Fix the bug so it returns the 0-based index of target, or -1 if not found.',
    tags: ['bugfix', 'binary-search', 'arrays'],
    refLines: 8,
    estMinutes: 2,
    challengeCategory: 'dsa',
    subCategory: 'bugfix',
    difficultyLevel: 1,
    difficulty: 'EASY',
    source: 'debugbench',
    executionEngine: 'judge0',
    variants: {
      python: {
        starterCode: 'def binary_search(nums, target):\n    low = 0\n    high = len(nums) - 2 # BUG: off-by-one\n    while low < high:     # BUG: should be low <= high\n        mid = (low + high) // 2\n        if nums[mid] == target:\n            return mid\n        elif nums[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1\n',
        harness: 'assert binary_search([1, 3, 5, 7, 9], 1) == 0\nassert binary_search([1, 3, 5, 7, 9], 9) == 4\nassert binary_search([1, 3, 5, 7, 9], 5) == 2\nassert binary_search([1, 3, 5, 7, 9], 6) == -1\n',
        example: 'assert binary_search([1, 3, 5, 7, 9], 9) == 4'
      },
      cpp: {
        starterCode: '#include <iostream>\n#include <vector>\n#include <cassert>\n\nint binary_search(std::vector<int> nums, int target) {\n    int low = 0;\n    int high = (int)nums.size() - 2; // BUG: off-by-one\n    while (low < high) {             // BUG: should be low <= high\n        int mid = low + (high - low) / 2;\n        if (nums[mid] == target) return mid;\n        else if (nums[mid] < target) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;\n}\n',
        harness: 'int main() {\n    assert(binary_search({1, 3, 5, 7, 9}, 1) == 0);\n    assert(binary_search({1, 3, 5, 7, 9}, 9) == 4);\n    assert(binary_search({1, 3, 5, 7, 9}, 5) == 2);\n    assert(binary_search({1, 3, 5, 7, 9}, 6) == -1);\n    return 0;\n}\n',
        example: 'assert(binary_search({1, 3, 5, 7, 9}, 9) == 4);'
      },
      javascript: {
        starterCode: 'function binarySearch(nums, target) {\n  let low = 0;\n  let high = nums.length - 2; // BUG: off-by-one\n  while (low < high) {        // BUG: should be low <= high\n    const mid = Math.floor((low + high) / 2);\n    if (nums[mid] === target) return mid;\n    else if (nums[mid] < target) low = mid + 1;\n    else high = mid - 1;\n  }\n  return -1;\n}\n',
        harness: 'const assert = require("assert");\nassert.strictEqual(binarySearch([1, 3, 5, 7, 9], 1), 0);\nassert.strictEqual(binarySearch([1, 3, 5, 7, 9], 9), 4);\nassert.strictEqual(binarySearch([1, 3, 5, 7, 9], 5), 2);\nassert.strictEqual(binarySearch([1, 3, 5, 7, 9], 6), -1);\nconsole.log("Passed");\n',
        example: 'assert.strictEqual(binarySearch([1, 3, 5, 7, 9], 9), 4);'
      },
      java: {
        starterCode: 'public class Solution {\n    public static int binarySearch(int[] nums, int target) {\n        int low = 0;\n        int high = nums.length - 2; // BUG: off-by-one\n        while (low < high) {        // BUG: should be low <= high\n            int mid = low + (high - low) / 2;\n            if (nums[mid] == target) return mid;\n            else if (nums[mid] < target) low = mid + 1;\n            else high = mid - 1;\n        }\n        return -1;\n    }\n',
        harness: '    public static void main(String[] args) {\n        if (binarySearch(new int[]{1, 3, 5, 7, 9}, 1) != 0) throw new RuntimeException("Test 1 failed");\n        if (binarySearch(new int[]{1, 3, 5, 7, 9}, 9) != 4) throw new RuntimeException("Test 2 failed");\n        if (binarySearch(new int[]{1, 3, 5, 7, 9}, 5) != 2) throw new RuntimeException("Test 3 failed");\n        if (binarySearch(new int[]{1, 3, 5, 7, 9}, 6) != -1) throw new RuntimeException("Test 4 failed");\n        System.out.println("Passed");\n    }\n}\n',
        example: 'if (binarySearch(new int[]{1, 3, 5, 7, 9}, 9) != 4) throw new RuntimeException("Test 2 failed");'
      }
    }
  },
  {
    id: 'dsa_sprint_4',
    title: 'Find Missing Number',
    statement: 'Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array.',
    tags: ['algorithms', 'math', 'bit-manipulation'],
    refLines: 5,
    estMinutes: 2,
    challengeCategory: 'dsa',
    subCategory: 'algo',
    difficultyLevel: 1,
    difficulty: 'EASY',
    source: 'mbpp',
    executionEngine: 'judge0',
    variants: {
      python: {
        starterCode: 'def missing_number(nums):\n    # Return the missing number in range [0, n]\n    pass\n',
        harness: 'assert missing_number([3, 0, 1]) == 2\nassert missing_number([0, 1]) == 2\nassert missing_number([9, 6, 4, 2, 3, 5, 7, 0, 1]) == 8\nassert missing_number([0]) == 1\n',
        example: 'assert missing_number([3, 0, 1]) == 2'
      },
      cpp: {
        starterCode: '#include <iostream>\n#include <vector>\n#include <cassert>\n\nint missing_number(std::vector<int> nums) {\n    // Return the missing number in range [0, n]\n    return 0;\n}\n',
        harness: 'int main() {\n    assert(missing_number({3, 0, 1}) == 2);\n    assert(missing_number({0, 1}) == 2);\n    assert(missing_number({9, 6, 4, 2, 3, 5, 7, 0, 1}) == 8);\n    assert(missing_number({0}) == 1);\n    return 0;\n}\n',
        example: 'assert(missing_number({3, 0, 1}) == 2);'
      },
      javascript: {
        starterCode: 'function missingNumber(nums) {\n  // Return the missing number in range [0, n]\n  return 0;\n}\n',
        harness: 'const assert = require("assert");\nassert.strictEqual(missingNumber([3, 0, 1]), 2);\nassert.strictEqual(missingNumber([0, 1]), 2);\nassert.strictEqual(missingNumber([9, 6, 4, 2, 3, 5, 7, 0, 1]), 8);\nassert.strictEqual(missingNumber([0]), 1);\nconsole.log("Passed");\n',
        example: 'assert.strictEqual(missingNumber([3, 0, 1]), 2);'
      },
      java: {
        starterCode: 'public class Solution {\n    public static int missingNumber(int[] nums) {\n        // Return the missing number in range [0, n]\n        return 0;\n    }\n',
        harness: '    public static void main(String[] args) {\n        if (missingNumber(new int[]{3, 0, 1}) != 2) throw new RuntimeException("Test 1 failed");\n        if (missingNumber(new int[]{0, 1}) != 2) throw new RuntimeException("Test 2 failed");\n        if (missingNumber(new int[]{9, 6, 4, 2, 3, 5, 7, 0, 1}) != 8) throw new RuntimeException("Test 3 failed");\n        if (missingNumber(new int[]{0}) != 1) throw new RuntimeException("Test 4 failed");\n        System.out.println("Passed");\n    }\n}\n',
        example: 'if (missingNumber(new int[]{3, 0, 1}) != 2) throw new RuntimeException("Test 1 failed");'
      }
    }
  },
  {
    id: 'dsa_sprint_5',
    title: 'Valid Parentheses',
    statement: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. Open brackets must be closed by the same type of brackets in the correct order.",
    tags: ['algorithms', 'stack', 'strings'],
    refLines: 8,
    estMinutes: 2,
    challengeCategory: 'dsa',
    subCategory: 'algo',
    difficultyLevel: 2,
    difficulty: 'MEDIUM',
    source: 'mbpp',
    executionEngine: 'judge0',
    variants: {
      python: {
        starterCode: 'def is_valid_parentheses(s: str) -> bool:\n    # Return True if parentheses match validly, else False\n    pass\n',
        harness: 'assert is_valid_parentheses("()") == True\nassert is_valid_parentheses("()[]{}") == True\nassert is_valid_parentheses("(]") == False\nassert is_valid_parentheses("([)]") == False\nassert is_valid_parentheses("{[]}") == True\n',
        example: 'assert is_valid_parentheses("()[]{}") == True'
      },
      cpp: {
        starterCode: '#include <iostream>\n#include <string>\n#include <stack>\n#include <cassert>\n\nbool is_valid_parentheses(std::string s) {\n    // Return true if parentheses match validly, else false\n    return false;\n}\n',
        harness: 'int main() {\n    assert(is_valid_parentheses("()") == true);\n    assert(is_valid_parentheses("()[]{}") == true);\n    assert(is_valid_parentheses("(]") == false);\n    assert(is_valid_parentheses("([)]") == false);\n    assert(is_valid_parentheses("{[]}") == true);\n    return 0;\n}\n',
        example: 'assert(is_valid_parentheses("()[]{}") == true);'
      },
      javascript: {
        starterCode: 'function isValidParentheses(s) {\n  // Return true if parentheses match validly, else false\n  return false;\n}\n',
        harness: 'const assert = require("assert");\nassert.strictEqual(isValidParentheses("()"), true);\nassert.strictEqual(isValidParentheses("()[]{}"), true);\nassert.strictEqual(isValidParentheses("(]"), false);\nassert.strictEqual(isValidParentheses("([)]"), false);\nassert.strictEqual(isValidParentheses("{[]}"), true);\nconsole.log("Passed");\n',
        example: 'assert.strictEqual(isValidParentheses("()[]{}"), true);'
      },
      java: {
        starterCode: 'import java.util.*;\n\npublic class Solution {\n    public static boolean isValidParentheses(String s) {\n        // Return true if parentheses match validly, else false\n        return false;\n    }\n',
        harness: '    public static void main(String[] args) {\n        if (!isValidParentheses("()")) throw new RuntimeException("Test 1 failed");\n        if (!isValidParentheses("()[]{}")) throw new RuntimeException("Test 2 failed");\n        if (isValidParentheses("(]")) throw new RuntimeException("Test 3 failed");\n        if (isValidParentheses("([)]")) throw new RuntimeException("Test 4 failed");\n        if (!isValidParentheses("{[]}")) throw new RuntimeException("Test 5 failed");\n        System.out.println("Passed");\n    }\n}\n',
        example: 'if (!isValidParentheses("()[]{}")) throw new RuntimeException("Test 2 failed");'
      }
    }
  },
  {
    id: 'dsa_sprint_6',
    title: 'Maximum Subarray Sum',
    statement: "Given an integer array nums, find the contiguous subarray with the largest sum, and return its sum (Kadane's Algorithm).",
    tags: ['algorithms', 'arrays', 'dynamic-programming'],
    refLines: 7,
    estMinutes: 2,
    challengeCategory: 'dsa',
    subCategory: 'algo',
    difficultyLevel: 2,
    difficulty: 'MEDIUM',
    source: 'mbpp',
    executionEngine: 'judge0',
    variants: {
      python: {
        starterCode: 'def max_subarray(nums):\n    # Return maximum contiguous subarray sum\n    pass\n',
        harness: 'assert max_subarray([-2, 1, -3, 4, -1, 2, 1, -5, 4]) == 6\nassert max_subarray([1]) == 1\nassert max_subarray([5, 4, -1, 7, 8]) == 23\nassert max_subarray([-1, -2, -3]) == -1\n',
        example: 'assert max_subarray([-2, 1, -3, 4, -1, 2, 1, -5, 4]) == 6'
      },
      cpp: {
        starterCode: '#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <cassert>\n\nint max_subarray(std::vector<int> nums) {\n    // Return maximum contiguous subarray sum\n    return 0;\n}\n',
        harness: 'int main() {\n    assert(max_subarray({-2, 1, -3, 4, -1, 2, 1, -5, 4}) == 6);\n    assert(max_subarray({1}) == 1);\n    assert(max_subarray({5, 4, -1, 7, 8}) == 23);\n    assert(max_subarray({-1, -2, -3}) == -1);\n    return 0;\n}\n',
        example: 'assert(max_subarray({-2, 1, -3, 4, -1, 2, 1, -5, 4}) == 6);'
      },
      javascript: {
        starterCode: 'function maxSubarray(nums) {\n  // Return maximum contiguous subarray sum\n  return 0;\n}\n',
        harness: 'const assert = require("assert");\nassert.strictEqual(maxSubarray([-2, 1, -3, 4, -1, 2, 1, -5, 4]), 6);\nassert.strictEqual(maxSubarray([1]), 1);\nassert.strictEqual(maxSubarray([5, 4, -1, 7, 8]), 23);\nassert.strictEqual(maxSubarray([-1, -2, -3]), -1);\nconsole.log("Passed");\n',
        example: 'assert.strictEqual(maxSubarray([-2, 1, -3, 4, -1, 2, 1, -5, 4]), 6);'
      },
      java: {
        starterCode: 'public class Solution {\n    public static int maxSubarray(int[] nums) {\n        // Return maximum contiguous subarray sum\n        return 0;\n    }\n',
        harness: '    public static void main(String[] args) {\n        if (maxSubarray(new int[]{-2, 1, -3, 4, -1, 2, 1, -5, 4}) != 6) throw new RuntimeException("Test 1 failed");\n        if (maxSubarray(new int[]{1}) != 1) throw new RuntimeException("Test 2 failed");\n        if (maxSubarray(new int[]{5, 4, -1, 7, 8}) != 23) throw new RuntimeException("Test 3 failed");\n        if (maxSubarray(new int[]{-1, -2, -3}) != -1) throw new RuntimeException("Test 4 failed");\n        System.out.println("Passed");\n    }\n}\n',
        example: 'if (maxSubarray(new int[]{-2, 1, -3, 4, -1, 2, 1, -5, 4}) != 6) throw new RuntimeException("Test 1 failed");'
      }
    }
  },
  {
    id: 'dsa_sprint_7',
    title: 'Single Number',
    statement: 'Given a non-empty array of integers nums, every element appears twice except for one. Find that single one.',
    tags: ['algorithms', 'bit-manipulation', 'arrays'],
    refLines: 5,
    estMinutes: 1,
    challengeCategory: 'dsa',
    subCategory: 'algo',
    difficultyLevel: 1,
    difficulty: 'EASY',
    source: 'mbpp',
    executionEngine: 'judge0',
    variants: {
      python: {
        starterCode: 'def single_number(nums):\n    # Return the single element that appears only once\n    pass\n',
        harness: 'assert single_number([2, 2, 1]) == 1\nassert single_number([4, 1, 2, 1, 2]) == 4\nassert single_number([1]) == 1\n',
        example: 'assert single_number([4, 1, 2, 1, 2]) == 4'
      },
      cpp: {
        starterCode: '#include <iostream>\n#include <vector>\n#include <cassert>\n\nint single_number(std::vector<int> nums) {\n    // Return the single element that appears only once\n    return 0;\n}\n',
        harness: 'int main() {\n    assert(single_number({2, 2, 1}) == 1);\n    assert(single_number({4, 1, 2, 1, 2}) == 4);\n    assert(single_number({1}) == 1);\n    return 0;\n}\n',
        example: 'assert(single_number({4, 1, 2, 1, 2}) == 4);'
      },
      javascript: {
        starterCode: 'function singleNumber(nums) {\n  // Return the single element that appears only once\n  return 0;\n}\n',
        harness: 'const assert = require("assert");\nassert.strictEqual(singleNumber([2, 2, 1]), 1);\nassert.strictEqual(singleNumber([4, 1, 2, 1, 2]), 4);\nassert.strictEqual(singleNumber([1]), 1);\nconsole.log("Passed");\n',
        example: 'assert.strictEqual(singleNumber([4, 1, 2, 1, 2]), 4);'
      },
      java: {
        starterCode: 'public class Solution {\n    public static int singleNumber(int[] nums) {\n        // Return the single element that appears only once\n        return 0;\n    }\n',
        harness: '    public static void main(String[] args) {\n        if (singleNumber(new int[]{2, 2, 1}) != 1) throw new RuntimeException("Test 1 failed");\n        if (singleNumber(new int[]{4, 1, 2, 1, 2}) != 4) throw new RuntimeException("Test 2 failed");\n        if (singleNumber(new int[]{1}) != 1) throw new RuntimeException("Test 3 failed");\n        System.out.println("Passed");\n    }\n}\n',
        example: 'if (singleNumber(new int[]{4, 1, 2, 1, 2}) != 4) throw new RuntimeException("Test 2 failed");'
      }
    }
  },
  {
    id: 'dsa_sprint_8',
    title: 'Bug Fix: Fibonacci Base Case',
    statement: 'The following Fibonacci implementation has a bug with base cases (returns incorrect values for n <= 1 or negative index). Fix the function so fibonacci(0) == 0, fibonacci(1) == 1, fibonacci(2) == 1, etc.',
    tags: ['bugfix', 'recursion', 'math'],
    refLines: 6,
    estMinutes: 1,
    challengeCategory: 'dsa',
    subCategory: 'bugfix',
    difficultyLevel: 1,
    difficulty: 'EASY',
    source: 'debugbench',
    executionEngine: 'judge0',
    variants: {
      python: {
        starterCode: 'def fibonacci(n):\n    # BUG: base case returns 1 for 0\n    if n <= 0:\n        return 1\n    if n == 1:\n        return 1\n    return fibonacci(n - 1) + fibonacci(n - 2)\n',
        harness: 'assert fibonacci(0) == 0\nassert fibonacci(1) == 1\nassert fibonacci(2) == 1\nassert fibonacci(6) == 8\nassert fibonacci(10) == 55\n',
        example: 'assert fibonacci(6) == 8'
      },
      cpp: {
        starterCode: '#include <iostream>\n#include <cassert>\n\nint fibonacci(int n) {\n    // BUG: base case returns 1 for 0\n    if (n <= 0) return 1;\n    if (n == 1) return 1;\n    return fibonacci(n - 1) + fibonacci(n - 2);\n}\n',
        harness: 'int main() {\n    assert(fibonacci(0) == 0);\n    assert(fibonacci(1) == 1);\n    assert(fibonacci(2) == 1);\n    assert(fibonacci(6) == 8);\n    assert(fibonacci(10) == 55);\n    return 0;\n}\n',
        example: 'assert(fibonacci(6) == 8);'
      },
      javascript: {
        starterCode: 'function fibonacci(n) {\n  // BUG: base case returns 1 for 0\n  if (n <= 0) return 1;\n  if (n == 1) return 1;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n',
        harness: 'const assert = require("assert");\nassert.strictEqual(fibonacci(0), 0);\nassert.strictEqual(fibonacci(1), 1);\nassert.strictEqual(fibonacci(2), 1);\nassert.strictEqual(fibonacci(6), 8);\nassert.strictEqual(fibonacci(10), 55);\nconsole.log("Passed");\n',
        example: 'assert.strictEqual(fibonacci(6), 8);'
      },
      java: {
        starterCode: 'public class Solution {\n    public static int fibonacci(int n) {\n        // BUG: base case returns 1 for 0\n        if (n <= 0) return 1;\n        if (n == 1) return 1;\n        return fibonacci(n - 1) + fibonacci(n - 2);\n    }\n',
        harness: '    public static void main(String[] args) {\n        if (fibonacci(0) != 0) throw new RuntimeException("Test 0 failed");\n        if (fibonacci(1) != 1) throw new RuntimeException("Test 1 failed");\n        if (fibonacci(2) != 1) throw new RuntimeException("Test 2 failed");\n        if (fibonacci(6) != 8) throw new RuntimeException("Test 6 failed");\n        if (fibonacci(10) != 55) throw new RuntimeException("Test 10 failed");\n        System.out.println("Passed");\n    }\n}\n',
        example: 'if (fibonacci(6) != 8) throw new RuntimeException("Test 6 failed");'
      }
    }
  },
  {
    id: 'dsa_sprint_9',
    title: 'Merge Sorted Arrays',
    statement: 'Given two sorted integer arrays a and b, return a single new array containing all elements from both in non-decreasing sorted order.',
    tags: ['algorithms', 'arrays', 'two-pointers'],
    refLines: 8,
    estMinutes: 2,
    challengeCategory: 'dsa',
    subCategory: 'algo',
    difficultyLevel: 2,
    difficulty: 'MEDIUM',
    source: 'mbpp',
    executionEngine: 'judge0',
    variants: {
      python: {
        starterCode: 'def merge_sorted(a, b):\n    # Return merged sorted list\n    pass\n',
        harness: 'assert merge_sorted([1, 3, 5], [2, 4, 6]) == [1, 2, 3, 4, 5, 6]\nassert merge_sorted([], [1, 2]) == [1, 2]\nassert merge_sorted([5], [1]) == [1, 5]\n',
        example: 'assert merge_sorted([1, 3, 5], [2, 4, 6]) == [1, 2, 3, 4, 5, 6]'
      },
      cpp: {
        starterCode: '#include <iostream>\n#include <vector>\n#include <cassert>\n\nstd::vector<int> merge_sorted(std::vector<int> a, std::vector<int> b) {\n    // Return merged sorted vector\n    return {};\n}\n',
        harness: 'int main() {\n    assert(merge_sorted({1, 3, 5}, {2, 4, 6}) == std::vector<int>({1, 2, 3, 4, 5, 6}));\n    assert(merge_sorted({}, {1, 2}) == std::vector<int>({1, 2}));\n    assert(merge_sorted({5}, {1}) == std::vector<int>({1, 5}));\n    return 0;\n}\n',
        example: 'assert(merge_sorted({1, 3, 5}, {2, 4, 6}) == std::vector<int>({1, 2, 3, 4, 5, 6}));'
      },
      javascript: {
        starterCode: 'function mergeSorted(a, b) {\n  // Return merged sorted array\n  return [];\n}\n',
        harness: 'const assert = require("assert");\nassert.deepStrictEqual(mergeSorted([1, 3, 5], [2, 4, 6]), [1, 2, 3, 4, 5, 6]);\nassert.deepStrictEqual(mergeSorted([], [1, 2]), [1, 2]);\nassert.deepStrictEqual(mergeSorted([5], [1]), [1, 5]);\nconsole.log("Passed");\n',
        example: 'assert.deepStrictEqual(mergeSorted([1, 3, 5], [2, 4, 6]), [1, 2, 3, 4, 5, 6]);'
      },
      java: {
        starterCode: 'import java.util.*;\n\npublic class Solution {\n    public static int[] mergeSorted(int[] a, int[] b) {\n        // Return merged sorted array\n        return new int[0];\n    }\n',
        harness: '    public static void main(String[] args) {\n        if (!Arrays.equals(mergeSorted(new int[]{1, 3, 5}, new int[]{2, 4, 6}), new int[]{1, 2, 3, 4, 5, 6})) throw new RuntimeException("Test 1 failed");\n        if (!Arrays.equals(mergeSorted(new int[]{}, new int[]{1, 2}), new int[]{1, 2})) throw new RuntimeException("Test 2 failed");\n        if (!Arrays.equals(mergeSorted(new int[]{5}, new int[]{1}), new int[]{1, 5})) throw new RuntimeException("Test 3 failed");\n        System.out.println("Passed");\n    }\n}\n',
        example: 'if (!Arrays.equals(mergeSorted(new int[]{1, 3, 5}, new int[]{2, 4, 6}), new int[]{1, 2, 3, 4, 5, 6})) throw new RuntimeException("Test 1 failed");'
      }
    }
  },
  {
    id: 'dsa_sprint_10',
    title: 'Count Vowels',
    statement: 'Write a function that counts and returns the number of vowels (a, e, i, o, u, case-insensitive) in a given string s.',
    tags: ['algorithms', 'strings'],
    refLines: 5,
    estMinutes: 1,
    challengeCategory: 'dsa',
    subCategory: 'algo',
    difficultyLevel: 1,
    difficulty: 'EASY',
    source: 'mbpp',
    executionEngine: 'judge0',
    variants: {
      python: {
        starterCode: 'def count_vowels(s: str) -> int:\n    # Return count of vowels in s\n    pass\n',
        harness: 'assert count_vowels("hello") == 2\nassert count_vowels("SkillSphere") == 3\nassert count_vowels("rhythm") == 0\nassert count_vowels("AEIOU") == 5\n',
        example: 'assert count_vowels("SkillSphere") == 3'
      },
      cpp: {
        starterCode: '#include <iostream>\n#include <string>\n#include <cassert>\n\nint count_vowels(std::string s) {\n    // Return count of vowels in s\n    return 0;\n}\n',
        harness: 'int main() {\n    assert(count_vowels("hello") == 2);\n    assert(count_vowels("SkillSphere") == 3);\n    assert(count_vowels("rhythm") == 0);\n    assert(count_vowels("AEIOU") == 5);\n    return 0;\n}\n',
        example: 'assert(count_vowels("SkillSphere") == 3);'
      },
      javascript: {
        starterCode: 'function countVowels(s) {\n  // Return count of vowels in s\n  return 0;\n}\n',
        harness: 'const assert = require("assert");\nassert.strictEqual(countVowels("hello"), 2);\nassert.strictEqual(countVowels("SkillSphere"), 3);\nassert.strictEqual(countVowels("rhythm"), 0);\nassert.strictEqual(countVowels("AEIOU"), 5);\nconsole.log("Passed");\n',
        example: 'assert.strictEqual(countVowels("SkillSphere"), 3);'
      },
      java: {
        starterCode: 'public class Solution {\n    public static int countVowels(String s) {\n        // Return count of vowels in s\n        return 0;\n    }\n',
        harness: '    public static void main(String[] args) {\n        if (countVowels("hello") != 2) throw new RuntimeException("Test 1 failed");\n        if (countVowels("SkillSphere") != 3) throw new RuntimeException("Test 2 failed");\n        if (countVowels("rhythm") != 0) throw new RuntimeException("Test 3 failed");\n        if (countVowels("AEIOU") != 5) throw new RuntimeException("Test 4 failed");\n        System.out.println("Passed");\n    }\n}\n',
        example: 'if (countVowels("SkillSphere") != 3) throw new RuntimeException("Test 2 failed");'
      }
    }
  },
  {
    id: 'dsa_sprint_11',
    title: 'Contains Duplicate',
    statement: 'Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.',
    tags: ['algorithms', 'arrays', 'hashset'],
    refLines: 5,
    estMinutes: 1,
    challengeCategory: 'dsa',
    subCategory: 'algo',
    difficultyLevel: 1,
    difficulty: 'EASY',
    source: 'mbpp',
    executionEngine: 'judge0',
    variants: {
      python: {
        starterCode: 'def contains_duplicate(nums):\n    # Return True if any duplicate exists, else False\n    pass\n',
        harness: 'assert contains_duplicate([1, 2, 3, 1]) == True\nassert contains_duplicate([1, 2, 3, 4]) == False\nassert contains_duplicate([1, 1, 1, 3, 3, 4, 3, 2, 4, 2]) == True\n',
        example: 'assert contains_duplicate([1, 2, 3, 1]) == True'
      },
      cpp: {
        starterCode: '#include <iostream>\n#include <vector>\n#include <unordered_set>\n#include <cassert>\n\nbool contains_duplicate(std::vector<int> nums) {\n    // Return true if any duplicate exists, else false\n    return false;\n}\n',
        harness: 'int main() {\n    assert(contains_duplicate({1, 2, 3, 1}) == true);\n    assert(contains_duplicate({1, 2, 3, 4}) == false);\n    assert(contains_duplicate({1, 1, 1, 3, 3, 4, 3, 2, 4, 2}) == true);\n    return 0;\n}\n',
        example: 'assert(contains_duplicate({1, 2, 3, 1}) == true);'
      },
      javascript: {
        starterCode: 'function containsDuplicate(nums) {\n  // Return true if any duplicate exists, else false\n  return false;\n}\n',
        harness: 'const assert = require("assert");\nassert.strictEqual(containsDuplicate([1, 2, 3, 1]), true);\nassert.strictEqual(containsDuplicate([1, 2, 3, 4]), false);\nassert.strictEqual(containsDuplicate([1, 1, 1, 3, 3, 4, 3, 2, 4, 2]), true);\nconsole.log("Passed");\n',
        example: 'assert.strictEqual(containsDuplicate([1, 2, 3, 1]), true);'
      },
      java: {
        starterCode: 'import java.util.*;\n\npublic class Solution {\n    public static boolean containsDuplicate(int[] nums) {\n        // Return true if any duplicate exists, else false\n        return false;\n    }\n',
        harness: '    public static void main(String[] args) {\n        if (!containsDuplicate(new int[]{1, 2, 3, 1})) throw new RuntimeException("Test 1 failed");\n        if (containsDuplicate(new int[]{1, 2, 3, 4})) throw new RuntimeException("Test 2 failed");\n        if (!containsDuplicate(new int[]{1, 1, 1, 3, 3, 4, 3, 2, 4, 2})) throw new RuntimeException("Test 3 failed");\n        System.out.println("Passed");\n    }\n}\n',
        example: 'if (!containsDuplicate(new int[]{1, 2, 3, 1})) throw new RuntimeException("Test 1 failed");'
      }
    }
  },
  {
    id: 'dsa_sprint_12',
    title: 'Reverse Words in String',
    statement: 'Given an input string s, reverse the order of the words. Words are separated by one or more spaces. Return a string of the words in reverse order concatenated by a single space, with leading and trailing spaces removed.',
    tags: ['algorithms', 'strings'],
    refLines: 5,
    estMinutes: 2,
    challengeCategory: 'dsa',
    subCategory: 'algo',
    difficultyLevel: 2,
    difficulty: 'MEDIUM',
    source: 'mbpp',
    executionEngine: 'judge0',
    variants: {
      python: {
        starterCode: 'def reverse_words(s: str) -> str:\n    # Reverse word order and join with single space\n    pass\n',
        harness: 'assert reverse_words("the sky is blue") == "blue is sky the"\nassert reverse_words("  hello world  ") == "world hello"\nassert reverse_words("a good   example") == "example good a"\n',
        example: 'assert reverse_words("the sky is blue") == "blue is sky the"'
      },
      cpp: {
        starterCode: '#include <iostream>\n#include <string>\n#include <sstream>\n#include <vector>\n#include <cassert>\n\nstd::string reverse_words(std::string s) {\n    // Reverse word order and join with single space\n    return "";\n}\n',
        harness: 'int main() {\n    assert(reverse_words("the sky is blue") == "blue is sky the");\n    assert(reverse_words("  hello world  ") == "world hello");\n    assert(reverse_words("a good   example") == "example good a");\n    return 0;\n}\n',
        example: 'assert(reverse_words("the sky is blue") == "blue is sky the");'
      },
      javascript: {
        starterCode: 'function reverseWords(s) {\n  // Reverse word order and join with single space\n  return "";\n}\n',
        harness: 'const assert = require("assert");\nassert.strictEqual(reverseWords("the sky is blue"), "blue is sky the");\nassert.strictEqual(reverseWords("  hello world  "), "world hello");\nassert.strictEqual(reverseWords("a good   example"), "example good a");\nconsole.log("Passed");\n',
        example: 'assert.strictEqual(reverseWords("the sky is blue"), "blue is sky the");'
      },
      java: {
        starterCode: 'import java.util.*;\n\npublic class Solution {\n    public static String reverseWords(String s) {\n        // Reverse word order and join with single space\n        return "";\n    }\n',
        harness: '    public static void main(String[] args) {\n        if (!reverseWords("the sky is blue").equals("blue is sky the")) throw new RuntimeException("Test 1 failed");\n        if (!reverseWords("  hello world  ").equals("world hello")) throw new RuntimeException("Test 2 failed");\n        if (!reverseWords("a good   example").equals("example good a")) throw new RuntimeException("Test 3 failed");\n        System.out.println("Passed");\n    }\n}\n',
        example: 'if (!reverseWords("the sky is blue").equals("blue is sky the")) throw new RuntimeException("Test 1 failed");'
      }
    }
  }
];
