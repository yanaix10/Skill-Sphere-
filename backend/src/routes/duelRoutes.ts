import express, { Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getCodeRunner } from '../runner/index.js';

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
 * Returns all public questions for sandboxing and offline practice.
 */
router.get('/questions', async (_req: Request, res: Response): Promise<any> => {
  try {
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
    return res.json({ success: true, questions });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/webdev/challenges (and /api/duel/webdev/challenges)
 * Returns curated WebDev challenges from challenge_questions.json
 */
router.get('/webdev/challenges', async (_req: Request, res: Response): Promise<any> => {
  try {
    const possiblePaths = [
      path.resolve(process.cwd(), 'backend/data/challenge_questions.json'),
      path.resolve(process.cwd(), 'data/challenge_questions.json')
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        const allQuestions = JSON.parse(raw);
        const webdevQuestions = allQuestions.filter((q: any) => q.challengeCategory === 'webdev');
        return res.json({ success: true, count: webdevQuestions.length, challenges: webdevQuestions });
      }
    }

    return res.json({ success: true, count: 0, challenges: [] });
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
