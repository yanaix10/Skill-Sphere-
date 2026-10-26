import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import DsaQuestion from '../models/DsaQuestion.js';
import { connectDB } from '../config/db.js';

async function seed() {
  console.log('🌱 Loading questions from questions.json into database...');

  const filePath = path.resolve(process.cwd(), 'backend/data/questions.json');
  const alternatePath = path.resolve(process.cwd(), 'data/questions.json');
  const activePath = fs.existsSync(filePath) ? filePath : alternatePath;

  if (!fs.existsSync(activePath)) {
    console.error(`❌ Could not locate questions.json at ${activePath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(activePath, 'utf-8');
  const questions: any[] = JSON.parse(raw);

  console.log(`Found ${questions.length} questions in ${activePath}`);

  await connectDB();

  let count = 0;
  for (const q of questions) {
    const taskIdMatch = q.id.match(/\d+/);
    const taskId = taskIdMatch ? parseInt(taskIdMatch[0], 10) : undefined;

    const languages: Record<string, any> = {};
    if (q.variants) {
      for (const [lang, v] of Object.entries(q.variants as Record<string, any>)) {
        languages[lang] = {
          starterCode: v.starterCode,
          sampleTests: v.example,
          testSuite: v.harness
        };
      }
    }

    const doc = {
      taskId,
      name: q.id,
      title: q.title,
      description: q.statement,
      difficulty: q.estMinutes <= 2 ? 'EASY' : q.estMinutes === 3 ? 'MEDIUM' : 'HARD',
      category: q.tags?.[0] ? q.tags[0].toUpperCase() : 'ALGORITHMS',
      points: q.estMinutes * 10,
      languages,
      initialCode: {
        python: q.variants?.python?.starterCode || '',
        cpp: q.variants?.cpp?.starterCode || ''
      },
      testCases: []
    };

    try {
      await DsaQuestion.findOneAndUpdate(
        { $or: [{ name: q.id }, { taskId: doc.taskId }] },
        { $set: doc },
        { upsert: true }
      );
      count++;
    } catch (err: any) {
      console.warn(`Could not upsert ${q.id}:`, err.message);
    }
  }

  console.log(`✅ Successfully seeded/synced ${count} questions into MongoDB.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
