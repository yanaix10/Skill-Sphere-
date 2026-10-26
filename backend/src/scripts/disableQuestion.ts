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

function disableQuestion() {
  const args = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
  const targetId = args[0];

  if (!targetId) {
    console.error('Usage: npm run questions:disable -- <question_id>');
    console.error('Example: npm run questions:disable -- mbpp_12');
    process.exit(1);
  }

  const filePath = findQuestionsPath();
  if (!filePath) {
    console.error('❌ questions.json not found.');
    process.exit(1);
  }

  const questions: any[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const question = questions.find((q) => q.id === targetId || q.id === `mbpp_${targetId}`);

  if (!question) {
    console.error(`❌ Question with ID "${targetId}" not found in questions.json`);
    process.exit(1);
  }

  question.enabled = false;
  question.flagReason = `Manually disabled via CLI on ${new Date().toISOString()}`;

  fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));

  console.log(`✅ Question "${question.id}" (${question.title}) has been disabled.`);
}

disableQuestion();
