import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import os from 'os';

const execPromise = util.promisify(exec);

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

async function runQAPython() {
  console.log('🔍 Starting QA for Python Reference Solutions against Test Harnesses...\n');

  const filePath = findQuestionsPath();
  if (!filePath) {
    console.error('❌ questions.json not found.');
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const questions: any[] = JSON.parse(raw);

  let tested = 0;
  let passed = 0;
  let disabledCount = 0;
  const tmpDir = os.tmpdir();

  for (const q of questions) {
    if (!q.enabled) continue;

    tested++;
    const fullProgram = `${q.pythonReference.trimEnd()}\n\n${q.variants.python.harness.trimStart()}`;
    const tmpFile = path.join(tmpDir, `qa_py_${q.id}.py`);

    try {
      fs.writeFileSync(tmpFile, fullProgram);
      await execPromise(`python3 "${tmpFile}"`, { timeout: 3000 });
      passed++;
    } catch (err: any) {
      console.warn(`❌ [QA Python Fail] ${q.id} (${q.title}): ${err.stderr || err.message}`);
      q.enabled = false;
      q.flagReason = `QA Failed: Reference solution did not pass harness (${err.message.slice(0, 100)})`;
      disabledCount++;
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));

  console.log('\n=======================================');
  console.log('         PYTHON QA SUMMARY');
  console.log('=======================================');
  console.log(`Tested enabled questions:   ${tested}`);
  console.log(`Passed reference suites:    ${passed}`);
  console.log(`Disabled due to failures:   ${disabledCount}`);
  console.log('Updated questions.json saved.');
  console.log('=======================================\n');
}

runQAPython().catch((err) => {
  console.error('QA Python error:', err);
  process.exit(1);
});
