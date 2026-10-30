import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import DsaQuestion from '../models/DsaQuestion.js';
import { connectDB } from '../config/db.js';
import { challengeQuestions } from '../data/challengeQuestions.js';

async function seed() {
  console.log('🚀 Starting Unified 1v1 Challenge Questions Seeder...');
  console.log(`📦 Loaded ${challengeQuestions.length} curated questions across DSA & WebDev.`);

  // Export JSON file for raw data inspection
  const jsonDir = fs.existsSync(path.resolve(process.cwd(), 'data'))
    ? path.resolve(process.cwd(), 'data')
    : path.resolve(process.cwd(), 'backend/data');
  const jsonPath = path.resolve(jsonDir, 'challenge_questions.json');
  fs.writeFileSync(jsonPath, JSON.stringify(challengeQuestions, null, 2), 'utf-8');
  console.log(`📁 Saved raw JSON export to ${jsonPath}`);

  // Connect to Database
  await connectDB();

  let upsertedCount = 0;
  const stats = {
    category: { dsa: 0, webdev: 0 },
    subCategory: { js: 0, ts: 0, react: 0, algo: 0, bugfix: 0 },
    difficultyLevel: { 1: 0, 2: 0, 3: 0 },
    executionEngine: { judge0: 0, sandpack: 0, 'in-browser-eval': 0, 'ts-compiler': 0 }
  };

  for (const q of challengeQuestions) {
    const doc = {
      name: q.id,
      title: q.title,
      description: q.description,
      challengeCategory: q.challengeCategory,
      subCategory: q.subCategory,
      difficultyLevel: q.difficultyLevel,
      difficulty: q.difficulty,
      tags: q.tags,
      source: q.source,
      executionEngine: q.executionEngine,
      starterCode: q.starterCode,
      solution: q.solution,
      testSuite: q.testSuite,
      sampleTests: q.sampleTests || '',
      category: q.challengeCategory.toUpperCase(),
      points: q.points,
      enabled: true,
      languages: q.languages || {
        javascript: {
          starterCode: q.starterCode,
          testSuite: q.testSuite,
          solution: q.solution,
          sampleTests: q.sampleTests || ''
        }
      },
      initialCode: {
        javascript: q.starterCode,
        typescript: q.starterCode,
        python: q.languages?.python?.starterCode || q.starterCode,
        cpp: q.languages?.cpp?.starterCode || ''
      },
      testCases: []
    };

    try {
      await DsaQuestion.findOneAndUpdate(
        { name: q.id },
        { $set: doc },
        { upsert: true, new: true }
      );
      upsertedCount++;

      // Stats
      stats.category[q.challengeCategory] = (stats.category[q.challengeCategory] || 0) + 1;
      stats.subCategory[q.subCategory] = (stats.subCategory[q.subCategory] || 0) + 1;
      stats.difficultyLevel[q.difficultyLevel] = (stats.difficultyLevel[q.difficultyLevel] || 0) + 1;
      stats.executionEngine[q.executionEngine] = (stats.executionEngine[q.executionEngine] || 0) + 1;
    } catch (err: any) {
      console.error(`❌ Failed to upsert ${q.id}:`, err.message);
    }
  }

  console.log('\n======================================================');
  console.log(`✅ SUCCESS: Seeded ${upsertedCount} questions into MongoDB!`);
  console.log('======================================================');
  console.log('📊 Category Breakdown:', stats.category);
  console.log('🎯 SubCategory Breakdown:', stats.subCategory);
  console.log('⏱️ Difficulty Level Breakdown (1=1m, 2=2m, 3=3-4m):', stats.difficultyLevel);
  console.log('⚡ Execution Engines:', stats.executionEngine);
  console.log('======================================================\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Fatal Seeder Error:', err);
  process.exit(1);
});
