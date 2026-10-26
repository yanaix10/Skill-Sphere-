import { describe, it, expect } from 'vitest';
import { sanitizeOutput } from '../src/runner/sanitizer.js';

describe('Output Sanitizer', () => {
  it('strictly redacts Python assertion failures to "Some tests failed"', () => {
    const rawStderr = `
Traceback (most recent call last):
  File "solution.py", line 14, in <module>
    assert candidate((std::vector<long>({(long)25, (long)35}))) == ((long)85)
AssertionError: expected secret value 85 but got 10
`;

    const sanitized = sanitizeOutput({
      verdict: 'failed',
      rawOutput: rawStderr,
      playerCodeLines: 5,
      language: 'python'
    });

    expect(sanitized).toBe('Some tests failed');
    expect(sanitized).not.toContain('85');
    expect(sanitized).not.toContain('candidate');
    expect(sanitized).not.toContain('AssertionError');
  });

  it('strictly redacts C++ assertion failures to "Some tests failed"', () => {
    const rawStderr = `
a.out: solution.cpp:28: int main(): Assertion \`candidate(1337) == 42\` failed.
Aborted (core dumped)
`;

    const sanitized = sanitizeOutput({
      verdict: 'failed',
      rawOutput: rawStderr,
      playerCodeLines: 10,
      language: 'cpp'
    });

    expect(sanitized).toBe('Some tests failed');
    expect(sanitized).not.toContain('1337');
    expect(sanitized).not.toContain('42');
    expect(sanitized).not.toContain('candidate');
  });

  it('allows compiler errors only if they point within player code lines', () => {
    const rawCompileError = `
prog.cpp:3:15: error: expected ';' before 'return'
    3 |   int x = 10
      |             ^
      |             ;
    4 |   return x;
prog.cpp:45:10: error: invalid conversion in harness main()
`;

    const sanitized = sanitizeOutput({
      verdict: 'compile_error',
      rawOutput: rawCompileError,
      playerCodeLines: 6,
      language: 'cpp'
    });

    expect(sanitized).toContain('Line 3: error: expected \';\' before \'return\'');
    // Error at line 45 is inside harness (line > 6) so it must not be included
    expect(sanitized).not.toContain('Line 45');
    expect(sanitized).not.toContain('in harness main()');
  });

  it('displays Python runtime errors occurring within player code', () => {
    const rawTraceback = `
Traceback (most recent call last):
  File "submission.py", line 4, in solve
    return arr[100]
IndexError: list index out of range
`;

    const sanitized = sanitizeOutput({
      verdict: 'runtime_error',
      rawOutput: rawTraceback,
      playerCodeLines: 5,
      language: 'python'
    });

    expect(sanitized).toContain('Runtime Error at line 4: IndexError: list index out of range');
  });

  it('redacts Python AssertionError in runtime_error to "Some tests failed"', () => {
    const rawTraceback = `
Traceback (most recent call last):
  File "submission.py", line 12, in <module>
    assert solve(10) == 20
AssertionError
`;

    const sanitized = sanitizeOutput({
      verdict: 'runtime_error',
      rawOutput: rawTraceback,
      playerCodeLines: 5,
      language: 'python'
    });

    expect(sanitized).toBe('Some tests failed');
  });

  it('truncates excessively long messages to at most 2000 characters', () => {
    const longMessage = 'prog.cpp:2:1: error: ' + 'A'.repeat(3000);
    const sanitized = sanitizeOutput({
      verdict: 'compile_error',
      rawOutput: longMessage,
      playerCodeLines: 5,
      language: 'cpp'
    });

    expect(sanitized.length).toBeLessThanOrEqual(2020);
    expect(sanitized).toContain('truncated');
  });
});
