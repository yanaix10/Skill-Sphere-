export interface QuestionVariant {
  starterCode: string;
  example: string;
}

export interface SandBoxQuestion {
  id: string;
  title: string;
  statement: string;
  tags: string[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  category: string;
  variants: {
    python?: QuestionVariant;
    cpp?: QuestionVariant;
    javascript?: QuestionVariant;
    java?: QuestionVariant;
  };
}

export const defaultQuestions: SandBoxQuestion[] = [
  {
    id: 'dsa_sprint_1',
    title: 'Two Sum Target',
    statement: 'Given an array of integers nums and an integer target, return true if any two distinct elements add up to target, or false otherwise.',
    tags: ['algorithms', 'arrays', 'hashmap'],
    difficulty: 'EASY',
    category: 'Algorithms',
    variants: {
      python: {
        starterCode: 'def two_sum(nums, target):\n    # Return True if two numbers sum to target, else False\n    pass\n',
        example: 'assert two_sum([2, 7, 11, 15], 9) == True'
      },
      cpp: {
        starterCode: '#include <iostream>\n#include <vector>\n#include <unordered_set>\n#include <cassert>\n\nbool two_sum(std::vector<int> nums, int target) {\n    // Return true if two numbers sum to target, else false\n    return false;\n}\n',
        example: 'assert(two_sum({2, 7, 11, 15}, 9) == true);'
      },
      javascript: {
        starterCode: 'function twoSum(nums, target) {\n  // Return true if two numbers sum to target, else false\n  return false;\n}\n',
        example: 'assert.strictEqual(twoSum([2, 7, 11, 15], 9), true);'
      },
      java: {
        starterCode: 'import java.util.*;\n\npublic class Solution {\n    public static boolean twoSum(int[] nums, int target) {\n        // Return true if two numbers sum to target, else false\n        return false;\n    }\n',
        example: 'if (!twoSum(new int[]{2, 7, 11, 15}, 9)) throw new RuntimeException("Test 1 failed");'
      }
    }
  },
  {
    id: 'dsa_sprint_2',
    title: 'Valid Palindrome',
    statement: 'Given a string s, return true if it is a palindrome, considering only alphanumeric characters and ignoring cases, or false otherwise.',
    tags: ['algorithms', 'strings', 'two-pointers'],
    difficulty: 'EASY',
    category: 'Strings',
    variants: {
      python: {
        starterCode: 'def is_palindrome(s: str) -> bool:\n    # Check if string is palindrome ignoring non-alphanumeric and case\n    pass\n',
        example: 'assert is_palindrome("A man, a plan, a canal: Panama") == True'
      },
      cpp: {
        starterCode: '#include <iostream>\n#include <string>\n#include <cctype>\n#include <cassert>\n\nbool is_palindrome(std::string s) {\n    // Check if string is palindrome ignoring non-alphanumeric and case\n    return false;\n}\n',
        example: 'assert(is_palindrome("A man, a plan, a canal: Panama") == true);'
      },
      javascript: {
        starterCode: 'function isPalindrome(s) {\n  // Check if string is palindrome ignoring non-alphanumeric and case\n  return false;\n}\n',
        example: 'assert.strictEqual(isPalindrome("A man, a plan, a canal: Panama"), true);'
      },
      java: {
        starterCode: 'import java.util.*;\n\npublic class Solution {\n    public static boolean isPalindrome(String s) {\n        // Check if string is palindrome ignoring non-alphanumeric and case\n        return false;\n    }\n',
        example: 'if (!isPalindrome("A man, a plan, a canal: Panama")) throw new RuntimeException("Test 1 failed");'
      }
    }
  },
  {
    id: 'dsa_sprint_3',
    title: 'Bug Fix: Off-By-One Binary Search',
    statement: 'The following binary search code fails to check the rightmost element or terminates early due to an off-by-one boundary bug. Fix the bug so it returns the 0-based index of target, or -1 if not found.',
    tags: ['bugfix', 'binary-search', 'arrays'],
    difficulty: 'EASY',
    category: 'Bug Fix',
    variants: {
      python: {
        starterCode: 'def binary_search(nums, target):\n    low = 0\n    high = len(nums) - 2 # BUG: off-by-one\n    while low < high:     # BUG: should be low <= high\n        mid = (low + high) // 2\n        if nums[mid] == target:\n            return mid\n        elif nums[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1\n',
        example: 'assert binary_search([1, 3, 5, 7, 9], 9) == 4'
      },
      cpp: {
        starterCode: '#include <iostream>\n#include <vector>\n#include <cassert>\n\nint binary_search(std::vector<int> nums, int target) {\n    int low = 0;\n    int high = (int)nums.size() - 2; // BUG: off-by-one\n    while (low < high) {             // BUG: should be low <= high\n        int mid = low + (high - low) / 2;\n        if (nums[mid] == target) return mid;\n        else if (nums[mid] < target) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;\n}\n',
        example: 'assert(binary_search({1, 3, 5, 7, 9}, 9) == 4);'
      },
      javascript: {
        starterCode: 'function binarySearch(nums, target) {\n  let low = 0;\n  let high = nums.length - 2; // BUG: off-by-one\n  while (low < high) {        // BUG: should be low <= high\n    const mid = Math.floor((low + high) / 2);\n    if (nums[mid] === target) return mid;\n    else if (nums[mid] < target) low = mid + 1;\n    else high = mid - 1;\n  }\n  return -1;\n}\n',
        example: 'assert.strictEqual(binarySearch([1, 3, 5, 7, 9], 9), 4);'
      },
      java: {
        starterCode: 'public class Solution {\n    public static int binarySearch(int[] nums, int target) {\n        int low = 0;\n        int high = nums.length - 2; // BUG: off-by-one\n        while (low < high) {        // BUG: should be low <= high\n            int mid = low + (high - low) / 2;\n            if (nums[mid] == target) return mid;\n            else if (nums[mid] < target) low = mid + 1;\n            else high = mid - 1;\n        }\n        return -1;\n    }\n',
        example: 'if (binarySearch(new int[]{1, 3, 5, 7, 9}, 9) != 4) throw new RuntimeException("Test 2 failed");'
      }
    }
  },
  {
    id: 'dsa_sprint_4',
    title: 'Find Missing Number',
    statement: 'Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array.',
    tags: ['algorithms', 'math', 'bit-manipulation'],
    difficulty: 'EASY',
    category: 'Algorithms',
    variants: {
      python: {
        starterCode: 'def missing_number(nums):\n    # Return the single missing integer in range [0, n]\n    pass\n',
        example: 'assert missing_number([3, 0, 1]) == 2'
      },
      cpp: {
        starterCode: '#include <iostream>\n#include <vector>\n#include <numeric>\n#include <cassert>\n\nint missing_number(std::vector<int> nums) {\n    // Return the single missing integer in range [0, n]\n    return 0;\n}\n',
        example: 'assert(missing_number({3, 0, 1}) == 2);'
      },
      javascript: {
        starterCode: 'function missingNumber(nums) {\n  // Return the single missing integer in range [0, n]\n  return 0;\n}\n',
        example: 'assert.strictEqual(missingNumber([3, 0, 1]), 2);'
      },
      java: {
        starterCode: 'public class Solution {\n    public static int missingNumber(int[] nums) {\n        // Return the single missing integer in range [0, n]\n        return 0;\n    }\n',
        example: 'if (missingNumber(new int[]{3, 0, 1}) != 2) throw new RuntimeException("Test 1 failed");'
      }
    }
  },
  {
    id: 'dsa_sprint_5',
    title: 'Maximum Subarray Sum',
    statement: 'Given an integer array nums, find the subarray with the largest sum, and return its sum (Kadane algorithm).',
    tags: ['algorithms', 'dynamic-programming', 'arrays'],
    difficulty: 'MEDIUM',
    category: 'Dynamic Programming',
    variants: {
      python: {
        starterCode: 'def max_sub_array(nums):\n    # Return the maximum subarray sum using Kadane algorithm\n    pass\n',
        example: 'assert max_sub_array([-2, 1, -3, 4, -1, 2, 1, -5, 4]) == 6'
      },
      cpp: {
        starterCode: '#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <cassert>\n\nint max_sub_array(std::vector<int> nums) {\n    // Return the maximum subarray sum using Kadane algorithm\n    return 0;\n}\n',
        example: 'assert(max_sub_array({-2, 1, -3, 4, -1, 2, 1, -5, 4}) == 6);'
      },
      javascript: {
        starterCode: 'function maxSubArray(nums) {\n  // Return the maximum subarray sum using Kadane algorithm\n  return 0;\n}\n',
        example: 'assert.strictEqual(maxSubArray([-2, 1, -3, 4, -1, 2, 1, -5, 4]), 6);'
      },
      java: {
        starterCode: 'public class Solution {\n    public static int maxSubArray(int[] nums) {\n        // Return the maximum subarray sum using Kadane algorithm\n        return 0;\n    }\n',
        example: 'if (maxSubArray(new int[]{-2, 1, -3, 4, -1, 2, 1, -5, 4}) != 6) throw new RuntimeException("Test 1 failed");'
      }
    }
  }
];
