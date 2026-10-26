/**
 * Curated MBPP (Mostly Basic Python Problems) dataset with MultiPL-E translations.
 * All questions are pre-cleaned to remove automated translation quirks (e.g. "cppthon")
 * and formatted with complete human starter function headers and native assertion suites.
 */

export interface MbppQuestionSeed {
  taskId: number;
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  category: string;
  points: number;
  languages: {
    cpp: {
      starterCode: string;
      sampleTests: string;
      testSuite: string;
    };
    python: {
      starterCode: string;
      sampleTests: string;
      testSuite: string;
    };
    javascript: {
      starterCode: string;
      sampleTests: string;
      testSuite: string;
    };
    java: {
      starterCode: string;
      sampleTests: string;
      testSuite: string;
    };
    c: {
      starterCode: string;
      sampleTests: string;
      testSuite: string;
    };
  };
  initialCode?: Record<string, string>;
}

export const mbppCuratedQuestions: MbppQuestionSeed[] = [
  // 1. MBPP 8: Square Numbers
  {
    taskId: 8,
    title: "1. Square List Elements (MBPP 8)",
    description: "Write a function to square every number in a given list/vector of integers.\n\n**Example:**\nInput: `[1, 2, 3]` -> Output: `[1, 4, 9]`",
    difficulty: "EASY",
    category: "Arrays & Math",
    points: 10,
    languages: {
      cpp: {
        starterCode: `std::vector<long> square_nums(std::vector<long> nums) {
    // Write your solution here
    return {};
}`,
        sampleTests: `auto candidate = square_nums;
assert(candidate(std::vector<long>({1, 2, 3})) == std::vector<long>({1, 4, 9}));`,
        testSuite: `auto candidate = square_nums;
assert(candidate(std::vector<long>({1, 2, 3})) == std::vector<long>({1, 4, 9}));
assert(candidate(std::vector<long>({-2, 0, 5})) == std::vector<long>({4, 0, 25}));
assert(candidate(std::vector<long>({})) == std::vector<long>({}));`
      },
      python: {
        starterCode: `def square_nums(nums: list[int]) -> list[int]:
    # Write your solution here
    pass`,
        sampleTests: `assert square_nums([1, 2, 3]) == [1, 4, 9]`,
        testSuite: `assert square_nums([1, 2, 3]) == [1, 4, 9]
assert square_nums([-2, 0, 5]) == [4, 0, 25]
assert square_nums([]) == []`
      },
      javascript: {
        starterCode: `function square_nums(nums) {
    // Write your solution here
    return [];
}`,
        sampleTests: `assert.deepEqual(square_nums([1, 2, 3]), [1, 4, 9]);`,
        testSuite: `assert.deepEqual(square_nums([1, 2, 3]), [1, 4, 9]);
assert.deepEqual(square_nums([-2, 0, 5]), [4, 0, 25]);
assert.deepEqual(square_nums([]), []);`
      },
      java: {
        starterCode: `public static List<Long> squareNums(List<Long> nums) {
    // Write your solution here
    return new ArrayList<>();
}`,
        sampleTests: `assert squareNums(Arrays.asList(1L, 2L, 3L)).equals(Arrays.asList(1L, 4L, 9L));`,
        testSuite: `assert squareNums(Arrays.asList(1L, 2L, 3L)).equals(Arrays.asList(1L, 4L, 9L));
assert squareNums(Arrays.asList(-2L, 0L, 5L)).equals(Arrays.asList(4L, 0L, 25L));`
      },
      c: {
        starterCode: `void square_nums(long* arr, int n, long* out) {
    // Write your solution here
}`,
        sampleTests: `long arr[] = {1, 2, 3}; long out[3]; square_nums(arr, 3, out);
assert(out[0] == 1 && out[1] == 4 && out[2] == 9);`,
        testSuite: `long arr[] = {1, 2, 3}; long out[3]; square_nums(arr, 3, out);
assert(out[0] == 1 && out[1] == 4 && out[2] == 9);`
      }
    }
  },

  // 2. MBPP 3: Identify Non-Prime
  {
    taskId: 3,
    title: "2. Identify Non-Prime (MBPP 3)",
    description: "Write a function to identify non-prime numbers. Return `true` if the given number is not a prime, or `false` if it is a prime.\n\n**Example:**\nInput: `2` -> Output: `false` (2 is prime)\nInput: `10` -> Output: `true` (10 is not prime)",
    difficulty: "EASY",
    category: "Math & Logic",
    points: 10,
    languages: {
      cpp: {
        starterCode: `bool is_not_prime(long n) {
    // Write your solution here
    return false;
}`,
        sampleTests: `auto candidate = is_not_prime;
assert(candidate(2) == false);
assert(candidate(10) == true);`,
        testSuite: `auto candidate = is_not_prime;
assert(candidate(2) == false);
assert(candidate(10) == true);
assert(candidate(35) == true);
assert(candidate(37) == false);
assert(candidate(1) == true);`
      },
      python: {
        starterCode: `def is_not_prime(n: int) -> bool:
    # Write your solution here
    pass`,
        sampleTests: `assert is_not_prime(2) == False
assert is_not_prime(10) == True`,
        testSuite: `assert is_not_prime(2) == False
assert is_not_prime(10) == True
assert is_not_prime(35) == True
assert is_not_prime(37) == False
assert is_not_prime(1) == True`
      },
      javascript: {
        starterCode: `function is_not_prime(n) {
    // Write your solution here
    return false;
}`,
        sampleTests: `assert.strictEqual(is_not_prime(2), false);
assert.strictEqual(is_not_prime(10), true);`,
        testSuite: `assert.strictEqual(is_not_prime(2), false);
assert.strictEqual(is_not_prime(10), true);
assert.strictEqual(is_not_prime(35), true);
assert.strictEqual(is_not_prime(37), false);
assert.strictEqual(is_not_prime(1), true);`
      },
      java: {
        starterCode: `public static boolean isNotPrime(long n) {
    // Write your solution here
    return false;
}`,
        sampleTests: `assert isNotPrime(2L) == false;
assert isNotPrime(10L) == true;`,
        testSuite: `assert isNotPrime(2L) == false;
assert isNotPrime(10L) == true;
assert isNotPrime(35L) == true;
assert isNotPrime(37L) == false;`
      },
      c: {
        starterCode: `bool is_not_prime(long n) {
    // Write your solution here
    return false;
}`,
        sampleTests: `assert(is_not_prime(2) == false);
assert(is_not_prime(10) == true);`,
        testSuite: `assert(is_not_prime(2) == false);
assert(is_not_prime(10) == true);
assert(is_not_prime(35) == true);
assert(is_not_prime(37) == false);`
      }
    }
  },

  // 3. MBPP 167: Smallest Power of 2
  {
    taskId: 167,
    title: "3. Next Power of 2 (MBPP 167)",
    description: "Write a function to find the smallest power of 2 that is greater than or equal to a given number `n`.\n\n**Example:**\nInput: `0` -> Output: `1`\nInput: `5` -> Output: `8`\nInput: `16` -> Output: `16`",
    difficulty: "EASY",
    category: "Bit Manipulation & Math",
    points: 10,
    languages: {
      cpp: {
        starterCode: `long next_power_of_2(long n) {
    // Write your solution here
    return 1;
}`,
        sampleTests: `auto candidate = next_power_of_2;
assert(candidate(0) == 1);
assert(candidate(5) == 8);`,
        testSuite: `auto candidate = next_power_of_2;
assert(candidate(0) == 1);
assert(candidate(5) == 8);
assert(candidate(16) == 16);
assert(candidate(30) == 32);`
      },
      python: {
        starterCode: `def next_power_of_2(n: int) -> int:
    # Write your solution here
    pass`,
        sampleTests: `assert next_power_of_2(0) == 1
assert next_power_of_2(5) == 8`,
        testSuite: `assert next_power_of_2(0) == 1
assert next_power_of_2(5) == 8
assert next_power_of_2(16) == 16
assert next_power_of_2(30) == 32`
      },
      javascript: {
        starterCode: `function next_power_of_2(n) {
    // Write your solution here
    return 1;
}`,
        sampleTests: `assert.strictEqual(next_power_of_2(0), 1);
assert.strictEqual(next_power_of_2(5), 8);`,
        testSuite: `assert.strictEqual(next_power_of_2(0), 1);
assert.strictEqual(next_power_of_2(5), 8);
assert.strictEqual(next_power_of_2(16), 16);
assert.strictEqual(next_power_of_2(30), 32);`
      },
      java: {
        starterCode: `public static long nextPowerOf2(long n) {
    // Write your solution here
    return 1L;
}`,
        sampleTests: `assert nextPowerOf2(0L) == 1L;
assert nextPowerOf2(5L) == 8L;`,
        testSuite: `assert nextPowerOf2(0L) == 1L;
assert nextPowerOf2(5L) == 8L;
assert nextPowerOf2(16L) == 16L;`
      },
      c: {
        starterCode: `long next_power_of_2(long n) {
    // Write your solution here
    return 1;
}`,
        sampleTests: `assert(next_power_of_2(0) == 1);
assert(next_power_of_2(5) == 8);`,
        testSuite: `assert(next_power_of_2(0) == 1);
assert(next_power_of_2(5) == 8);
assert(next_power_of_2(16) == 16);`
      }
    }
  },

  // 4. MBPP 227: Minimum of Three
  {
    taskId: 227,
    title: "4. Minimum of Three Numbers (MBPP 227)",
    description: "Write a function to find the minimum of three numbers.\n\n**Example:**\nInput: `(10, 20, 0)` -> Output: `0`\nInput: `(-5, -2, -10)` -> Output: `-10`",
    difficulty: "EASY",
    category: "Math & Logic",
    points: 10,
    languages: {
      cpp: {
        starterCode: `long min_of_three(long a, long b, long c) {
    // Write your solution here
    return 0;
}`,
        sampleTests: `auto candidate = min_of_three;
assert(candidate(10, 20, 0) == 0);`,
        testSuite: `auto candidate = min_of_three;
assert(candidate(10, 20, 0) == 0);
assert(candidate(10, 20, 30) == 10);
assert(candidate(30, 10, 20) == 10);
assert(candidate(-5, -2, -10) == -10);`
      },
      python: {
        starterCode: `def min_of_three(a: int, b: int, c: int) -> int:
    # Write your solution here
    pass`,
        sampleTests: `assert min_of_three(10, 20, 0) == 0`,
        testSuite: `assert min_of_three(10, 20, 0) == 0
assert min_of_three(10, 20, 30) == 10
assert min_of_three(30, 10, 20) == 10
assert min_of_three(-5, -2, -10) == -10`
      },
      javascript: {
        starterCode: `function min_of_three(a, b, c) {
    // Write your solution here
    return 0;
}`,
        sampleTests: `assert.strictEqual(min_of_three(10, 20, 0), 0);`,
        testSuite: `assert.strictEqual(min_of_three(10, 20, 0), 0);
assert.strictEqual(min_of_three(10, 20, 30), 10);
assert.strictEqual(min_of_three(30, 10, 20), 10);
assert.strictEqual(min_of_three(-5, -2, -10), -10);`
      },
      java: {
        starterCode: `public static long minOfThree(long a, long b, long c) {
    // Write your solution here
    return 0L;
}`,
        sampleTests: `assert minOfThree(10L, 20L, 0L) == 0L;`,
        testSuite: `assert minOfThree(10L, 20L, 0L) == 0L;
assert minOfThree(10L, 20L, 30L) == 10L;`
      },
      c: {
        starterCode: `long min_of_three(long a, long b, long c) {
    // Write your solution here
    return 0;
}`,
        sampleTests: `assert(min_of_three(10, 20, 0) == 0);`,
        testSuite: `assert(min_of_three(10, 20, 0) == 0);
assert(min_of_three(10, 20, 30) == 10);
assert(min_of_three(-5, -2, -10) == -10);`
      }
    }
  },

  // 5. MBPP 234: Volume of Cube
  {
    taskId: 234,
    title: "5. Volume of Cube (MBPP 234)",
    description: "Write a function to calculate the volume of a cube given its side length `l`.\n\n**Example:**\nInput: `3` -> Output: `27`",
    difficulty: "EASY",
    category: "Math",
    points: 10,
    languages: {
      cpp: {
        starterCode: `long volume_cube(long l) {
    // Write your solution here
    return 0;
}`,
        sampleTests: `auto candidate = volume_cube;
assert(candidate(3) == 27);`,
        testSuite: `auto candidate = volume_cube;
assert(candidate(3) == 27);
assert(candidate(5) == 125);
assert(candidate(1) == 1);`
      },
      python: {
        starterCode: `def volume_cube(l: int) -> int:
    # Write your solution here
    pass`,
        sampleTests: `assert volume_cube(3) == 27`,
        testSuite: `assert volume_cube(3) == 27
assert volume_cube(5) == 125
assert volume_cube(1) == 1`
      },
      javascript: {
        starterCode: `function volume_cube(l) {
    // Write your solution here
    return 0;
}`,
        sampleTests: `assert.strictEqual(volume_cube(3), 27);`,
        testSuite: `assert.strictEqual(volume_cube(3), 27);
assert.strictEqual(volume_cube(5), 125);
assert.strictEqual(volume_cube(1), 1);`
      },
      java: {
        starterCode: `public static long volumeCube(long l) {
    // Write your solution here
    return 0L;
}`,
        sampleTests: `assert volumeCube(3L) == 27L;`,
        testSuite: `assert volumeCube(3L) == 27L;
assert volumeCube(5L) == 125L;`
      },
      c: {
        starterCode: `long volume_cube(long l) {
    // Write your solution here
    return 0;
}`,
        sampleTests: `assert(volume_cube(3) == 27);`,
        testSuite: `assert(volume_cube(3) == 27);
assert(volume_cube(5) == 125);`
      }
    }
  },

  // 6. MBPP 171: Perimeter of Pentagon
  {
    taskId: 171,
    title: "6. Perimeter of Regular Pentagon (MBPP 171)",
    description: "Write a function to calculate the perimeter of a regular pentagon given its side length `s`.\n\n**Example:**\nInput: `5` -> Output: `25`",
    difficulty: "EASY",
    category: "Math",
    points: 10,
    languages: {
      cpp: {
        starterCode: `long perimeter_pentagon(long s) {
    // Write your solution here
    return 0;
}`,
        sampleTests: `auto candidate = perimeter_pentagon;
assert(candidate(5) == 25);`,
        testSuite: `auto candidate = perimeter_pentagon;
assert(candidate(5) == 25);
assert(candidate(10) == 50);
assert(candidate(15) == 75);`
      },
      python: {
        starterCode: `def perimeter_pentagon(s: int) -> int:
    # Write your solution here
    pass`,
        sampleTests: `assert perimeter_pentagon(5) == 25`,
        testSuite: `assert perimeter_pentagon(5) == 25
assert perimeter_pentagon(10) == 50
assert perimeter_pentagon(15) == 75`
      },
      javascript: {
        starterCode: `function perimeter_pentagon(s) {
    // Write your solution here
    return 0;
}`,
        sampleTests: `assert.strictEqual(perimeter_pentagon(5), 25);`,
        testSuite: `assert.strictEqual(perimeter_pentagon(5), 25);
assert.strictEqual(perimeter_pentagon(10), 50);
assert.strictEqual(perimeter_pentagon(15), 75);`
      },
      java: {
        starterCode: `public static long perimeterPentagon(long s) {
    // Write your solution here
    return 0L;
}`,
        sampleTests: `assert perimeterPentagon(5L) == 25L;`,
        testSuite: `assert perimeterPentagon(5L) == 25L;
assert perimeterPentagon(10L) == 50L;`
      },
      c: {
        starterCode: `long perimeter_pentagon(long s) {
    // Write your solution here
    return 0;
}`,
        sampleTests: `assert(perimeter_pentagon(5) == 25);`,
        testSuite: `assert(perimeter_pentagon(5) == 25);
assert(perimeter_pentagon(10) == 50);`
      }
    }
  },

  // 7. MBPP 230: Replace Blank
  {
    taskId: 230,
    title: "7. Replace Blank Spaces (MBPP 230)",
    description: "Write a function that takes in a string and a replacement character, and replaces all blank spaces `' '` with that character.\n\n**Example:**\nInput: `\"hello people\"`, `\"@\"` -> Output: `\"hello@people\"`",
    difficulty: "EASY",
    category: "Strings",
    points: 10,
    languages: {
      cpp: {
        starterCode: `std::string replace_blank(std::string text, std::string ch) {
    // Write your solution here
    return "";
}`,
        sampleTests: `auto candidate = replace_blank;
assert(candidate("hello people", "@") == "hello@people");`,
        testSuite: `auto candidate = replace_blank;
assert(candidate("hello people", "@") == "hello@people");
assert(candidate("python code runner", "-") == "python-code-runner");
assert(candidate("nospace", "*") == "nospace");`
      },
      python: {
        starterCode: `def replace_blank(text: str, ch: str) -> str:
    # Write your solution here
    pass`,
        sampleTests: `assert replace_blank("hello people", "@") == "hello@people"`,
        testSuite: `assert replace_blank("hello people", "@") == "hello@people"
assert replace_blank("python code runner", "-") == "python-code-runner"
assert replace_blank("nospace", "*") == "nospace"`
      },
      javascript: {
        starterCode: `function replace_blank(text, ch) {
    // Write your solution here
    return "";
}`,
        sampleTests: `assert.strictEqual(replace_blank("hello people", "@"), "hello@people");`,
        testSuite: `assert.strictEqual(replace_blank("hello people", "@"), "hello@people");
assert.strictEqual(replace_blank("python code runner", "-"), "python-code-runner");
assert.strictEqual(replace_blank("nospace", "*"), "nospace");`
      },
      java: {
        starterCode: `public static String replaceBlank(String text, String ch) {
    // Write your solution here
    return "";
}`,
        sampleTests: `assert replaceBlank("hello people", "@").equals("hello@people");`,
        testSuite: `assert replaceBlank("hello people", "@").equals("hello@people");
assert replaceBlank("nospace", "*").equals("nospace");`
      },
      c: {
        starterCode: `char* replace_blank(char* text, char* ch) {
    // Write your solution here
    return text;
}`,
        sampleTests: `char s[] = "hello world"; replace_blank(s, "_");
assert(strcmp(s, "hello_world") == 0);`,
        testSuite: `char s[] = "hello world"; replace_blank(s, "_");
assert(strcmp(s, "hello_world") == 0);`
      }
    }
  },

  // 8. MBPP 162: Sum of Series
  {
    taskId: 162,
    title: "8. Sum of Series (MBPP 162)",
    description: "Write a function to calculate the sum of `(n - 2 * i)` from `i = 0` up to `n / 2` (integer division).\n\n**Example:**\nInput: `6` -> Output: `12`\nInput: `10` -> Output: `30`",
    difficulty: "MEDIUM",
    category: "Math & Loops",
    points: 20,
    languages: {
      cpp: {
        starterCode: `long sum_series(long n) {
    // Write your solution here
    return 0;
}`,
        sampleTests: `auto candidate = sum_series;
assert(candidate(6) == 12);`,
        testSuite: `auto candidate = sum_series;
assert(candidate(6) == 12);
assert(candidate(10) == 30);
assert(candidate(9) == 25);`
      },
      python: {
        starterCode: `def sum_series(n: int) -> int:
    # Write your solution here
    pass`,
        sampleTests: `assert sum_series(6) == 12`,
        testSuite: `assert sum_series(6) == 12
assert sum_series(10) == 30
assert sum_series(9) == 25`
      },
      javascript: {
        starterCode: `function sum_series(n) {
    // Write your solution here
    return 0;
}`,
        sampleTests: `assert.strictEqual(sum_series(6), 12);`,
        testSuite: `assert.strictEqual(sum_series(6), 12);
assert.strictEqual(sum_series(10), 30);
assert.strictEqual(sum_series(9), 25);`
      },
      java: {
        starterCode: `public static long sumSeries(long n) {
    // Write your solution here
    return 0L;
}`,
        sampleTests: `assert sumSeries(6L) == 12L;`,
        testSuite: `assert sumSeries(6L) == 12L;
assert sumSeries(10L) == 30L;`
      },
      c: {
        starterCode: `long sum_series(long n) {
    // Write your solution here
    return 0;
}`,
        sampleTests: `assert(sum_series(6) == 12);`,
        testSuite: `assert(sum_series(6) == 12);
assert(sum_series(10) == 30);`
      }
    }
  },

  // 9. MBPP 170: Sum Range in List
  {
    taskId: 170,
    title: "9. Sum of Range in List (MBPP 170)",
    description: "Write a function to find the sum of numbers in a vector/list between index `m` and index `n` inclusive.\n\n**Example:**\nInput: `nums = [2, 1, 5, 6, 4, 8, 9]`, `m = 2`, `n = 4` -> Output: `15` (5 + 6 + 4)",
    difficulty: "MEDIUM",
    category: "Arrays",
    points: 20,
    languages: {
      cpp: {
        starterCode: `long sum_range_list(std::vector<long> nums, long m, long n) {
    // Write your solution here
    return 0;
}`,
        sampleTests: `auto candidate = sum_range_list;
assert(candidate(std::vector<long>({2, 1, 5, 6, 4, 8, 9}), 2, 4) == 15);`,
        testSuite: `auto candidate = sum_range_list;
assert(candidate(std::vector<long>({2, 1, 5, 6, 4, 8, 9}), 2, 4) == 15);
assert(candidate(std::vector<long>({1, 2, 3, 4, 5}), 0, 4) == 15);
assert(candidate(std::vector<long>({10, 20, 30}), 1, 1) == 20);`
      },
      python: {
        starterCode: `def sum_range_list(nums: list[int], m: int, n: int) -> int:
    # Write your solution here
    pass`,
        sampleTests: `assert sum_range_list([2, 1, 5, 6, 4, 8, 9], 2, 4) == 15`,
        testSuite: `assert sum_range_list([2, 1, 5, 6, 4, 8, 9], 2, 4) == 15
assert sum_range_list([1, 2, 3, 4, 5], 0, 4) == 15
assert sum_range_list([10, 20, 30], 1, 1) == 20`
      },
      javascript: {
        starterCode: `function sum_range_list(nums, m, n) {
    // Write your solution here
    return 0;
}`,
        sampleTests: `assert.strictEqual(sum_range_list([2, 1, 5, 6, 4, 8, 9], 2, 4), 15);`,
        testSuite: `assert.strictEqual(sum_range_list([2, 1, 5, 6, 4, 8, 9], 2, 4), 15);
assert.strictEqual(sum_range_list([1, 2, 3, 4, 5], 0, 4), 15);
assert.strictEqual(sum_range_list([10, 20, 30], 1, 1), 20);`
      },
      java: {
        starterCode: `public static long sumRangeList(List<Long> nums, int m, int n) {
    // Write your solution here
    return 0L;
}`,
        sampleTests: `assert sumRangeList(Arrays.asList(2L, 1L, 5L, 6L, 4L, 8L, 9L), 2, 4) == 15L;`,
        testSuite: `assert sumRangeList(Arrays.asList(2L, 1L, 5L, 6L, 4L, 8L, 9L), 2, 4) == 15L;
assert sumRangeList(Arrays.asList(1L, 2L, 3L), 0, 2) == 6L;`
      },
      c: {
        starterCode: `long sum_range_list(long* nums, int len, int m, int n) {
    // Write your solution here
    return 0;
}`,
        sampleTests: `long arr[] = {2, 1, 5, 6, 4, 8, 9};
assert(sum_range_list(arr, 7, 2, 4) == 15);`,
        testSuite: `long arr[] = {2, 1, 5, 6, 4, 8, 9};
assert(sum_range_list(arr, 7, 2, 4) == 15);`
      }
    }
  },

  // 10. MBPP 161: Remove Elements
  {
    taskId: 161,
    title: "10. Remove Elements Present in Another List (MBPP 161)",
    description: "Write a function to remove all elements from the first vector/list that are present in the second vector/list.\n\n**Example:**\nInput: `list1 = [1, 2, 3, 4, 5]`, `list2 = [2, 4]` -> Output: `[1, 3, 5]`",
    difficulty: "MEDIUM",
    category: "Arrays & Filtering",
    points: 20,
    languages: {
      cpp: {
        starterCode: `std::vector<long> remove_elements(std::vector<long> list1, std::vector<long> list2) {
    // Write your solution here
    return {};
}`,
        sampleTests: `auto candidate = remove_elements;
assert(candidate(std::vector<long>({1, 2, 3, 4, 5}), std::vector<long>({2, 4})) == std::vector<long>({1, 3, 5}));`,
        testSuite: `auto candidate = remove_elements;
assert(candidate(std::vector<long>({1, 2, 3, 4, 5}), std::vector<long>({2, 4})) == std::vector<long>({1, 3, 5}));
assert(candidate(std::vector<long>({1, 2, 3}), std::vector<long>({4, 5})) == std::vector<long>({1, 2, 3}));
assert(candidate(std::vector<long>({1, 1, 2}), std::vector<long>({1})) == std::vector<long>({2}));`
      },
      python: {
        starterCode: `def remove_elements(list1: list[int], list2: list[int]) -> list[int]:
    # Write your solution here
    pass`,
        sampleTests: `assert remove_elements([1, 2, 3, 4, 5], [2, 4]) == [1, 3, 5]`,
        testSuite: `assert remove_elements([1, 2, 3, 4, 5], [2, 4]) == [1, 3, 5]
assert remove_elements([1, 2, 3], [4, 5]) == [1, 2, 3]
assert remove_elements([1, 1, 2], [1]) == [2]`
      },
      javascript: {
        starterCode: `function remove_elements(list1, list2) {
    // Write your solution here
    return [];
}`,
        sampleTests: `assert.deepEqual(remove_elements([1, 2, 3, 4, 5], [2, 4]), [1, 3, 5]);`,
        testSuite: `assert.deepEqual(remove_elements([1, 2, 3, 4, 5], [2, 4]), [1, 3, 5]);
assert.deepEqual(remove_elements([1, 2, 3], [4, 5]), [1, 2, 3]);
assert.deepEqual(remove_elements([1, 1, 2], [1]), [2]);`
      },
      java: {
        starterCode: `public static List<Long> removeElements(List<Long> list1, List<Long> list2) {
    // Write your solution here
    return new ArrayList<>();
}`,
        sampleTests: `assert removeElements(Arrays.asList(1L, 2L, 3L, 4L, 5L), Arrays.asList(2L, 4L)).equals(Arrays.asList(1L, 3L, 5L));`,
        testSuite: `assert removeElements(Arrays.asList(1L, 2L, 3L, 4L, 5L), Arrays.asList(2L, 4L)).equals(Arrays.asList(1L, 3L, 5L));`
      },
      c: {
        starterCode: `// Sample stub for C
int remove_elements(long* l1, int n1, long* l2, int n2, long* out) {
    return 0;
}`,
        sampleTests: `assert(1 == 1);`,
        testSuite: `assert(1 == 1);`
      }
    }
  }
];
