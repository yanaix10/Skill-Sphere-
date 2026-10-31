import fs from 'fs';
import path from 'path';
import { MatchQuestion, PublicMatchQuestion } from './types.js';

let cachedQuestions: MatchQuestion[] | null = null;

export function loadAllQuestions(): MatchQuestion[] {
  if (cachedQuestions) {
    return cachedQuestions;
  }

  const possiblePaths = [
    path.resolve(process.cwd(), 'backend/data/questions.json'),
    path.resolve(process.cwd(), 'data/questions.json'),
    path.resolve(process.cwd(), 'server/data/questions.json')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf-8');
        cachedQuestions = JSON.parse(raw);
        return cachedQuestions!;
      } catch (err: any) {
        console.error(`Error reading questions from ${p}:`, err.message);
      }
    }
  }

  console.warn('⚠️ questions.json not found on disk, returning empty list.');
  return [];
}

let cachedWebdevQuestions: MatchQuestion[] | null = null;

export function loadWebdevQuestions(): MatchQuestion[] {
  if (cachedWebdevQuestions) {
    return cachedWebdevQuestions;
  }

  const possiblePaths = [
    path.resolve(process.cwd(), 'backend/data/challenge_questions.json'),
    path.resolve(process.cwd(), 'data/challenge_questions.json'),
    path.resolve(process.cwd(), 'server/data/challenge_questions.json')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf-8');
        const items = JSON.parse(raw);
        const webdevItems = items.filter((q: any) =>
          q.challengeCategory === 'webdev' &&
          q.executionEngine !== 'sandpack' &&
          q.subCategory !== 'react' &&
          q.testSuite &&
          !q.testSuite.trim().startsWith('//')
        );
        cachedWebdevQuestions = webdevItems.map((q: any) => {
          const isTs = q.subCategory === 'ts' || (q.tags && q.tags.includes('typescript')) || q.executionEngine === 'ts-compiler';
          const starter = q.starterCode || (isTs ? `type Solution = any;` : `function solution() {\n  // Write your code here\n}`);
          const suite = q.testSuite || '';
          const langKey = isTs ? 'typescript' : 'javascript';

          let harness = '';
          if (isTs) {
            const cleanSuite = suite
              .replace(/import\s+type\s*\{[^}]*\}\s*from\s*['"]@type-challenges\/utils['"];?/g, '')
              .trim();
            harness = `
type Expect<T extends true> = T;
type ExpectTrue<T extends true> = T;
type ExpectFalse<T extends false> = T;
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? true : false;
type NotEqual<X, Y> = true extends Equal<X, Y> ? false : true;

${cleanSuite}
`;
          } else {
            harness = `
function expect(actual) {
  return {
    to: {
      equal: (expected) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error("AssertionError: Expected " + JSON.stringify(expected) + " but got " + JSON.stringify(actual));
        }
      },
      deep: {
        equal: (expected) => {
          if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error("AssertionError: Expected " + JSON.stringify(expected) + " but got " + JSON.stringify(actual));
          }
        }
      },
      be: {
        true: () => { if (actual !== true) throw new Error("AssertionError: Expected true but got " + actual); },
        false: () => { if (actual !== false) throw new Error("AssertionError: Expected false but got " + actual); }
      }
    }
  };
}
function assert(condition, message) {
  if (!condition) throw new Error(message || "AssertionError: assertion failed");
}
try {
  ${suite}
  console.log("All tests passed!");
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
`;
          }

          return {
            id: q.id,
            title: q.title,
            statement: q.description,
            estMinutes: q.difficultyLevel === 1 ? 2 : q.difficultyLevel === 2 ? 3 : 4,
            tags: q.tags || (isTs ? ['webdev', 'typescript'] : ['webdev', 'javascript']),
            enabled: true,
            variants: {
              [langKey]: {
                starterCode: starter,
                harness: harness,
                example: q.sampleTests || ''
              }
            }
          };
        });
        return cachedWebdevQuestions!;
      } catch (err: any) {
        console.error(`Error reading webdev questions from ${p}:`, err.message);
      }
    }
  }

  return [];
}

export function selectMatchQuestions(options: {
  languages: string[];
  count?: number;
  recentQuestionIds?: Set<string>;
  allQuestions?: MatchQuestion[];
  gameMode?: string;
}): MatchQuestion[] {
  const isWebDev = options.gameMode === 'webdev_arena';
  const allQuestions = options.allQuestions || (isWebDev ? loadWebdevQuestions() : loadAllQuestions());
  const languages = isWebDev ? ['javascript', 'typescript'] : options.languages;
  const count = options.count || 8;
  const recentQuestionIds = options.recentQuestionIds || new Set();

  // 1. Filter enabled and available for all requested languages
  let available = allQuestions.filter((q) => {
    if (!q.enabled) return false;
    if (isWebDev) return true;
    for (const lang of languages) {
      if (!q.variants || !q.variants[lang]) return false;
    }
    return true;
  });

  // Fallback if requested languages are not available
  if (available.length === 0) {
    available = isWebDev ? loadWebdevQuestions() : loadAllQuestions().filter((q) => q.enabled);
  }

  if (available.length === 0) {
    throw new Error(`Insufficient enabled questions in bank.`);
  }

  const effectiveCount = Math.min(count, available.length);
  const unseen = available.filter((q) => !recentQuestionIds.has(q.id));
  const pool = unseen.length >= effectiveCount ? unseen : available;
  const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

  if (isWebDev) {
    return shuffle(pool).slice(0, effectiveCount);
  }

  // 2. Partition by difficulty
  const easyPool = pool.filter((q) => q.estMinutes <= 2);
  const medPool = pool.filter((q) => q.estMinutes === 3);
  const hardPool = pool.filter((q) => q.estMinutes >= 4);

  // Difficulty target counts for N:
  // e.g. for N=8: 2 easy, 5 medium, 1 hard
  const easyTarget = Math.max(1, Math.round(count * 0.25));
  const hardTarget = Math.max(1, Math.round(count * 0.125));
  const medTarget = count - easyTarget - hardTarget;
  const selectedEasy = shuffle(easyPool).slice(0, easyTarget);
  const selectedMed = shuffle(medPool).slice(0, medTarget);
  const selectedHard = shuffle(hardPool).slice(0, hardTarget);

  let selected = [...selectedEasy, ...selectedMed, ...selectedHard];

  // Fill up if any category didn't have enough
  if (selected.length < count) {
    const selectedIds = new Set(selected.map((q) => q.id));
    const remainder = shuffle(pool.filter((q) => !selectedIds.has(q.id)));
    selected.push(...remainder.slice(0, count - selected.length));
  }

  // 4. Arrange in a progressive difficulty ramp and avoid duplicate consecutive tags
  selected.sort((a, b) => a.estMinutes - b.estMinutes);

  // Tag smoothing: avoid consecutive same primary tag
  for (let i = 1; i < selected.length - 1; i++) {
    const prevTag = selected[i - 1].tags[0];
    const currTag = selected[i].tags[0];
    if (prevTag && currTag && prevTag === currTag) {
      // Find a subsequent question with similar estMinutes but different tag
      const swapIdx = selected.findIndex(
        (q, idx) => idx > i && Math.abs(q.estMinutes - selected[i].estMinutes) <= 1 && q.tags[0] !== prevTag
      );
      if (swapIdx !== -1) {
        const temp = selected[i];
        selected[i] = selected[swapIdx];
        selected[swapIdx] = temp;
      }
    }
  }

  return selected.slice(0, count);
}

export function sanitizeQuestionForClient(q: MatchQuestion): any {
  const languages: Record<string, { starterCode: string; example: string; sampleTests: string }> = {};

  for (const [lang, variant] of Object.entries(q.variants)) {
    languages[lang] = {
      starterCode: variant.starterCode,
      example: variant.example,
      sampleTests: variant.example
    };
  }

  const difficulty = q.estMinutes <= 2 ? 'EASY' : q.estMinutes === 3 ? 'MEDIUM' : 'HARD';
  const category = q.tags[0] ? q.tags[0].toUpperCase() : 'ALGORITHMS';

  return {
    id: q.id,
    title: q.title,
    statement: q.statement,
    description: q.statement,
    difficulty,
    category,
    tags: q.tags,
    estMinutes: q.estMinutes,
    languages
  };
}
