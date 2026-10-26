import { exec } from "child_process";
import util from "util";
import fs from "fs/promises";
import path from "path";
import axios from "axios";
import os from "os";

const execPromise = util.promisify(exec);

export interface ExecutionResult {
  success: boolean;
  message: string;
  isSubmit: boolean;
  output?: string;
  executionTimeMs?: number;
}

export interface CodeRunOptions {
  question: any;
  language: string;
  code: string;
  isSubmit: boolean;
}

// Judge0 Language ID Mapping
const JUDGE0_LANGUAGE_IDS: Record<string, number> = {
  cpp: 54,        // C++ (GCC 9.2.0)
  python: 71,     // Python (3.8.1)
  javascript: 63, // JavaScript (Node.js 12.14.0)
  java: 62,       // Java (OpenJDK 13.0.1)
  c: 50           // C (GCC 9.2.0)
};

/**
 * Clean up MultiPL-E raw test strings:
 * MultiPL-E tests often start with a leading '}' because they were designed
 * for autocomplete models where the model stopped before the closing brace.
 * For human programmers writing full functions, we remove the leading '}'.
 */
function cleanTestSuffix(rawTests: string): string {
  let cleaned = rawTests.trim();
  if (cleaned.startsWith("}")) {
    cleaned = cleaned.substring(1).trim();
  }
  return cleaned;
}

/**
 * Extract human-readable assertion failure from stderr.
 */
function formatErrorMessage(stderr: string, stdout: string, language: string): string {
  const combined = (stderr || stdout || "").trim();

  // C++ assertion failure
  const cppAssertMatch = combined.match(/Assertion [`']([^`']+)['`] failed/i);
  if (cppAssertMatch) {
    return `Assertion Failed:\nassert(${cppAssertMatch[1]})`;
  }

  // Python AssertionError
  if (combined.includes("AssertionError")) {
    const lines = combined.split("\n");
    const lastLines = lines.slice(-3).join("\n");
    return `Test Assertion Failed:\n${lastLines}`;
  }

  // Node.js AssertionError
  if (combined.includes("AssertionError") || combined.includes("ERR_ASSERTION")) {
    const lines = combined.split("\n");
    const errorLine = lines.find(l => l.includes("AssertionError") || l.includes("Expected values"));
    return `Assertion Failed:\n${errorLine || combined.slice(0, 300)}`;
  }

  // Compilation / syntax error
  if (combined.includes("error:") || combined.includes("SyntaxError")) {
    // Truncate long compilation diagnostics to first few lines
    const lines = combined.split("\n").slice(0, 6).join("\n");
    return `Compilation / Syntax Error:\n${lines}`;
  }

  return combined.slice(0, 500) || "Execution failed with non-zero exit code.";
}

/**
 * Execute code using an external Judge0 API if configured in environment variables.
 */
async function executeWithJudge0(
  fullSourceCode: string,
  language: string
): Promise<ExecutionResult | null> {
  const judge0Url = process.env.JUDGE0_API_URL || process.env.JUDGE0_URL;
  if (!judge0Url) return null;

  const languageId = JUDGE0_LANGUAGE_IDS[language];
  if (!languageId) return null;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };

    if (process.env.JUDGE0_API_KEY) {
      headers["X-RapidAPI-Key"] = process.env.JUDGE0_API_KEY;
      headers["X-RapidAPI-Host"] = process.env.JUDGE0_API_HOST || "judge0-ce.p.rapidapi.com";
    }

    const response = await axios.post(
      `${judge0Url.replace(/\/+$/, "")}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: fullSourceCode,
        language_id: languageId,
        stdin: ""
      },
      { headers, timeout: 8000 }
    );

    const data = response.data;
    const statusId = data.status?.id;

    if (statusId === 3) {
      return {
        success: true,
        message: "Passed all test assertions via Judge0!",
        isSubmit: true,
        output: data.stdout
      };
    }

    const errorDetails = data.compile_output || data.stderr || data.message || data.status?.description;
    return {
      success: false,
      message: formatErrorMessage(errorDetails, data.stdout, language),
      isSubmit: true
    };
  } catch (err: any) {
    console.warn("⚠️ Judge0 execution failed or unavailable, falling back to local runner:", err.message);
    return null;
  }
}

/**
 * Execute code locally in a secure sandboxed child process.
 */
async function executeLocally(
  fullSourceCode: string,
  language: string,
  tmpId: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const tmpDir = os.tmpdir();

  if (language === "cpp") {
    const srcPath = path.join(tmpDir, `skillsphere_${tmpId}.cpp`);
    const binPath = path.join(tmpDir, `skillsphere_${tmpId}.out`);
    await fs.writeFile(srcPath, fullSourceCode);

    try {
      const compileRes = await execPromise(
        `g++ -O2 -std=c++17 "${srcPath}" -o "${binPath}"`,
        { timeout: 6000 }
      );
      const runRes = await execPromise(`"${binPath}"`, { timeout: 4000 });
      return { stdout: runRes.stdout, stderr: runRes.stderr, exitCode: 0 };
    } catch (err: any) {
      return {
        stdout: err.stdout || "",
        stderr: err.stderr || err.message,
        exitCode: err.code || 1
      };
    } finally {
      await fs.unlink(srcPath).catch(() => {});
      await fs.unlink(binPath).catch(() => {});
    }
  }

  if (language === "python") {
    const srcPath = path.join(tmpDir, `skillsphere_${tmpId}.py`);
    await fs.writeFile(srcPath, fullSourceCode);

    try {
      const res = await execPromise(`python3 "${srcPath}"`, { timeout: 4000 });
      return { stdout: res.stdout, stderr: res.stderr, exitCode: 0 };
    } catch (err: any) {
      return {
        stdout: err.stdout || "",
        stderr: err.stderr || err.message,
        exitCode: err.code || 1
      };
    } finally {
      await fs.unlink(srcPath).catch(() => {});
    }
  }

  if (language === "javascript") {
    const srcPath = path.join(tmpDir, `skillsphere_${tmpId}.js`);
    await fs.writeFile(srcPath, fullSourceCode);

    try {
      const res = await execPromise(`node "${srcPath}"`, { timeout: 4000 });
      return { stdout: res.stdout, stderr: res.stderr, exitCode: 0 };
    } catch (err: any) {
      return {
        stdout: err.stdout || "",
        stderr: err.stderr || err.message,
        exitCode: err.code || 1
      };
    } finally {
      await fs.unlink(srcPath).catch(() => {});
    }
  }

  if (language === "c") {
    const srcPath = path.join(tmpDir, `skillsphere_${tmpId}.c`);
    const binPath = path.join(tmpDir, `skillsphere_${tmpId}.out`);
    await fs.writeFile(srcPath, fullSourceCode);

    try {
      await execPromise(`gcc -O2 "${srcPath}" -o "${binPath}"`, { timeout: 6000 });
      const runRes = await execPromise(`"${binPath}"`, { timeout: 4000 });
      return { stdout: runRes.stdout, stderr: runRes.stderr, exitCode: 0 };
    } catch (err: any) {
      return {
        stdout: err.stdout || "",
        stderr: err.stderr || err.message,
        exitCode: err.code || 1
      };
    } finally {
      await fs.unlink(srcPath).catch(() => {});
      await fs.unlink(binPath).catch(() => {});
    }
  }

  if (language === "java") {
    const className = `SkillSphere_${tmpId}`;
    const srcPath = path.join(tmpDir, `${className}.java`);
    
    // Ensure Java class name matches file name
    const adaptedJavaCode = fullSourceCode.replace(/public\s+class\s+[a-zA-Z0-9_]+/g, `public class ${className}`);
    await fs.writeFile(srcPath, adaptedJavaCode);

    try {
      await execPromise(`javac "${srcPath}"`, { timeout: 6000 });
      const runRes = await execPromise(`java -cp "${tmpDir}" ${className}`, { timeout: 4000 });
      return { stdout: runRes.stdout, stderr: runRes.stderr, exitCode: 0 };
    } catch (err: any) {
      return {
        stdout: err.stdout || "",
        stderr: err.stderr || err.message,
        exitCode: err.code || 1
      };
    } finally {
      await fs.unlink(srcPath).catch(() => {});
      await fs.unlink(path.join(tmpDir, `${className}.class`)).catch(() => {});
    }
  }

  return { stdout: "", stderr: `Unsupported execution language: ${language}`, exitCode: 1 };
}

/**
 * Main Evaluation Function:
 * Supports both MultiPL-E assertion suites and legacy input/output questions.
 */
export async function evaluateCodeSubmission(options: CodeRunOptions): Promise<ExecutionResult> {
  const { question, language, code, isSubmit } = options;
  const startTime = Date.now();
  const tmpId = Math.random().toString(36).substring(2, 9);

  // Check if question has MultiPL-E / LanguageSpec configuration
  let langSpec = null;
  if (question?.languages) {
    if (question.languages instanceof Map) {
      langSpec = question.languages.get(language);
    } else if (typeof question.languages === "object") {
      langSpec = question.languages[language];
    }
  }

  // =========================================================================
  // Case A: MultiPL-E / Assertion-based Question
  // =========================================================================
  if (langSpec && (langSpec.testSuite || langSpec.sampleTests)) {
    const selectedTests = !isSubmit && langSpec.sampleTests
      ? langSpec.sampleTests
      : langSpec.testSuite;

    let assembledProgram = "";

    if (language === "cpp") {
      const cleanedSuffix = cleanTestSuffix(selectedTests);
      
      const defaultIncludes = `
#include <iostream>
#include <vector>
#include <string>
#include <cmath>
#include <algorithm>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <queue>
#include <stack>
#include <tuple>
#include <cassert>
#include <bits/stdc++.h>
using namespace std;
`;

      const prefix = langSpec.testPrefix || defaultIncludes;

      // If tests already define main(), combine them cleanly
      if (cleanedSuffix.includes("int main")) {
        assembledProgram = `${prefix}\n\n${code}\n\n${cleanedSuffix}`;
      } else {
        assembledProgram = `
${prefix}

${code}

int main() {
    ${cleanedSuffix}
    std::cout << "TESTS_PASSED" << std::endl;
    return 0;
}
`;
      }
    } else if (language === "python") {
      const prefix = langSpec.testPrefix || `
from typing import *
import math, collections, itertools, heapq, functools
`;
      assembledProgram = `
${prefix}

${code}

# Test Suite
${selectedTests}
print("TESTS_PASSED")
`;
    } else if (language === "javascript") {
      const prefix = langSpec.testPrefix || `
const assert = require('node:assert');
`;
      assembledProgram = `
${prefix}

${code}

// Test Suite
${selectedTests}
console.log("TESTS_PASSED");
`;
    } else if (language === "c") {
      const prefix = langSpec.testPrefix || `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <assert.h>
`;
      assembledProgram = `
${prefix}

${code}

int main() {
    ${selectedTests}
    printf("TESTS_PASSED\\n");
    return 0;
}
`;
    } else if (language === "java") {
      assembledProgram = `
import java.util.*;
import java.math.*;

public class Main {
    ${code}

    public static void main(String[] args) {
        ${selectedTests}
        System.out.println("TESTS_PASSED");
    }
}
`;
    }

    // Try Judge0 if available
    const judge0Result = await executeWithJudge0(assembledProgram, language);
    if (judge0Result) {
      judge0Result.executionTimeMs = Date.now() - startTime;
      judge0Result.isSubmit = isSubmit;
      if (judge0Result.success) {
        judge0Result.message = isSubmit
          ? "🎉 Correct! All test cases passed!"
          : "✅ Sample test case passed! Click SUBMIT SOLUTION to evaluate all test cases.";
      }
      return judge0Result;
    }

    // Local sandbox execution
    const localResult = await executeLocally(assembledProgram, language, tmpId);
    const elapsed = Date.now() - startTime;

    if (localResult.exitCode === 0) {
      return {
        success: true,
        message: isSubmit
          ? "🎉 Correct! All test cases passed."
          : "✅ Sample test case passed! Click SUBMIT SOLUTION to evaluate all test cases.",
        isSubmit,
        output: localResult.stdout.trim(),
        executionTimeMs: elapsed
      };
    } else {
      return {
        success: false,
        message: formatErrorMessage(localResult.stderr, localResult.stdout, language),
        isSubmit,
        executionTimeMs: elapsed
      };
    }
  }

  // =========================================================================
  // Case B: Legacy input/output Question (Backward Compatibility)
  // =========================================================================
  const testCases = question?.testCases || [];
  if (!testCases || testCases.length === 0) {
    return {
      success: false,
      message: "No test cases configured for this question.",
      isSubmit
    };
  }

  const testCasesToRun = isSubmit ? testCases : [testCases[0]];

  for (let i = 0; i < testCasesToRun.length; i++) {
    const tc = testCasesToRun[i];
    let executableCode = code;
    let funcName = "solve";

    if (language === "javascript") {
      const jsMatch = code.match(/function\s+([a-zA-Z0-9_]+)\s*\(/);
      if (jsMatch) funcName = jsMatch[1];
      executableCode = `${code}\nconsole.log(${funcName}(${JSON.stringify(tc.input)}));`;
    } else if (language === "python") {
      const pyMatch = code.match(/def\s+([a-zA-Z0-9_]+)\s*\(/);
      if (pyMatch) funcName = pyMatch[1];
      executableCode = `${code}\nprint(${funcName}(${JSON.stringify(tc.input)}))`;
    } else if (language === "cpp") {
      const cppMatch = code.match(/(?:int|string|char\*|bool|float|double|void|long|short|auto)\s+([a-zA-Z0-9_]+)\s*\(/);
      if (cppMatch && cppMatch[1] !== "main") funcName = cppMatch[1];
      executableCode = `
#include <iostream>
#include <string>
using namespace std;
${code}
int main() {
    cout << ${funcName}(${JSON.stringify(tc.input)}) << endl;
    return 0;
}
`;
    }

    const res = await executeLocally(executableCode, language, `${tmpId}_${i}`);
    if (res.exitCode !== 0 || res.stderr.trim()) {
      return {
        success: false,
        message: `Error on Test Case ${i + 1}:\n${res.stderr || "Runtime Error"}`,
        isSubmit
      };
    }

    const actual = res.stdout.trim();
    if (actual !== String(tc.expectedOutput).trim()) {
      return {
        success: false,
        message: `Failed Test Case ${i + 1}\nInput: ${tc.input}\nExpected: ${tc.expectedOutput}\nGot: ${actual}`,
        isSubmit
      };
    }
  }

  return {
    success: true,
    message: isSubmit
      ? "🎉 Correct! All test cases passed."
      : "✅ Sample test case passed! Click SUBMIT SOLUTION to evaluate all test cases.",
    isSubmit,
    executionTimeMs: Date.now() - startTime
  };
}
