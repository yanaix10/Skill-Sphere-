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

export function selectMatchQuestions(options: {
  languages: string[];
  count?: number;
  recentQuestionIds?: Set<string>;
  allQuestions?: MatchQuestion[];
}): MatchQuestion[] {
  const { languages, count = 8, recentQuestionIds = new Set(), allQuestions = loadAllQuestions() } = options;

  // 1. Filter enabled and available for all requested languages
  let available = allQuestions.filter((q) => {
    if (!q.enabled) return false;
    for (const lang of languages) {
      if (!q.variants || !q.variants[lang]) return false;
    }
    return true;
  });

  // Fallback: If requested languages are not supported in the question bank, fallback to python & cpp
  if (available.length < count) {
    const fallbackLangs = ['python', 'cpp'];
    available = allQuestions.filter((q) => {
      if (!q.enabled) return false;
      return Boolean(q.variants?.python && q.variants?.cpp);
    });
  }

  // Last-resort fallback: any enabled questions
  if (available.length < count) {
    available = allQuestions.filter((q) => q.enabled);
  }

  if (available.length < count) {
    throw new Error(`Insufficient enabled questions (${available.length}) in bank. Required: ${count}`);
  }

  // 2. Separate by recent history (prioritize unseen questions)
  const unseen = available.filter((q) => !recentQuestionIds.has(q.id));
  const pool = unseen.length >= count ? unseen : available;

  // 3. Partition by difficulty
  const easyPool = pool.filter((q) => q.estMinutes <= 2);
  const medPool = pool.filter((q) => q.estMinutes === 3);
  const hardPool = pool.filter((q) => q.estMinutes >= 4);

  // Difficulty target counts for N:
  // e.g. for N=8: 2 easy, 5 medium, 1 hard
  const easyTarget = Math.max(1, Math.round(count * 0.25));
  const hardTarget = Math.max(1, Math.round(count * 0.125));
  const medTarget = count - easyTarget - hardTarget;

  const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

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
