import { Verdict } from './types.js';

export const MAX_PUBLIC_MESSAGE_LENGTH = 2000;

export interface SanitizeOptions {
  verdict: Verdict;
  rawOutput: string;
  playerCodeLines: number;
  language: string;
}

/**
 * Output Sanitizer:
 * Critical security filter to guarantee that hidden test harness lines,
 * test inputs, and expected outputs are never exposed to clients.
 */
export function sanitizeOutput(options: SanitizeOptions): string {
  const { verdict, rawOutput, playerCodeLines, language } = options;
  const text = (rawOutput || '').trim();

  switch (verdict) {
    case 'passed':
      return 'All tests passed!';

    case 'failed':
      // Never expose assert expressions, values, or lines
      return 'Some tests failed';

    case 'timeout':
      return 'Time limit exceeded';

    case 'system_error':
      return 'Judge unavailable, please try again';

    case 'compile_error': {
      if (!text) return 'Compilation error';

      if (language === 'cpp') {
        const lines = text.split('\n');
        const allowedLines: string[] = [];

        for (const line of lines) {
          // Match GCC compiler line format: filename:line:col: error: ...
          const lineMatch = line.match(/(?:[a-zA-Z0-9_\-\./]+)?:(\d+):(?:\d+:)?\s*(error|fatal error|note|warning)?:?\s*(.*)/i);
          if (lineMatch) {
            const lineNum = parseInt(lineMatch[1], 10);
            if (lineNum <= playerCodeLines) {
              const severity = lineMatch[2] || 'error';
              const detail = lineMatch[3] || '';
              allowedLines.push(`Line ${lineNum}: ${severity}: ${detail}`);
            }
          } else if (allowedLines.length > 0 && (line.startsWith(' ') || line.includes('^'))) {
            // Include carets/code pointers if attached to an allowed error line
            allowedLines.push(line);
          }
        }

        if (allowedLines.length > 0) {
          const combined = allowedLines.join('\n');
          return combined.length > MAX_PUBLIC_MESSAGE_LENGTH
            ? combined.slice(0, MAX_PUBLIC_MESSAGE_LENGTH) + '... (truncated)'
            : combined;
        }

        return 'Compilation error: please verify your function signature, return type, and syntax.';
      }

      if (language === 'python') {
        // Match Python SyntaxError line
        const syntaxLineMatch = text.match(/File\s+["'].*?["'],\s+line\s+(\d+)/i);
        const errorTypeMatch = text.match(/((?:SyntaxError|IndentationError|TabError):.*)/i);

        if (syntaxLineMatch) {
          const lineNum = parseInt(syntaxLineMatch[1], 10);
          if (lineNum <= playerCodeLines) {
            const errorType = errorTypeMatch ? errorTypeMatch[1] : 'SyntaxError';
            return `Line ${lineNum}: ${errorType}`;
          }
        }
        return 'Syntax error in code submission.';
      }

      return 'Compilation error in submission.';
    }

    case 'runtime_error': {
      if (!text) return 'Runtime error';

      // Python runtime error
      if (language === 'python') {
        // If it's an AssertionError, it's a test assertion failing -> must show generic failed
        if (text.includes('AssertionError')) {
          return 'Some tests failed';
        }

        // Check traceback line numbers
        const fileLineMatches = [...text.matchAll(/File\s+["'].*?["'],\s+line\s+(\d+)(?:,\s+in\s+([a-zA-Z0-9_]+))?/gi)];
        let lastPlayerLine: number | null = null;

        for (const match of fileLineMatches) {
          const lineNum = parseInt(match[1], 10);
          if (lineNum <= playerCodeLines) {
            lastPlayerLine = lineNum;
          }
        }

        // Extract exception name and message (e.g. "IndexError: list index out of range")
        const exceptionMatch = text.match(/([a-zA-Z0-9_]+Error|[a-zA-Z0-9_]+Exception):\s*(.*)/i);
        if (lastPlayerLine !== null && exceptionMatch) {
          const excName = exceptionMatch[1];
          const excMsg = exceptionMatch[2] || '';
          return `Runtime Error at line ${lastPlayerLine}: ${excName}: ${excMsg}`.slice(0, MAX_PUBLIC_MESSAGE_LENGTH);
        }

        return 'Runtime error occurred during execution.';
      }

      // C++ runtime error
      if (language === 'cpp') {
        if (text.includes('Assertion') || text.includes('assert')) {
          return 'Some tests failed';
        }
        if (text.includes('std::out_of_range')) {
          return 'Runtime Error: std::out_of_range (vector or string index out of bounds)';
        }
        if (text.includes('std::bad_alloc')) {
          return 'Runtime Error: std::bad_alloc (memory allocation failed)';
        }
        return 'Runtime error (e.g. segmentation fault, division by zero, or illegal memory access)';
      }

      return 'Runtime error';
    }

    default:
      return 'Execution finished';
  }
}
