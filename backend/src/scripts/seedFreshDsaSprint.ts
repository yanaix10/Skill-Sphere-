import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import DsaQuestion from '../models/DsaQuestion.js';
import { connectDB } from '../config/db.js';
import { freshDsaSprintQuestions } from '../data/dsaSprintFreshQuestions.js';

async function seedFresh() {
  console.log('⚡ Starting Fresh DSA Sprint Questions Seeder...');
  console.log(`📦 Loaded ${freshDsaSprintQuestions.length} curated multi-language questions.`);

  // Connect to MongoDB Atlas
  await connectDB();

  // 1. Wipe out previous questions cleanly as requested
  console.log('🗑️ Removing previous questions from MongoDB dsaquestions collection...');
  const deleted = await DsaQuestion.deleteMany({});
  console.log(`✅ Cleared ${deleted.deletedCount} existing questions from MongoDB.`);

  // 2. Prepare questions for JSON export and MongoDB insert
  const formattedForMatch = freshDsaSprintQuestions.map((q) => ({
    id: q.id,
    title: q.title,
    statement: q.statement,
    tags: q.tags,
    refLines: q.refLines,
    estMinutes: q.estMinutes,
    enabled: true,
    flagReason: null,
    variants: q.variants
  }));

  // Save to backend/data/questions.json
  const possiblePaths = [
    path.resolve(process.cwd(), 'backend/data/questions.json'),
    path.resolve(process.cwd(), 'data/questions.json')
  ];

  for (const p of possiblePaths) {
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(p, JSON.stringify(formattedForMatch, null, 2), 'utf-8');
    console.log(`📁 Wrote ${formattedForMatch.length} questions to ${p}`);
  }

  // 3. Seed into MongoDB Atlas
  for (const q of freshDsaSprintQuestions) {
    const doc = {
      name: q.id,
      title: q.title,
      description: q.statement,
      challengeCategory: q.challengeCategory,
      subCategory: q.subCategory,
      difficultyLevel: q.difficultyLevel,
      difficulty: q.difficulty,
      tags: q.tags,
      source: q.source,
      executionEngine: q.executionEngine,
      category: 'DSA',
      points: 100,
      enabled: true,
      starterCode: q.variants.python.starterCode,
      solution: '',
      testSuite: q.variants.python.harness,
      sampleTests: q.variants.python.example,
      languages: {
        python: {
          starterCode: q.variants.python.starterCode,
          sampleTests: q.variants.python.example,
          testSuite: q.variants.python.harness
        },
        cpp: {
          starterCode: q.variants.cpp.starterCode,
          sampleTests: q.variants.cpp.example,
          testSuite: q.variants.cpp.harness
        },
        javascript: {
          starterCode: q.variants.javascript.starterCode,
          sampleTests: q.variants.javascript.example,
          testSuite: q.variants.javascript.harness
        },
        java: {
          starterCode: q.variants.java.starterCode,
          sampleTests: q.variants.java.example,
          testSuite: q.variants.java.harness
        }
      },
      initialCode: {
        python: q.variants.python.starterCode,
        cpp: q.variants.cpp.starterCode,
        javascript: q.variants.javascript.starterCode,
        java: q.variants.java.starterCode
      },
      testCases: [
        {
          input: 'Sample Test',
          expectedOutput: q.variants.python.example,
          isHidden: false
        }
      ]
    };

    await DsaQuestion.create(doc);
  }

  const count = await DsaQuestion.countDocuments();
  console.log(`🎉 Successfully seeded ${count} fresh questions into MongoDB Atlas!`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB.');
}

seedFresh().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
