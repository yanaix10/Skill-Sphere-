import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer {
  socketId: string;
  userDetails?: any;
  score: number;
  currentIndex: number;
}

export interface IChallengeSession extends Document {
  challengeId: string;
  players: IPlayer[];
  status: 'waiting' | 'ready' | 'started' | 'completed';
  winner?: any;
  questions: any[];
  createdAt: Date;
  updatedAt: Date;
}

const challengeSessionSchema = new Schema<IChallengeSession>({
  challengeId: {
    type: String,
    required: true,
    unique: true,
  },
  players: [{
    socketId: { type: String, required: true },
    userDetails: { type: Schema.Types.Mixed },
    score: { type: Number, default: 0 },
    currentIndex: { type: Number, default: 0 },
  }],
  status: {
    type: String,
    enum: ['waiting', 'ready', 'started', 'completed'],
    default: 'waiting',
  },
  winner: {
    type: Schema.Types.Mixed,
    default: null,
  },
  questions: {
    type: [Schema.Types.Mixed] as any,
    default: [],
  }
}, { timestamps: true });

const ChallengeSession = mongoose.model<IChallengeSession>('ChallengeSession', challengeSessionSchema);

export default ChallengeSession;
