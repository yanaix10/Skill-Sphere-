import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { Judge0Runner } from '../src/runner/Judge0Runner.js';

vi.mock('axios');

describe('Judge0Runner Client', () => {
  let mockAxiosInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JUDGE0_LANG_ID_PYTHON = '71';
    process.env.JUDGE0_LANG_ID_CPP = '54';

    mockAxiosInstance = {
      post: vi.fn(),
      get: vi.fn()
    };
    (axios.create as any).mockReturnValue(mockAxiosInstance);
  });

  it('handles successful code execution (status 3 -> passed)', async () => {
    const runner = new Judge0Runner();
    await runner.initialize();

    mockAxiosInstance.post.mockResolvedValueOnce({
      data: { token: 'tok_success' }
    });

    mockAxiosInstance.get.mockResolvedValueOnce({
      data: {
        status: { id: 3, description: 'Accepted' },
        time: '0.045',
        memory: 12000,
        stdout: Buffer.from('hello').toString('base64')
      }
    });

    const result = await runner.run({
      language: 'python',
      source: 'print("hello")',
      playerCodeLines: 1
    });

    expect(result.verdict).toBe('passed');
    expect(result.publicMessage).toBe('All tests passed!');
    expect(result.timeMs).toBe(45);
  });

  it('handles compilation error (status 6 -> compile_error)', async () => {
    const runner = new Judge0Runner();
    await runner.initialize();

    mockAxiosInstance.post.mockResolvedValueOnce({
      data: { token: 'tok_comp_err' }
    });

    const compileErrText = 'prog.cpp:2:1: error: expected identifier';
    mockAxiosInstance.get.mockResolvedValueOnce({
      data: {
        status: { id: 6, description: 'Compilation Error' },
        compile_output: Buffer.from(compileErrText).toString('base64')
      }
    });

    const result = await runner.run({
      language: 'cpp',
      source: 'int main() {',
      playerCodeLines: 3
    });

    expect(result.verdict).toBe('compile_error');
    expect(result.publicMessage).toContain('Line 2: error: expected identifier');
  });

  it('handles execution timeout (status 5 -> timeout)', async () => {
    const runner = new Judge0Runner();
    await runner.initialize();

    mockAxiosInstance.post.mockResolvedValueOnce({
      data: { token: 'tok_timeout' }
    });

    mockAxiosInstance.get.mockResolvedValueOnce({
      data: {
        status: { id: 5, description: 'Time Limit Exceeded' }
      }
    });

    const result = await runner.run({
      language: 'python',
      source: 'while True: pass',
      playerCodeLines: 1
    });

    expect(result.verdict).toBe('timeout');
    expect(result.publicMessage).toBe('Time limit exceeded');
  });

  it('retries on HTTP 5xx errors and returns system_error when exhausted', async () => {
    const runner = new Judge0Runner();
    await runner.initialize();

    const serverError = new Error('500 Internal Server Error');
    (serverError as any).response = { status: 500 };

    mockAxiosInstance.post
      .mockRejectedValueOnce(serverError)
      .mockRejectedValueOnce(serverError)
      .mockRejectedValueOnce(serverError);

    const result = await runner.run({
      language: 'python',
      source: 'x = 1',
      playerCodeLines: 1
    });

    expect(result.verdict).toBe('system_error');
    expect(result.publicMessage).toBe('Judge unavailable, please try again');
    expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });
});
