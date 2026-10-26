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

async function runQACppCompile() {
  console.log('🔍 Starting QA for C++ Starter Code + Harness Compilation...\n');

  const filePath = findQuestionsPath();
  if (!filePath) {
    console.error('❌ questions.json not found.');
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const questions: any[] = JSON.parse(raw);

  let tested = 0;
  let compiledOk = 0;
  let disabledCount = 0;
  const tmpDir = os.tmpdir();

  for (const q of questions) {
    if (!q.enabled || !q.variants?.cpp) continue;

    tested++;
    const fullProgram = `${q.variants.cpp.starterCode.trimEnd()}\n\n${q.variants.cpp.harness.trimStart()}`;
    const tmpSrc = path.join(tmpDir, `qa_cpp_${q.id}.cpp`);
    const tmpBin = path.join(tmpDir, `qa_cpp_${q.id}.out`);

    try {
      fs.writeFileSync(tmpSrc, fullProgram);
      // Compile with -std=c++17 -O2
      await execPromise(`g++ -std=c++17 -O2 "${tmpSrc}" -o "${tmpBin}"`, { timeout: 6000 });
      compiledOk++;
    } catch (err: any) {
      console.warn(`❌ [QA C++ Compile Fail] ${q.id} (${q.title}): ${err.stderr || err.message}`);
      q.enabled = false;
      q.flagReason = `QA Failed: C++ starter + harness did not compile (${err.message.slice(0, 100)})`;
      disabledCount++;
    } finally {
      if (fs.existsSync(tmpSrc)) fs.unlinkSync(tmpSrc);
      if (fs.existsSync(tmpBin)) fs.unlinkSync(tmpBin);
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));

  console.log('\n=======================================');
  console.log('         C++ COMPILE QA SUMMARY');
  console.log('=======================================');
  console.log(`Tested enabled questions:   ${tested}`);
  console.log(`Compiled successfully:      ${compiledOk}`);
  console.log(`Disabled due to errors:     ${disabledCount}`);
  console.log('Updated questions.json saved.');
  console.log('=======================================\n');
}

runQACppCompile().catch((err) => {
  console.error('QA C++ Compile error:', err);
  process.exit(1);
});
