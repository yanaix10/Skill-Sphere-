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

  const runnerType = (process.env.RUNNER || 'mock').toLowerCase().trim();

  if (runnerType === 'judge0') {
    runnerInstance = new Judge0Runner();
  } else {
    runnerInstance = new MockRunner();
  }

  return runnerInstance;
}
