import { CodeRunner, RunOptions, RunResult } from './types.js';
import { sanitizeOutput } from './sanitizer.js';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execPromise = util.promisify(exec);

export class MockRunner implements CodeRunner {
  constructor() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: MockRunner is strictly prohibited in production (NODE_ENV=production).');
    }
  }

  async initialize(): Promise<void> {
    // No-op for mock runner
  }

  async run(options: RunOptions): Promise<RunResult> {
    const { source, language, playerCodeLines = 0 } = options;

    // Simulate brief latency
    await new Promise((resolve) => setTimeout(resolve, 250));

    // 1. Explicit mock test tokens (used by unit tests)
    if (source.includes('PASS_ME')) {
      return {
        verdict: 'passed',
        timeMs: 45,
        memoryKb: 12400,
        publicMessage: 'All tests passed!'
      };
    }

    if (source.includes('TIMEOUT_ME')) {
      return {
        verdict: 'timeout',
        timeMs: 8000,
        memoryKb: 15200,
        publicMessage: 'Time limit exceeded'
      };
    }

    if (source.includes('COMPILE_ERROR_ME')) {
      return {
        verdict: 'compile_error',
        timeMs: 12,
        memoryKb: 0,
        publicMessage: 'Line 2: error: syntax error'
      };
    }

    if (source.includes('RUNTIME_ERROR_ME')) {
      return {
        verdict: 'runtime_error',
        timeMs: 38,
        memoryKb: 12000,
        publicMessage: 'Runtime Error: division by zero'
      };
    }

    // 2. Real local execution when running without Judge0 in development
    const tmpDir = os.tmpdir();
    const randId = Math.random().toString(36).substring(2, 9);
    const startTime = Date.now();

    if (language === 'python') {
      const tmpFile = path.join(tmpDir, `local_run_${randId}.py`);
      try {
        fs.writeFileSync(tmpFile, source);
        await execPromise(`python3 "${tmpFile}"`, { timeout: 4000 });
        const timeMs = Date.now() - startTime;
        return {
          verdict: 'passed',
          timeMs,
          publicMessage: 'All tests passed!'
        };
      } catch (err: any) {
        const timeMs = Date.now() - startTime;
        const stderr = err.stderr || err.message || '';

        let verdict: any = 'failed';
        if (err.killed || err.signal === 'SIGTERM') {
          verdict = 'timeout';
        } else if (stderr.includes('SyntaxError') || stderr.includes('IndentationError')) {
          verdict = 'compile_error';
        } else if (stderr.includes('AssertionError')) {
          verdict = 'failed';
        } else {
          verdict = 'runtime_error';
        }

        const publicMessage = sanitizeOutput({
          verdict,
          rawOutput: stderr,
          playerCodeLines,
          language: 'python'
        });

        return {
          verdict,
          timeMs,
          publicMessage
        };
      } finally {
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
      }
    }

    if (language === 'cpp') {
      const srcFile = path.join(tmpDir, `local_run_${randId}.cpp`);
      const binFile = path.join(tmpDir, `local_run_${randId}.out`);

      try {
        fs.writeFileSync(srcFile, source);
        // Compile with GCC C++17
        try {
          await execPromise(`g++ -std=c++17 -O2 "${srcFile}" -o "${binFile}"`, { timeout: 6000 });
        } catch (compileErr: any) {
          const publicMessage = sanitizeOutput({
            verdict: 'compile_error',
            rawOutput: compileErr.stderr || compileErr.message,
            playerCodeLines,
            language: 'cpp'
          });
          return {
            verdict: 'compile_error',
            publicMessage
          };
        }

        // Run compiled binary
        await execPromise(`"${binFile}"`, { timeout: 4000 });
        const timeMs = Date.now() - startTime;
        return {
          verdict: 'passed',
          timeMs,
          publicMessage: 'All tests passed!'
        };
      } catch (runErr: any) {
        const timeMs = Date.now() - startTime;
        const stderr = runErr.stderr || runErr.message || '';
        let verdict: any = 'failed';
        if (runErr.killed || runErr.signal === 'SIGTERM') {
          verdict = 'timeout';
        } else if (stderr.includes('Assertion') || stderr.includes('assert')) {
          verdict = 'failed';
        } else {
          verdict = 'runtime_error';
        }

        const publicMessage = sanitizeOutput({
          verdict,
          rawOutput: stderr,
          playerCodeLines,
          language: 'cpp'
        });

        return {
          verdict,
          timeMs,
          publicMessage
        };
      } finally {
        if (fs.existsSync(srcFile)) fs.unlinkSync(srcFile);
        if (fs.existsSync(binFile)) fs.unlinkSync(binFile);
      }
    }

    return {
      verdict: 'failed',
      timeMs: 62,
      memoryKb: 12800,
      publicMessage: 'Some tests failed'
    };
  }
}
