import mongoose, { Schema, Document } from 'mongoose';

export interface ILanguageSpec {
  starterCode: string;
  solution?: string;
  sampleTests?: string;
  testSuite: string;
  testPrefix?: string;
  testSuffix?: string;
}

export interface ITestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface IDsaQuestion extends Document {
  taskId?: number;
  name?: string;
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  
  // Unified 1v1 Challenge Fields
  challengeCategory?: 'dsa' | 'webdev';
  subCategory?: 'bugfix' | 'algo' | 'js' | 'ts' | 'react';
  difficultyLevel?: 1 | 2 | 3; // 1 (~1 min) | 2 (~2 mins) | 3 (~3-4 mins)
  tags?: string[];
  source?: 'mbpp' | 'humaneval' | 'quixbugs' | 'debugbench' | 'type-challenges' | 'freecodecamp' | string;
  executionEngine?: 'judge0' | 'sandpack' | 'in-browser-eval' | 'ts-compiler';
  starterCode?: string;
  solution?: string;
  testSuite?: string;
  sampleTests?: string;
  files?: Record<string, string>;

  category: string;
  points: number;
  languages?: {
    python?: ILanguageSpec;
    cpp?: ILanguageSpec;
    javascript?: ILanguageSpec;
    typescript?: ILanguageSpec;
    java?: ILanguageSpec;
    c?: ILanguageSpec;
    [key: string]: ILanguageSpec | undefined;
  };
  initialCode: Record<string, string>;
  testCases: ITestCase[];
  enabled?: boolean;
  createdAt: Date;
}

const testCaseSchema = new Schema<ITestCase>({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  isHidden: { type: Boolean, default: false }
}, { _id: false });

const languageSpecSchema = new Schema<ILanguageSpec>({
  starterCode: { type: String, required: true },
  solution: { type: String },
  sampleTests: { type: String },
  testSuite: { type: String, required: true },
  testPrefix: { type: String, default: "" },
  testSuffix: { type: String, default: "" }
}, { _id: false });

const dsaQuestionSchema = new Schema<IDsaQuestion>({
  taskId: { type: Number },
  name: { type: String },
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['EASY', 'MEDIUM', 'HARD'], default: 'EASY' },

  // Unified 1v1 Challenge Fields
  challengeCategory: { type: String, enum: ['dsa', 'webdev'], default: 'dsa' },
  subCategory: { type: String, enum: ['bugfix', 'algo', 'js', 'ts', 'react'], default: 'algo' },
  difficultyLevel: { type: Number, enum: [1, 2, 3], default: 1 },
  tags: { type: [String], default: [] },
  source: { type: String, default: 'mbpp' },
  executionEngine: { type: String, enum: ['judge0', 'sandpack', 'in-browser-eval', 'ts-compiler'], default: 'judge0' },
  starterCode: { type: String },
  solution: { type: String },
  testSuite: { type: String },
  sampleTests: { type: String },
  files: { type: Map, of: String, default: {} },
  enabled: { type: Boolean, default: true },

  category: { type: String, default: 'Algorithmic Challenges' },
  points: { type: Number, default: 10 },
  languages: {
    type: Map,
    of: languageSpecSchema,
    default: {}
  },
  initialCode: {
    type: Schema.Types.Mixed,
    default: {}
  },
  testCases: [testCaseSchema],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IDsaQuestion>('DsaQuestion', dsaQuestionSchema);
