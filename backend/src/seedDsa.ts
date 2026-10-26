import mongoose from 'mongoose';
import "dotenv/config";
import DsaQuestion from './models/DsaQuestion.js';
import { mbppCuratedQuestions } from './data/mbppQuestions.js';

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/skillsphere";

interface TestCase {
  input: string;
  expectedOutput: string;
}

interface InitialCodeMap {
  javascript: string;
  python: string;
  cpp: string;
  java: string;
  c: string;
}

interface QuestionItem {
  title: string;
  description: string;
  difficulty: string;
  category: string;
  points: number;
  testCases: TestCase[];
  initialCode: InitialCodeMap;
}

const questionsList: QuestionItem[] = [
  // Category 1: Basic Math & Logic
  {
    title: "1. Palindrome Number",
    description: "Check if an integer is a palindrome. Return 'true' or 'false'.\n\n**Time Complexity:** O(log10 n)\n**Space Complexity:** O(1)",
    difficulty: "EASY",
    category: "Math",
    points: 10,
    testCases: [
      { input: "121", expectedOutput: "true" },
      { input: "-121", expectedOutput: "false" },
      { input: "10", expectedOutput: "false" }
    ],
    initialCode: {
      javascript: "function solve(n) {\n  // return 'true' or 'false'\n}",
      python: "def solve(n):\n    # return 'true' or 'false'\n    pass",
      cpp: "string solve(string n) {\n  // return \"true\" or \"false\"\n}",
      java: "public static String solve(String n) {\n  // return \"true\" or \"false\"\n}",
      c: "char* solve(char* n) {\n  // return \"true\" or \"false\"\n}"
    }
  },
  {
    title: "2. Armstrong Number",
    description: "Check if the sum of the cubes of the digits equals the number itself.\n\n**Time Complexity:** O(log10 n)\n**Space Complexity:** O(1)",
    difficulty: "EASY",
    category: "Math",
    points: 10,
    testCases: [
      { input: "153", expectedOutput: "true" },
      { input: "370", expectedOutput: "true" },
      { input: "123", expectedOutput: "false" }
    ],
    initialCode: {
      javascript: "function solve(n) {\n  // return 'true' or 'false'\n}",
      python: "def solve(n):\n    # return 'true' or 'false'\n    pass",
      cpp: "string solve(string n) {\n  // return \"true\" or \"false\"\n}",
      java: "public static String solve(String n) {\n  // return \"true\" or \"false\"\n}",
      c: "char* solve(char* n) {\n  // return \"true\" or \"false\"\n}"
    }
  },
  {
    title: "3. Prime Number Check",
    description: "Determine if a number is prime. Return 'true' or 'false'.\n\n**Time Complexity:** O(√n)\n**Space Complexity:** O(1)",
    difficulty: "EASY",
    category: "Math",
    points: 10,
    testCases: [
      { input: "17", expectedOutput: "true" },
      { input: "4", expectedOutput: "false" },
      { input: "2", expectedOutput: "true" }
    ],
    initialCode: {
      javascript: "function solve(n) {\n  // return 'true' or 'false'\n}",
      python: "def solve(n):\n    # return 'true' or 'false'\n    pass",
      cpp: "string solve(string n) {\n  // return \"true\" or \"false\"\n}",
      java: "public static String solve(String n) {\n  // return \"true\" or \"false\"\n}",
      c: "char* solve(char* n) {\n  // return \"true\" or \"false\"\n}"
    }
  },
  {
    title: "4. Factorial of a Number",
    description: "Calculate the factorial of n (n!). Return the result as a string.\n\n**Time Complexity:** O(n)\n**Space Complexity:** O(1)",
    difficulty: "EASY",
    category: "Math",
    points: 10,
    testCases: [
      { input: "5", expectedOutput: "120" },
      { input: "0", expectedOutput: "1" },
      { input: "6", expectedOutput: "720" }
    ],
    initialCode: {
      javascript: "function solve(n) {\n  // return the factorial as a string\n}",
      python: "def solve(n):\n    # return the factorial as a string\n    pass",
      cpp: "string solve(string n) {\n  // return the factorial as a string\n}",
      java: "public static String solve(String n) {\n  // return the factorial as a string\n}",
      c: "char* solve(char* n) {\n  // return the factorial as a string\n}"
    }
  },
  {
    title: "5. Fibonacci Series",
    description: "Return the n-th number in the Fibonacci sequence. (Assume 0-th is 0, 1-st is 1)\n\n**Time Complexity:** O(n)\n**Space Complexity:** O(1)",
    difficulty: "EASY",
    category: "Math",
    points: 10,
    testCases: [
      { input: "6", expectedOutput: "8" },
      { input: "0", expectedOutput: "0" },
      { input: "10", expectedOutput: "55" }
    ],
    initialCode: {
      javascript: "function solve(n) {\n  // return the n-th Fibonacci number as a string\n}",
      python: "def solve(n):\n    # return the n-th Fibonacci number as a string\n    pass",
      cpp: "string solve(string n) {\n  // return as string\n}",
      java: "public static String solve(String n) {\n  // return as string\n}",
      c: "char* solve(char* n) {\n  // return as string\n}"
    }
  },

  // Category 2: Strings
  {
    title: "6. Return Length of String",
    description: "Return the total character count of the given string as a string.\n\n**Time Complexity:** O(1)\n**Space Complexity:** O(1)",
    difficulty: "EASY",
    category: "Strings",
    points: 10,
    testCases: [
      { input: "Hello", expectedOutput: "5" },
      { input: "SkillSphere", expectedOutput: "11" },
      { input: "AI", expectedOutput: "2" }
    ],
    initialCode: {
      javascript: "function solve(s) {\n  // return length as a string\n}",
      python: "def solve(s):\n    # return length as a string\n    pass",
      cpp: "string solve(string s) {\n  // return length as a string\n}",
      java: "public static String solve(String s) {\n  // return length as a string\n}",
      c: "char* solve(char* s) {\n  // return length as a string\n}"
    }
  },
  {
    title: "7. Reverse a String",
    description: "Reverse the characters in the string in place.\n\n**Time Complexity:** O(n)\n**Space Complexity:** O(n)",
    difficulty: "EASY",
    category: "Strings",
    points: 10,
    testCases: [
      { input: "code", expectedOutput: "edoc" },
      { input: "hello", expectedOutput: "olleh" },
      { input: "a", expectedOutput: "a" }
    ],
    initialCode: {
      javascript: "function solve(s) {\n  // return reversed string\n}",
      python: "def solve(s):\n    # return reversed string\n    pass",
      cpp: "string solve(string s) {\n  // return reversed string\n}",
      java: "public static String solve(String s) {\n  // return reversed string\n}",
      c: "char* solve(char* s) {\n  // return reversed string\n}"
    }
  },
  {
    title: "8. Sentence Palindrome",
    description: "Check palindrome status ignoring case and non-alphanumeric characters. Return 'true' or 'false'.\n\n**Time Complexity:** O(n)\n**Space Complexity:** O(n)",
    difficulty: "MEDIUM",
    category: "Strings",
    points: 20,
    testCases: [
      { input: "Race Car", expectedOutput: "true" },
      { input: "A man, a plan, a canal: Panama", expectedOutput: "true" },
      { input: "hello", expectedOutput: "false" }
    ],
    initialCode: {
      javascript: "function solve(s) {\n  // return 'true' or 'false'\n}",
      python: "def solve(s):\n    # return 'true' or 'false'\n    pass",
      cpp: "string solve(string s) {\n  // return \"true\" or \"false\"\n}",
      java: "public static String solve(String s) {\n  // return \"true\" or \"false\"\n}",
      c: "char* solve(char* s) {\n  // return \"true\" or \"false\"\n}"
    }
  },
  {
    title: "9. Longest Substring Without Repeating",
    description: "Find the length of the longest substring with unique characters. Return as string.\n\n**Time Complexity:** O(n)\n**Space Complexity:** O(min(n, m))",
    difficulty: "MEDIUM",
    category: "Strings",
    points: 20,
    testCases: [
      { input: "abcabcbb", expectedOutput: "3" },
      { input: "bbbbb", expectedOutput: "1" },
      { input: "pwwkew", expectedOutput: "3" }
    ],
    initialCode: {
      javascript: "function solve(s) {\n  // return length as string\n}",
      python: "def solve(s):\n    # return length as string\n    pass",
      cpp: "string solve(string s) {\n  // return length as string\n}",
      java: "public static String solve(String s) {\n  // return length as string\n}",
      c: "char* solve(char* s) {\n  // return length as string\n}"
    }
  },
  {
    title: "10. Valid Anagram",
    description: "Check if two strings contain the same characters. Inputs are separated by a comma (e.g. rat,car). Return 'true' or 'false'.\n\n**Time Complexity:** O(n)\n**Space Complexity:** O(1)",
    difficulty: "EASY",
    category: "Strings",
    points: 10,
    testCases: [
      { input: "rat,car", expectedOutput: "false" },
      { input: "listen,silent", expectedOutput: "true" },
      { input: "a,a", expectedOutput: "true" }
    ],
    initialCode: {
      javascript: "function solve(input) {\n  const [s, t] = input.split(',');\n  // return 'true' or 'false'\n}",
      python: "def solve(input):\n    s, t = input.split(',')\n    # return 'true' or 'false'\n    pass",
      cpp: "string solve(string input) {\n  // split by comma and compare\n}",
      java: "public static String solve(String input) {\n  // split by comma and compare\n}",
      c: "char* solve(char* input) {\n  // split by comma and compare\n}"
    }
  }
];

for (let i = 11; i <= 50; i++) {
  questionsList.push({
    title: `${i}. DSA Challenge ${i}`,
    description: `Determine the optimal solution for this algorithmic challenge.\n\n**Time Complexity:** O(n)\n**Space Complexity:** O(n)`,
    difficulty: i % 3 === 0 ? "HARD" : i % 2 === 0 ? "MEDIUM" : "EASY",
    category: "Arrays & Sorting",
    points: i % 3 === 0 ? 30 : i % 2 === 0 ? 20 : 10,
    testCases: [
      { input: "1,2,3", expectedOutput: "3" },
      { input: "4,5,6", expectedOutput: "6" }
    ],
    initialCode: {
      javascript: "function solve(input) {\n  // return the correct answer as a string\n  return input.split(',').pop() || '';\n}",
      python: "def solve(input):\n    # return the correct answer as a string\n    return input.split(',')[-1]",
      cpp: "string solve(string input) {\n  // return answer\n  return string(1, input.back());\n}",
      java: "public static String solve(String input) {\n  // return answer\n  String[] parts = input.split(\",\");\n  return parts[parts.length - 1];\n}",
      c: "char* solve(char* input) {\n  // dummy C code\n  return \"3\"; \n}"
    }
  });
}

const seedDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    await DsaQuestion.deleteMany({});
    console.log("Cleared existing DSA questions");

    const mbppFormatted = mbppCuratedQuestions.map(q => ({
      taskId: q.taskId,
      title: q.title,
      description: q.description,
      difficulty: q.difficulty,
      category: q.category,
      points: q.points,
      languages: q.languages,
      initialCode: {
        cpp: q.languages.cpp.starterCode,
        python: q.languages.python.starterCode,
        javascript: q.languages.javascript.starterCode,
        java: q.languages.java.starterCode,
        c: q.languages.c.starterCode
      },
      testCases: []
    }));

    const allToInsert = [...mbppFormatted, ...questionsList];
    await DsaQuestion.insertMany(allToInsert);
    console.log(`Successfully seeded ${allToInsert.length} DSA questions (${mbppFormatted.length} MBPP MultiPL-E)!`);

    mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDB();
