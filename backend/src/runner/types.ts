export type Verdict =
  | 'passed'
  | 'failed'
  | 'compile_error'
  | 'timeout'
  | 'runtime_error'
  | 'system_error';

export interface RunResult {
  verdict: Verdict;
  timeMs?: number;
  memoryKb?: number;
  publicMessage: string;
}

export interface RunLimits {
  cpuTimeSec?: number;
  wallTimeSec?: number;
  memoryMb?: number;
}

export interface RunOptions {
  language: string;
  source: string;
  playerCodeLines?: number;
  limits?: RunLimits;
}

export interface CodeRunner {
  run(options: RunOptions): Promise<RunResult>;
  initialize?(): Promise<void>;
}

export interface LanguageVariant {
  starterCode: string;
  harness: string;
  example: string;
}

export interface LanguageAdapter {
  id: string; // 'python' | 'cpp'
  displayName: string;
  editorMode: string;
  judge0NamePattern: RegExp;
  compilerOptions?: string;
  buildStarter(variant: LanguageVariant): string;
  buildProgram(playerCode: string, variant: LanguageVariant): string;
}
