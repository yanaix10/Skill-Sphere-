import axios, { AxiosInstance } from 'axios';
import { CodeRunner, RunOptions, RunResult, Verdict } from './types.js';
import { getLanguageAdapter } from './adapters.js';
import { sanitizeOutput } from './sanitizer.js';
import { MockRunner } from './MockRunner.js';

export class Judge0Runner implements CodeRunner {
  private baseUrl: string;
  private client: AxiosInstance;
  private languageIds: Map<string, number> = new Map();
  private maxConcurrency: number;
  private activeJobs = 0;
  private queue: Array<() => void> = [];

  constructor() {
    this.baseUrl = (process.env.JUDGE0_URL || 'http://localhost:2358').replace(/\/+$/, '');
    this.maxConcurrency = parseInt(process.env.JUDGE0_MAX_CONCURRENCY || '4', 10);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (process.env.JUDGE0_AUTH_HEADER && process.env.JUDGE0_AUTH_TOKEN) {
      headers[process.env.JUDGE0_AUTH_HEADER] = process.env.JUDGE0_AUTH_TOKEN;
    }

    if (process.env.JUDGE0_API_KEY) {
      headers['X-RapidAPI-Key'] = process.env.JUDGE0_API_KEY;
      headers['X-RapidAPI-Host'] = process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com';
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers,
      timeout: 20000
    });

    // Populate standard Judge0 CE default language IDs
    this.languageIds.set('python', parseInt(process.env.JUDGE0_LANG_ID_PYTHON || '71', 10));
    this.languageIds.set('cpp', parseInt(process.env.JUDGE0_LANG_ID_CPP || '54', 10));
    this.languageIds.set('javascript', parseInt(process.env.JUDGE0_LANG_ID_JAVASCRIPT || '63', 10));
    this.languageIds.set('java', parseInt(process.env.JUDGE0_LANG_ID_JAVA || '62', 10));
  }

  private fallbackRunner: MockRunner | null = null;

  async initialize(): Promise<void> {
    // Check for explicit environment overrides first
    if (process.env.JUDGE0_LANG_ID_PYTHON) {
      this.languageIds.set('python', parseInt(process.env.JUDGE0_LANG_ID_PYTHON, 10));
    }
    if (process.env.JUDGE0_LANG_ID_CPP) {
      this.languageIds.set('cpp', parseInt(process.env.JUDGE0_LANG_ID_CPP, 10));
    }
    if (process.env.JUDGE0_LANG_ID_JAVASCRIPT) {
      this.languageIds.set('javascript', parseInt(process.env.JUDGE0_LANG_ID_JAVASCRIPT, 10));
    }
    if (process.env.JUDGE0_LANG_ID_JAVA) {
      this.languageIds.set('java', parseInt(process.env.JUDGE0_LANG_ID_JAVA, 10));
    }

    // Default fallback standard Judge0 CE IDs
    if (!this.languageIds.has('python')) this.languageIds.set('python', 71);
    if (!this.languageIds.has('cpp')) this.languageIds.set('cpp', 54);
    if (!this.languageIds.has('javascript')) this.languageIds.set('javascript', 63);
    if (!this.languageIds.has('java')) this.languageIds.set('java', 62);

    try {
      const resp = await this.client.get('/languages', { timeout: 4000 });
      const languages: Array<{ id: number; name: string }> = resp.data;

      if (Array.isArray(languages)) {
        const pythonMatch = languages.find(l => /Python \(3\./i.test(l.name));
        if (pythonMatch) this.languageIds.set('python', pythonMatch.id);

        const cppMatches = languages.filter(l => /C\+\+ \(GCC/i.test(l.name)).sort((a, b) => b.name.localeCompare(a.name));
        if (cppMatches.length > 0) this.languageIds.set('cpp', cppMatches[0].id);

        const jsMatch = languages.find(l => /JavaScript \(Node\.js/i.test(l.name));
        if (jsMatch) this.languageIds.set('javascript', jsMatch.id);

        const javaMatch = languages.find(l => /Java \(/i.test(l.name));
        if (javaMatch) this.languageIds.set('java', javaMatch.id);
      }
    } catch (err: any) {
      console.warn(`Judge0 endpoint ${this.baseUrl} not responding (${err.message}). Using standard IDs with local execution fallback.`);
    }
  }

  private async acquireConcurrencySlot(): Promise<void> {
    if (this.activeJobs < this.maxConcurrency) {
      this.activeJobs++;
      return;
    }
    await new Promise<void>((resolve) => this.queue.push(resolve));
    this.activeJobs++;
  }

  private releaseConcurrencySlot(): void {
    this.activeJobs--;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    }
  }

  async run(options: RunOptions): Promise<RunResult> {
    const { language, source, playerCodeLines = 0, limits } = options;
    const adapter = getLanguageAdapter(language);
    const languageId = this.languageIds.get(adapter.id);

    if (!languageId) {
      console.warn(`Language ID missing for ${language}. Falling back to local runner.`);
      const fallback = new MockRunner();
      return await fallback.run(options);
    }

    const cpuLimit = limits?.cpuTimeSec ?? parseFloat(process.env.RUN_CPU_LIMIT_SEC || '3');
    const wallLimit = limits?.wallTimeSec ?? parseFloat(process.env.RUN_WALL_LIMIT_SEC || '8');
    const memoryMb = limits?.memoryMb ?? parseInt(process.env.RUN_MEMORY_LIMIT_MB || '256', 10);

    const base64Source = Buffer.from(source, 'utf-8').toString('base64');

    let result: RunResult;
    await this.acquireConcurrencySlot();
    try {
      result = await this.executeWithRetry(languageId, base64Source, adapter.compilerOptions, cpuLimit, wallLimit, memoryMb, playerCodeLines, language);
    } catch (err: any) {
      result = { verdict: 'system_error', publicMessage: err.message };
    } finally {
      this.releaseConcurrencySlot();
    }

    if (result.verdict === 'system_error') {
      console.warn(`Judge0 returned system_error (${result.publicMessage}). Using local execution runner fallback.`);
      const fallback = new MockRunner();
      return await fallback.run(options);
    }

    return result;
  }

  private async executeWithRetry(
    languageId: number,
    base64Source: string,
    compilerOptions: string | undefined,
    cpuLimit: number,
    wallLimit: number,
    memoryMb: number,
    playerCodeLines: number,
    language: string,
    retries = 2
  ): Promise<RunResult> {
    let lastError: any = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // 1. Submit
        const submitResp = await this.client.post('/submissions?base64_encoded=true', {
          source_code: base64Source,
          language_id: languageId,
          cpu_time_limit: cpuLimit,
          wall_time_limit: wallLimit,
          memory_limit: memoryMb * 1024,
          max_file_size: 256000,
          compiler_options: compilerOptions
        });

        const token = submitResp.data?.token;
        if (!token) {
          throw new Error('Judge0 submission did not return a tracking token.');
        }

        // 2. Poll result
        return await this.pollSubmission(token, playerCodeLines, language);
      } catch (err: any) {
        lastError = err;
        const status = err.response?.status;
        const isTransient = !status || status >= 500 || status === 429;

        if (isTransient && attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        break;
      }
    }

    return {
      verdict: 'system_error',
      publicMessage: 'Judge unavailable, please try again'
    };
  }

  private async pollSubmission(token: string, playerCodeLines: number, language: string): Promise<RunResult> {
    const startTime = Date.now();
    const timeoutMs = 18000;
    let delayMs = 250;

    while (Date.now() - startTime < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs = Math.min(delayMs * 1.4, 1500);

      const resp = await this.client.get(`/submissions/${token}?base64_encoded=true`);
      const data = resp.data;
      const statusId = data.status?.id;

      // Status 1 = In Queue, 2 = Processing
      if (statusId === 1 || statusId === 2) {
        continue;
      }

      // Parse output strings from base64
      const decodeBase64 = (val?: string) => (val ? Buffer.from(val, 'base64').toString('utf-8') : '');
      const stdout = decodeBase64(data.stdout);
      const stderr = decodeBase64(data.stderr);
      const compileOutput = decodeBase64(data.compile_output);
      const rawMessage = decodeBase64(data.message);

      const combinedDiagnostics = [compileOutput, stderr, rawMessage, stdout].filter(Boolean).join('\n');
      const timeMs = data.time ? Math.round(parseFloat(data.time) * 1000) : undefined;
      const memoryKb = data.memory ? Math.round(data.memory) : undefined;

      let verdict: Verdict;
      switch (statusId) {
        case 3: // Accepted
          verdict = 'passed';
          break;
        case 4: // Wrong Answer
          verdict = 'failed';
          break;
        case 5: // Time Limit Exceeded
          verdict = 'timeout';
          break;
        case 6: // Compilation Error
          verdict = 'compile_error';
          break;
        case 7: // Runtime Error (SIGSEGV)
        case 8: // Runtime Error (SIGXFSZ)
        case 9: // Runtime Error (SIGFPE)
        case 10: // Runtime Error (SIGABRT)
        case 11: // Runtime Error (NZEC)
        case 12: // Runtime Error (Other)
          verdict = 'runtime_error';
          break;
        default:
          verdict = 'system_error';
          break;
      }

      const publicMessage = sanitizeOutput({
        verdict,
        rawOutput: combinedDiagnostics,
        playerCodeLines,
        language
      });

      return {
        verdict,
        timeMs,
        memoryKb,
        publicMessage
      };
    }

    return {
      verdict: 'timeout',
      publicMessage: 'Time limit exceeded'
    };
  }
}
