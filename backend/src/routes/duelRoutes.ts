import express, { Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getCodeRunner } from '../runner/index.js';
import DsaQuestion from '../models/DsaQuestion.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'skillsphere-coding-duel-secret-2026';

const guestSchema = z.object({
  nickname: z.string().trim().min(1, 'Nickname cannot be empty').max(30, 'Nickname too long')
});

/**
 * POST /api/guest (and /api/duel/guest)
 * Registers a guest player and returns a signed token.
 */
router.post('/guest', (req: Request, res: Response): any => {
  try {
    const parseRes = guestSchema.safeParse(req.body);
    if (!parseRes.success) {
      return res.status(400).json({
        success: false,
        message: parseRes.error.issues[0]?.message || 'Invalid nickname'
      });
    }

    const { nickname } = parseRes.data;
    const playerId = `guest_${crypto.randomBytes(4).toString('hex')}`;
    const token = jwt.sign(
      {
        playerId,
        nickname
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      playerId,
      token,
      nickname
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/languages (and /api/duel/languages)
 * Returns the list of supported languages for Coding Duel.
 */
router.get('/languages', (_req: Request, res: Response) => {
  return res.json({
    languages: [
      {
        id: 'python',
        displayName: 'Python 3',
        editorMode: 'python',
        version: '3.10'
      },
      {
        id: 'cpp',
        displayName: 'C++ (GCC)',
        editorMode: 'cpp',
        version: 'C++17'
      },
      {
        id: 'javascript',
        displayName: 'JavaScript (Node.js)',
        editorMode: 'javascript',
        version: 'v20+'
      },
      {
        id: 'java',
        displayName: 'Java (OpenJDK)',
        editorMode: 'java',
        version: '17'
      }
    ]
  });
});

/**
 * GET /api/duel/questions
 * Returns all public questions directly from the MongoDB database with boilerplate starter code only.
 */
router.get('/questions', async (_req: Request, res: Response): Promise<any> => {
  try {
    let dbQuestions = await DsaQuestion.find({ enabled: { $ne: false } }).lean();

    if (dbQuestions && dbQuestions.length > 0) {
      const questions = dbQuestions.map((q: any) => {
        const variants: Record<string, { starterCode: string; example?: string }> = {};
        const supportedLangs = ['python', 'cpp', 'javascript', 'java'];

        for (const lang of supportedLangs) {
          const spec = q.languages?.[lang] || (q.languages instanceof Map ? q.languages.get(lang) : undefined);
          const starter = spec?.starterCode || q.initialCode?.[lang] || '';
          if (starter) {
            variants[lang] = {
              starterCode: starter,
              example: spec?.sampleTests || spec?.example || ''
            };
          }
        }

        return {
          id: String(q._id || q.taskId || q.id),
          title: q.title || q.name,
          statement: q.description || q.statement,
          difficulty: q.difficulty || 'MEDIUM',
          tags: q.tags || ['algorithms'],
          category: q.category || 'Algorithms',
          variants
        };
      });

      return res.json({ success: true, count: questions.length, questions });
    }

    // Fallback if database is empty or not yet seeded
    const { loadAllQuestions } = await import('../match/questionSelector.js');
    const all = loadAllQuestions().filter((q) => q.enabled);
    const questions = all.map((q) => ({
      id: q.id,
      title: q.title,
      statement: q.statement,
      difficulty: (q as any).difficulty || 'MEDIUM',
      tags: q.tags,
      category: (q as any).challengeCategory || 'dsa',
      variants: Object.fromEntries(
        Object.entries(q.variants || {}).map(([lang, v]) => [
          lang,
          {
            starterCode: v.starterCode,
            example: v.example
          }
        ])
      )
    }));
    return res.json({ success: true, count: questions.length, questions });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/health (and /api/duel/health)
 * Reports system health and runner connectivity.
 */
router.get('/health', async (_req: Request, res: Response) => {
  const runnerType = (process.env.RUNNER || 'mock').toLowerCase().trim();
  let runnerReachable = true;

  try {
    const runner = getCodeRunner();
    if (runner.initialize) {
      await runner.initialize();
    }
  } catch (err) {
    runnerReachable = false;
  }

  return res.json({
    status: 'healthy',
    runner: {
      type: runnerType,
      reachable: runnerReachable
    },
    timestamp: Date.now()
  });
});

export default router;
