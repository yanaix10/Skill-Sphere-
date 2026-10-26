import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
	id: string;
	text: string;
	type?: string;
	difficulty?: string;
	explanation?: string;
	category?: string;
	tags?: string[];
	answers: Array<{
		id: string;
		text: string;
		isCorrect: boolean;
	}>;
}

export interface ISession extends Document {
	userId: string;
	sessionType: 'practice' | 'challenge' | 'tournament';
	status: 'in-progress' | 'completed';
	questions: IQuestion[];
	userAnswers: Map<string, string>;
	score: number;
	createdAt: Date;
}

const questionSchema = new Schema<IQuestion>({
	id: { type: String, required: true },
	text: { type: String, required: true },
	type: { type: String },
	difficulty: { type: String },
	explanation: { type: String },
	category: { type: String },
	tags: [{ type: String }],
	answers: [{
		id: String,
		text: String,
		isCorrect: Boolean
	}]
}, { _id: false });

const sessionSchema = new Schema<ISession>({
	userId: {
		type: String,
		default: "guest"
	},
	sessionType: {
		type: String,
		enum: ['practice', 'challenge', 'tournament'],
		default: 'practice'
	},
	status: {
		type: String,
		enum: ['in-progress', 'completed'],
		default: 'in-progress'
	},
	questions: [questionSchema],
	userAnswers: {
		type: Map,
		of: String,
		default: {}
	},
	score: {
		type: Number,
		default: 0
	},
	createdAt: {
		type: Date,
		default: Date.now
	}
});

export default mongoose.model<ISession>('Session', sessionSchema);
