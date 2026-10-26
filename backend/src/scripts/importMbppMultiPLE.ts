import "dotenv/config";
import mongoose from "mongoose";
import axios from "axios";
import DsaQuestion from "../models/DsaQuestion.js";

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/skillsphere";

interface MultiPLERow {
  name: string;
  language: string;
  prompt: string;
  tests: string;
}

/**
 * Clean translation artifacts from prompt text.
 */
function cleanPromptText(text: string): string {
  return text
    .replace(/\bcppthon\b/gi, "C++")
    .replace(/\bjsthon\b/gi, "JavaScript")
    .replace(/\bjavathon\b/gi, "Java")
    .replace(/\bpython\b/gi, "Python")
    .replace(/\/\/\s*Write a/gi, "Write a")
    .replace(/#\s*Write a/gi, "Write a")
    .trim();
}

/**
 * Convert an autoregressive function prompt ending in '{' into a complete starter function for humans.
 */
function formatHumanStarterCode(rawPrompt: string, lang: string): string {
  let cleaned = rawPrompt.trim();

  if (lang === "cpp") {
    // Remove #include directives from player's editor starter code (we provide them in testPrefix)
    cleaned = cleaned.replace(/#include\s*<[^>]+>\s*/g, "").trim();
    // Remove doc comments from the function signature area
    const lines = cleaned.split("\n");
    const funcLines = lines.filter(l => !l.startsWith("//") && !l.startsWith("/*") && !l.startsWith("*"));
    let codeBody = funcLines.join("\n").trim();
    if (codeBody.endsWith("{")) {
      return `${codeBody}\n    // Write your solution here\n    \n}`;
    }
    return codeBody;
  }

  if (lang === "python") {
    const lines = cleaned.split("\n");
    const funcLines = lines.filter(l => !l.startsWith("#"));
    let codeBody = funcLines.join("\n").trim();
    if (codeBody.endsWith(":")) {
      return `${codeBody}\n    # Write your solution here\n    pass`;
    }
    return codeBody;
  }

  if (lang === "javascript") {
    const lines = cleaned.split("\n");
    const funcLines = lines.filter(l => !l.startsWith("//"));
    let codeBody = funcLines.join("\n").trim();
    if (codeBody.endsWith("{")) {
      return `${codeBody}\n    // Write your solution here\n    \n}`;
    }
    return codeBody;
  }

  return cleaned;
}

/**
 * Clean test suffix by stripping leading '}'
 */
function cleanTests(rawTests: string): { sampleTests: string; testSuite: string } {
  let cleaned = rawTests.trim();
  if (cleaned.startsWith("}")) {
    cleaned = cleaned.substring(1).trim();
  }

  // Extract the first assertion as sample test
  const assertLines = cleaned
    .split("\n")
    .filter(line => line.includes("assert") || line.includes("candidate"));
  
  const sample = assertLines.slice(0, 2).join("\n") || cleaned;

  return {
    sampleTests: sample,
    testSuite: cleaned
  };
}

/**
 * Extract taskId from name: e.g. "mbpp_167_next_power_of_2" -> 167
 */
function parseTaskId(name: string): number | null {
  const match = name.match(/mbpp_(\d+)_/i);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Format a human-friendly title: e.g. "mbpp_167_next_power_of_2" -> "Next Power Of 2 (MBPP 167)"
 */
function formatTitle(name: string, taskId: number): string {
  const rest = name.replace(/mbpp_\d+_/i, "").replace(/_/g, " ");
  const capitalized = rest.replace(/\b\w/g, l => l.toUpperCase());
  return `${capitalized} (MBPP ${taskId})`;
}

/**
 * Fetch rows from Hugging Face Dataset Viewer API for a given MultiPL-E config.
 */
async function fetchDatasetRows(config: string, limit: number = 50): Promise<MultiPLERow[]> {
  const url = `https://datasets-server.huggingface.co/rows?dataset=nuprl%2FMultiPL-E&config=${encodeURIComponent(config)}&split=test&offset=0&limit=${limit}`;
  console.log(`📡 Fetching ${config} from Hugging Face...`);

  try {
    const res = await axios.get(url, {
      headers: { "User-Agent": "SkillSphere-DatasetImporter/1.0" },
      timeout: 15000
    });
    return (res.data.rows || []).map((r: any) => r.row);
  } catch (err: any) {
    console.error(`❌ Failed to fetch ${config}:`, err.message);
    return [];
  }
}

/**
 * Main importer function.
 */
export async function runImporter(limit: number = 30) {
  console.log("🚀 Starting MBPP MultiPL-E Dataset Importer...");

  const [cppRows, jsRows] = await Promise.all([
    fetchDatasetRows("mbpp-cpp", limit),
    fetchDatasetRows("mbpp-js", limit)
  ]);

  if (!cppRows.length) {
    console.warn("⚠️ No C++ rows fetched. Aborting import.");
    return;
  }

  const jsMap = new Map<number, MultiPLERow>();
  for (const row of jsRows) {
    const tid = parseTaskId(row.name);
    if (tid !== null) jsMap.set(tid, row);
  }

  const questionsToUpsert: any[] = [];

  for (const cppRow of cppRows) {
    const taskId = parseTaskId(cppRow.name);
    if (taskId === null) continue;

    const title = formatTitle(cppRow.name, taskId);

    // Extract description comment
    const commentMatch = cppRow.prompt.match(/\/\/\s*(.+?)(?:\n|$)/);
    const rawDescription = commentMatch ? commentMatch[1] : `Solve the algorithmic challenge: ${title}`;
    const description = cleanPromptText(rawDescription);

    const cppCleanedTests = cleanTests(cppRow.tests);
    const cppStarter = formatHumanStarterCode(cppRow.prompt, "cpp");

    const languages: Record<string, any> = {
      cpp: {
        starterCode: cppStarter,
        sampleTests: cppCleanedTests.sampleTests,
        testSuite: cppCleanedTests.testSuite
      }
    };

    const initialCode: Record<string, string> = {
      cpp: cppStarter
    };

    // Link JavaScript if available
    const jsRow = jsMap.get(taskId);
    if (jsRow) {
      const jsCleanedTests = cleanTests(jsRow.tests);
      const jsStarter = formatHumanStarterCode(jsRow.prompt, "javascript");
      languages.javascript = {
        starterCode: jsStarter,
        sampleTests: jsCleanedTests.sampleTests,
        testSuite: jsCleanedTests.testSuite
      };
      initialCode.javascript = jsStarter;
    }

    questionsToUpsert.push({
      taskId,
      name: cppRow.name,
      title,
      description,
      difficulty: taskId % 3 === 0 ? "HARD" : taskId % 2 === 0 ? "MEDIUM" : "EASY",
      category: "Algorithmic Challenges",
      points: taskId % 3 === 0 ? 30 : taskId % 2 === 0 ? 20 : 10,
      languages,
      initialCode,
      testCases: []
    });
  }

  console.log(`📦 Processed ${questionsToUpsert.length} questions.`);

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    let upsertedCount = 0;
    for (const q of questionsToUpsert) {
      await DsaQuestion.findOneAndUpdate(
        { taskId: q.taskId },
        { $set: q },
        { upsert: true, new: true }
      );
      upsertedCount++;
    }

    console.log(`🎉 Successfully synced ${upsertedCount} MultiPL-E questions into MongoDB!`);
    await mongoose.disconnect();
  } catch (err: any) {
    console.warn("⚠️ Could not connect to MongoDB for persistent upsert:", err.message);
  }
}

// Allow running directly via CLI: npx tsx src/scripts/importMbppMultiPLE.ts
if (process.argv[1] && process.argv[1].includes("importMbppMultiPLE")) {
  runImporter(40)
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
