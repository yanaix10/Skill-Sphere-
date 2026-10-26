import { LanguageAdapter, LanguageVariant } from './types.js';

export const MAX_CODE_BYTES = 20000;

export const pythonAdapter: LanguageAdapter = {
  id: 'python',
  displayName: 'Python 3',
  editorMode: 'python',
  judge0NamePattern: /Python \(3\./i,
  buildStarter(variant: LanguageVariant): string {
    return variant.starterCode;
  },
  buildProgram(playerCode: string, variant: LanguageVariant): string {
    return `${playerCode.trimEnd()}\n\n${variant.harness.trimStart()}`;
  }
};

export const cppAdapter: LanguageAdapter = {
  id: 'cpp',
  displayName: 'C++ (GCC)',
  editorMode: 'cpp',
  judge0NamePattern: /C\+\+ \(GCC/i,
  compilerOptions: '-O2 -std=c++17',
  buildStarter(variant: LanguageVariant): string {
    return variant.starterCode;
  },
  buildProgram(playerCode: string, variant: LanguageVariant): string {
    return `${playerCode.trimEnd()}\n\n${variant.harness.trimStart()}`;
  }
};

export const languageAdapters: Record<string, LanguageAdapter> = {
  python: pythonAdapter,
  cpp: cppAdapter
};

export function getLanguageAdapter(lang: string): LanguageAdapter {
  const normalized = lang.toLowerCase().trim();
  const adapter = languageAdapters[normalized];
  if (!adapter) {
    throw new Error(`Unsupported programming language: "${lang}". Supported: ${Object.keys(languageAdapters).join(', ')}`);
  }
  return adapter;
}
