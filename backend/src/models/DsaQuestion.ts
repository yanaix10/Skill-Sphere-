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
  category: string;
  points: number;
  languages?: {
    python?: ILanguageSpec;
    cpp?: ILanguageSpec;
    javascript?: ILanguageSpec;
    java?: ILanguageSpec;
    c?: ILanguageSpec;
    [key: string]: ILanguageSpec | undefined;
  };
  initialCode: Record<string, string>;
  testCases: ITestCase[];
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
