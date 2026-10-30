import { CodeRunner } from './types.js';
import { Judge0Runner } from './Judge0Runner.js';
import { MockRunner } from './MockRunner.js';

export * from './types.js';
export * from './adapters.js';
export * from './sanitizer.js';
export * from './MockRunner.js';
export * from './Judge0Runner.js';

let runnerInstance: CodeRunner | null = null;

export function getCodeRunner(): CodeRunner {
  if (runnerInstance) {
    return runnerInstance;
  }

  const runnerType = (process.env.RUNNER || 'judge0').toLowerCase().trim();

  if (runnerType === 'mock') {
    runnerInstance = new MockRunner();
  } else {
    // Default to Judge0 runner with automatic local fallback
    runnerInstance = new Judge0Runner();
  }

  return runnerInstance;
}
