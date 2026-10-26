import fs from 'fs';
import path from 'path';

function findQuestionsPath(): string {
  const candidates = [
    path.resolve(process.cwd(), 'data/questions.json'),
    path.resolve(process.cwd(), 'backend/data/questions.json'),
    path.resolve(process.cwd(), '../backend/data/questions.json')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return '';
}

function printStats() {
  const filePath = findQuestionsPath();
  if (!filePath) {
    console.error('❌ questions.json not found.');
    process.exit(1);
  }

  const questions: any[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const total = questions.length;
  const enabled = questions.filter((q) => q.enabled);
  const disabled = questions.filter((q) => !q.enabled);

  const tagCounts: Record<string, number> = {};
  const diffCounts: Record<string, number> = { EASY: 0, MEDIUM: 0, HARD: 0 };
  const estMinutesCounts: Record<number, number> = {};

  for (const q of enabled) {
    const primaryTag = q.tags?.[0] || 'other';
    tagCounts[primaryTag] = (tagCounts[primaryTag] || 0) + 1;

    const diff = q.estMinutes <= 2 ? 'EASY' : q.estMinutes === 3 ? 'MEDIUM' : 'HARD';
    diffCounts[diff] = (diffCounts[diff] || 0) + 1;

    estMinutesCounts[q.estMinutes] = (estMinutesCounts[q.estMinutes] || 0) + 1;
  }

  console.log('\n📊 ================================================');
  console.log('              CODING DUEL QUESTION STATS');
  console.log('================================================');
  console.log(`Total questions in dataset:    ${total}`);
  console.log(`Active & Enabled:              ${enabled.length} (${((enabled.length / total) * 100).toFixed(1)}%)`);
  console.log(`Disabled / Flagged:            ${disabled.length}\n`);

  console.log('📌 Difficulty Distribution (Enabled):');
  for (const [diff, count] of Object.entries(diffCounts)) {
    console.log(`   ${diff.padEnd(8)}: ${count}`);
  }

  console.log('\n⏱️ Estimated Solve Times:');
  for (const [mins, count] of Object.entries(estMinutesCounts)) {
    console.log(`   ~${mins} minutes: ${count} questions`);
  }

  console.log('\n🏷️ Primary Tags Breakdown:');
  for (const [tag, count] of Object.entries(tagCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${tag.padEnd(12)}: ${count}`);
  }
  console.log('================================================\n');
}

printStats();
